// Runs a real Express API and Auth against a dedicated _market_data_rest_test DB.
// Starts from playwright.market-data-rest.config.ts. Only upstream HTTP uses a fake.
// Scenarios: full, empty, short, held (upstream BTC/5m waits for release), chart-error (5m 503),
// summary-error (24h ticker 503),
// unavailable, gap (index 10 removed), flat (flat, rising and falling candles), open (last 5m candle
// open, other timeframes empty) and web-hold (the HTTP request for BTC/5m candles waits for release
// before the API handles it, so the Web deadline can end it without an API or upstream timeout).
// Faults tried: ETH rows without the +100 offset and a 5m error sent for every interval made the
// related E2E tests fail; the gap fixture that keeps index 10 made the gap test fail.
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import express from 'express';
import { pino } from 'pino';
import { createApp } from '../../src/app';
import { createAuth } from '../../src/configs/auth';
import { createDatabase } from '../../src/database/client';
import { createAuthEmails } from '../../src/services/auth-email.service';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider';
import { deferred, klines } from '../market-data/fixtures';

process.loadEnvFile(new URL('../../../../.env', import.meta.url));
const configured = process.env.DATABASE_URL;
if (!configured) throw new Error('DATABASE_URL is missing.');
const target = new URL(configured);
target.pathname += '_market_data_rest_test';
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
const logger = pino({ level: 'silent' });
const sent: string[] = [];
const auth = createAuth({
  env: {
    NODE_ENV: 'test',
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
    BETTER_AUTH_URL: 'http://localhost:5185',
    BETTER_AUTH_SECRET: 'market-rest-test-secret-at-least-32-characters',
  },
  db,
  emails: createAuthEmails(
    {
      send(message) {
        sent.push(message.text);
        return Promise.resolve();
      },
    },
    'http://localhost:5185',
  ),
  logger,
});
const ledger: string[] = [];
const unexpected: string[] = [];
let scenario = 'full';
let held = deferred<Response>();
let webHeld = deferred<undefined>();
let webHeldCount = 0;
// Close time of the last of 519 5m candles: that candle is open, the earlier ones are closed.
const OPEN_5M_DATA_TIME = 1735689600000 + 519 * 300000 - 1;
const fakeFetch: typeof globalThis.fetch = (input) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (
    url.origin !== 'https://api.binance.com' ||
    !['/api/v3/klines', '/api/v3/ticker/24hr'].includes(url.pathname)
  ) {
    unexpected.push(url.origin);
    return Promise.reject(new Error('The REST upstream fake blocked an unknown endpoint.'));
  }
  ledger.push(url.toString());
  if (scenario === 'unavailable')
    return Promise.resolve(new Response('Private source sentinel.', { status: 503 }));
  const pair = url.searchParams.get('symbol');
  if (
    scenario === 'chart-error' &&
    url.pathname === '/api/v3/klines' &&
    url.searchParams.get('interval') === '5m'
  )
    return Promise.resolve(new Response('Private upstream sentinel.', { status: 503 }));
  if (
    scenario === 'held' &&
    pair === 'BTCUSDT' &&
    url.pathname === '/api/v3/klines' &&
    url.searchParams.get('interval') === '5m'
  )
    return held.promise;
  if (scenario === 'summary-error' && url.pathname === '/api/v3/ticker/24hr')
    return Promise.resolve(new Response('Private upstream sentinel.', { status: 503 }));
  if (url.pathname === '/api/v3/ticker/24hr')
    return Promise.resolve(
      Response.json({
        symbol: pair,
        lastPrice: pair === 'ETHUSDT' ? '218.5' : '618.125',
        priceChangePercent: pair === 'ETHUSDT' ? '0' : '-1.25',
      }),
    );
  const intervals: Record<string, number> = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
  };
  const interval = url.searchParams.get('interval') ?? '1m';
  // Same default as klines(): an interval outside the table uses 1m.
  const step = intervals[interval] ?? 60000;
  const body =
    scenario === 'gap'
      ? klines(21, step).filter((_, index) => index !== 10)
      : scenario === 'flat'
        ? flatKlines(step)
        : klines(
            scenario === 'empty' || (scenario === 'open' && interval !== '5m')
              ? 0
              : scenario === 'short'
                ? 19
                : 519,
            step,
          );
  if (url.searchParams.get('symbol') === 'ETHUSDT') {
    for (const row of body) {
      for (const index of [1, 2, 3, 4]) row[index] = String(Number(row[index]) + 100);
    }
  }
  return Promise.resolve(Response.json(body));
};
// 20 candles at 100 with volume 0, then one rising (100/102/99/101) and one falling (101/102/99/100).
function flatKlines(interval: number) {
  return klines(22, interval).map((row, index) => {
    const ohlc =
      index < 20
        ? ['100', '100', '100', '100']
        : index === 20
          ? ['100', '102', '99', '101']
          : ['101', '102', '99', '100'];
    return [row[0], ...ohlc, index < 20 ? '0' : '5', ...row.slice(6)];
  });
}
// Auth password checks use an empty Pwned Passwords response. Other external fetch calls are blocked.
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
  return Promise.reject(new Error('The REST test server blocked an external request.'));
};
function provider() {
  const receivedAt = scenario === 'open' ? OPEN_5M_DATA_TIME : 1800000000000;
  return createCachedMarketDataProvider({
    provider: createBinanceMarketDataProvider({
      fetch: fakeFetch,
      now: () => receivedAt,
      timeoutMs: 5000,
      logger,
    }),
    now: () => 0,
    ttlMs: 5000,
    logger,
  });
}
let current = provider();
const marketDataProvider = {
  getCandles: (...args: Parameters<typeof current.getCandles>) => current.getCandles(...args),
  getSummary: (...args: Parameters<typeof current.getSummary>) => current.getSummary(...args),
};
const dependencies = { logger, auth, authConfig: { google: false }, marketDataProvider };
const app = express();
// Same response headers as createApp, which also disables x-powered-by.
app.disable('x-powered-by');
app.use((req, _res, next) => {
  if (
    scenario === 'web-hold' &&
    req.path === '/api/market-data/candles' &&
    req.query.pair === 'BTCUSDT' &&
    req.query.timeframe === '5m'
  ) {
    webHeldCount += 1;
    void webHeld.promise.then(() => {
      next();
    });
    return;
  }
  next();
});
app.use(createApp(dependencies));
const control = express();
// Control endpoints are confined to this test entrypoint and loopback listener.
control.post('/__rest/reset/:scenario', (req, res) => {
  scenario = req.params.scenario;
  held.resolve(Response.json(klines(519, 300000)));
  held = deferred<Response>();
  webHeld.resolve(undefined);
  webHeld = deferred<undefined>();
  webHeldCount = 0;
  ledger.length = 0;
  unexpected.length = 0;
  current = provider();
  res.json({ scenario });
});
control.post('/__rest/release', (_req, res) => {
  held.resolve(Response.json(klines(519, 300000)));
  webHeld.resolve(undefined);
  res.json({ released: true });
});
control.get('/__rest/ledger', (_req, res) => {
  res.json({ ledger, unexpected, webHeld: webHeldCount });
});
control.get('/__rest/mail', (_req, res) => {
  res.json(sent);
});
const controlServer = control.listen(3016, '127.0.0.1');
const server = app.listen(3015, '127.0.0.1');
await once(server, 'listening');
const stop = () => {
  controlServer.close();
  server.close(() => {
    void pool.end();
  });
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
