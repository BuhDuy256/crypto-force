// Runs a real Express API, WebSocket Gateway, Stream Hub, Better Auth and dedicated
// _market_data_ws_test PostgreSQL database for WebSocket E2E tests.
// Starts from apps/web/playwright.market-data-ws.config.ts on API port 3017, control port 3018
// and local fake Binance WS replay port 3019. Only upstream Binance HTTP and WS are faked.
// Anchors every timeframe's last REST candle closeTime at replayNow so the final candle is open
// (isClosed: false) and loads frozen reference candles from ws-reference-dataset.json.
// Resets cache, emails, ingress REST counter and fault flags on POST /__ws/reset so tests stay isolated.
// Pre-build red state: WebSocket production modules do not exist yet, so startup fails on import
// until the build step adds them.
// Fault checks (gate for build step): dropping replay ticks, ignoring disconnect commands or
// bypassing outbound guards must fail the E2E assertions.
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import express from 'express';
import pg from 'pg';
import { pino } from 'pino';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { createApp } from '../../src/app';
import { attachMarketDataWs } from '../../src/api/ws/market-data.ws';
import { createAuth } from '../../src/configs/auth';
import { createDatabase } from '../../src/database/client';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider';
import { createBinanceStreamProvider } from '../../src/providers/market-data/binance-stream.provider';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider';
import { createSessionRepository } from '../../src/repositories/session.repository';
import { createAuthEmails } from '../../src/services/auth-email.service';
import { createMarketDataStreamHub } from '../../src/services/market-data-stream.service';
import { createWsSessionService } from '../../src/services/ws-session.service';
import { deferred, klines } from '../market-data/fixtures';

const referenceDataset = JSON.parse(
  readFileSync(new URL('../market-data/ws-reference-dataset.json', import.meta.url), 'utf8'),
) as {
  liveCloseRollover5m: { closingCandle: { openTime: number } };
};

process.loadEnvFile(new URL('../../../../.env', import.meta.url));
const configured = process.env.DATABASE_URL;
if (!configured) throw new Error('DATABASE_URL is missing.');
const target = new URL(configured);
target.pathname += '_market_data_ws_test';
const databaseName = target.pathname.slice(1);
const quoted = `"${databaseName.replaceAll('"', '""')}"`;
const admin = new pg.Client({ connectionString: configured });
await admin.connect();
try {
  await admin.query(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${quoted}`);
} finally {
  await admin.end();
}
const { db, pool } = createDatabase(target.toString());
await migrate(drizzle({ client: pool }), {
  migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
});

function rawDataToString(raw: RawData): string {
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
  return Buffer.from(raw).toString('utf8');
}

const logger = pino({ level: 'silent' });
const sent: string[] = [];
const apiRestRequests: string[] = [];
const restLedger: string[] = [];
const unexpected: string[] = [];
const upstreamSockets = new Set<WebSocket>();
let activeClientWs = 0;
let restFailureTimeframe: string | null = null;
let holdBackfill = false;
let heldBackfill = deferred<undefined>();
// Anchor replayNow at the exact closeTime of the 519th 5m candle so closeTime < dataTime is false
// (the final candle of every timeframe arrives as isClosed: false, matching live WS openTime).
const REPLAY_NOW = referenceDataset.liveCloseRollover5m.closingCandle.openTime + 300_000 - 1;

const fakeUpstreamWs = new WebSocketServer({ host: '127.0.0.1', port: 3019 });
await once(fakeUpstreamWs, 'listening');
fakeUpstreamWs.on('connection', (socket) => {
  upstreamSockets.add(socket);
  socket.on('close', () => {
    upstreamSockets.delete(socket);
  });
  socket.on('message', (raw) => {
    const body = JSON.parse(rawDataToString(raw)) as { id?: number };
    if (body.id !== undefined) socket.send(JSON.stringify({ result: null, id: body.id }));
  });
});

const revokeRef: { current?: (sessionId: string) => void } = {};
const auth = createAuth({
  env: {
    NODE_ENV: 'test',
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    BETTER_AUTH_URL: 'http://localhost:5186',
    BETTER_AUTH_SECRET: 'market-ws-test-secret-at-least-32-characters',
  },
  db,
  emails: createAuthEmails(
    {
      send(message) {
        sent.push(message.text);
        return Promise.resolve();
      },
    },
    'http://localhost:5186',
  ),
  logger,
  onSessionRevoked(sessionId: string) {
    revokeRef.current?.(sessionId);
  },
});

const fakeFetch: typeof globalThis.fetch = (input) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (
    url.origin !== 'https://api.binance.com' ||
    !['/api/v3/klines', '/api/v3/ticker/24hr'].includes(url.pathname)
  ) {
    unexpected.push(url.origin);
    return Promise.reject(
      new Error('The WS test server blocked an unknown upstream HTTP endpoint.'),
    );
  }
  restLedger.push(url.toString());
  const interval = url.searchParams.get('interval') ?? '5m';
  if (restFailureTimeframe === interval) {
    return Promise.resolve(new Response('Private upstream sentinel.', { status: 503 }));
  }
  if (url.pathname === '/api/v3/ticker/24hr') {
    const pair = url.searchParams.get('symbol') ?? 'BTCUSDT';
    return Promise.resolve(
      Response.json({
        symbol: pair,
        lastPrice: pair === 'ETHUSDT' ? '718.00' : '618.00',
        priceChangePercent: '-1.25',
      }),
    );
  }
  const steps: Record<string, number> = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
  };
  const step = steps[interval] ?? 300000;
  const body = klines(519, step);
  const shift = Math.floor(REPLAY_NOW / step) * step - (1735689600000 + 518 * step);
  for (const row of body) {
    row[0] = Number(row[0]) + shift;
    row[6] = Number(row[6]) + shift;
  }
  if (url.searchParams.get('symbol') === 'ETHUSDT') {
    for (const row of body) {
      for (const index of [1, 2, 3, 4]) row[index] = String(Number(row[index]) + 100);
    }
  }
  return Promise.resolve(Response.json(body));
};

const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (
    url.origin === 'https://api.pwnedpasswords.com' &&
    /^\/range\/[A-F0-9]{5}$/.test(url.pathname)
  )
    return Promise.resolve(new Response(''));
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return nativeFetch(input, init);
  unexpected.push(url.origin);
  return Promise.reject(new Error('The WS test server blocked an external request.'));
};

function createCachedProvider() {
  return createCachedMarketDataProvider({
    provider: createBinanceMarketDataProvider({
      fetch: fakeFetch,
      now: () => REPLAY_NOW,
      timeoutMs: 5000,
      logger,
    }),
    now: Date.now,
    ttlMs: 5000,
    logger,
  });
}

let cachedProvider = createCachedProvider();
const marketDataProvider = {
  getCandles: (...args: Parameters<typeof cachedProvider.getCandles>) =>
    cachedProvider.getCandles(...args),
  getSummary: (...args: Parameters<typeof cachedProvider.getSummary>) =>
    cachedProvider.getSummary(...args),
};

const streamProvider = createBinanceStreamProvider({
  wsUrl: 'ws://127.0.0.1:3019/stream',
  now: Date.now,
  logger,
});
const streamHub = createMarketDataStreamHub({
  streamProvider,
  onCandleClosed(pair, timeframe) {
    (
      cachedProvider as unknown as { invalidateCandles: (p: string, tf: string) => void }
    ).invalidateCandles(pair, timeframe);
  },
  now: Date.now,
  logger,
});
const wsSessionService = createWsSessionService({
  sessionRepository: createSessionRepository(db),
  now: Date.now,
});

const app = express();
app.disable('x-powered-by');
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/market-data/')) {
    apiRestRequests.push(req.originalUrl);
    if (holdBackfill) {
      void heldBackfill.promise.then(() => {
        next();
      });
      return;
    }
  }
  next();
});
app.use(
  createApp({
    logger,
    auth,
    authConfig: { google: false },
    marketDataProvider,
  }),
);
const server = createServer(app);
server.on('upgrade', (req, socket) => {
  if (req.url === '/api/market-data/ws') {
    activeClientWs += 1;
    socket.once('close', () => {
      activeClientWs = Math.max(0, activeClientWs - 1);
    });
  }
});
const gateway = attachMarketDataWs({
  server,
  auth,
  wsSessionService,
  streamHub,
  allowedOrigin: 'http://localhost:5186',
  requireTls: false,
  maxConnectionsPerUser: 4,
  logger,
  now: Date.now,
});
revokeRef.current = (sessionId) => {
  gateway.revokeSession(sessionId);
};

const control = express();
control.use(express.json());
control.post('/__ws/reset', (_req, res) => {
  sent.length = 0;
  apiRestRequests.length = 0;
  restLedger.length = 0;
  unexpected.length = 0;
  restFailureTimeframe = null;
  holdBackfill = false;
  heldBackfill.resolve(undefined);
  heldBackfill = deferred<undefined>();
  cachedProvider = createCachedProvider();
  res.json({ ok: true, replayNow: REPLAY_NOW });
});
control.post('/__ws/emit', (req, res) => {
  const payload = JSON.stringify(req.body);
  for (const socket of upstreamSockets) socket.send(payload);
  res.json({ deliveredToUpstreamSockets: upstreamSockets.size });
});
control.post('/__ws/upstream-drop', (_req, res) => {
  for (const socket of upstreamSockets) socket.close(1011, 'Private upstream sentinel.');
  res.json({ dropped: true });
});
control.post('/__ws/rest-control', (req, res) => {
  const body = req.body as {
    failTimeframe?: string | null;
    holdBackfill?: boolean;
    clearCache?: boolean;
  };
  if (body.clearCache) cachedProvider = createCachedProvider();
  if (body.failTimeframe !== undefined) restFailureTimeframe = body.failTimeframe;
  if (body.holdBackfill !== undefined) {
    holdBackfill = body.holdBackfill;
    if (!holdBackfill) {
      heldBackfill.resolve(undefined);
      heldBackfill = deferred<undefined>();
    }
  }
  res.json({ restFailureTimeframe, holdBackfill });
});
control.get('/__ws/ledger', (_req, res) => {
  res.json({
    apiRestRequests,
    restLedger,
    unexpected,
    upstreamSockets: upstreamSockets.size,
    activeClientWs,
  });
});
control.get('/__ws/mail', (_req, res) => {
  res.json(sent);
});

const controlServer = control.listen(3018, '127.0.0.1');
server.listen(3017, '127.0.0.1');
await once(server, 'listening');

const stop = () => {
  controlServer.close();
  void gateway.close().finally(() => {
    void streamHub.close().finally(() => {
      fakeUpstreamWs.close();
      server.close(() => {
        void pool.end();
      });
    });
  });
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
