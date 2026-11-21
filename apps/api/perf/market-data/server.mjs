import { AsyncLocalStorage } from 'node:async_hooks';
import { once } from 'node:events';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { Writable } from 'node:stream';
import express from 'express';
import { pino } from 'pino';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/configs/auth.ts';
import { createDatabase } from '../../src/database/client.ts';
import { createAuthEmails } from '../../src/services/auth-email.service.ts';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider.ts';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider.ts';

// This process owns a dedicated database. Only loopback HTTP and replay HTTP are allowed.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
process.loadEnvFile(resolve(root, '.env'));
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing.');
const target = new URL(process.env.DATABASE_URL);
target.pathname += '_market_data_perf_test';
const databaseName = target.pathname.slice(1);
if (!databaseName.endsWith('_market_data_perf_test'))
  throw new Error('The benchmark database name is invalid.');
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
await admin.connect();
if (!(await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName])).rowCount) {
  await admin.query(`CREATE DATABASE "${databaseName.replaceAll('"', '""')}"`);
}
await admin.end();
const { db, pool } = createDatabase(target.toString());
await migrate(drizzle({ client: pool }), { migrationsFolder: resolve(root, 'apps/api/drizzle') });
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/replay.json', import.meta.url), 'utf8'),
);
const context = new AsyncLocalStorage();
let active;
const cacheEvents = [];
const reconciliations = [];
const upstream = [];
const mails = [];
const unexpected = [];
const pending = [];
let barrier;
let fault;
let upstreamId = 0;
const eventLoop = monitorEventLoopDelay({ resolution: 20 });
eventLoop.enable();
function record(file, value) {
  if (active) appendFileSync(resolve(active, file), `${JSON.stringify(value)}\n`);
}
const logger = pino(
  { level: 'debug', mixin: () => ({ requestId: context.getStore()?.id }) },
  new Writable({
    write(chunk, _encoding, callback) {
      const source = JSON.parse(chunk.toString());
      const value = Object.fromEntries(
        [
          'time',
          'level',
          'requestId',
          'cacheState',
          'key',
          'method',
          'path',
          'status',
          'durationMs',
          'pair',
          'timeframe',
          'outcome',
          'providerDurationMs',
          'receivedCount',
          'usedWeight',
          'upstreamStatus',
        ]
          .filter((key) => source[key] !== undefined)
          .map((key) => [key, source[key]]),
      );
      record('api.jsonl', value);
      if (value.cacheState) {
        cacheEvents.push(value);
        const store = context.getStore();
        if (store) store.cacheState = value.cacheState;
        if (barrier && value.key === barrier.key && value.cacheState === 'join') {
          barrier.joined++;
          if (barrier.joined === barrier.waiters) {
            barrier.released = true;
            barrier.releasedAt = performance.now();
            pending.splice(0).forEach((release) => release());
          }
        }
      }
      callback();
    },
  }),
);
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (
    url.origin === 'https://api.pwnedpasswords.com' &&
    /^\/range\/[A-F0-9]{5}$/.test(url.pathname)
  )
    return Promise.resolve(new Response(''));
  if (['127.0.0.1', 'localhost'].includes(url.hostname)) return nativeFetch(input, init);
  unexpected.push(url.origin);
  record('errors.jsonl', { kind: 'unexpected-outbound', origin: url.origin });
  return Promise.reject(new Error('The benchmark blocked an external request.'));
};
const origin = 'http://127.0.0.1:5195';
const auth = createAuth({
  env: {
    NODE_ENV: 'test',
    BETTER_AUTH_URL: origin,
    BETTER_AUTH_SECRET: 'market-data-perf-local-secret-at-least-32-characters',
    GOOGLE_CLIENT_ID: undefined,
    GOOGLE_CLIENT_SECRET: undefined,
  },
  db,
  logger,
  emails: createAuthEmails(
    {
      send: (message) => {
        mails.push(message.text);
        return Promise.resolve();
      },
    },
    origin,
  ),
});
const replay = express();
replay.get(['/api/v3/klines', '/api/v3/ticker/24hr'], async (req, res) => {
  const start = performance.now();
  const pair = req.query.symbol;
  const key = req.path.endsWith('/klines') ? `${pair}:${req.query.interval}` : `summary:${pair}`;
  const entry = fixture.keys[key];
  if (!entry || (req.path.endsWith('/klines') && req.query.limit !== '519'))
    return res.status(400).json({ error: 'Invalid replay key.' });
  if (barrier && `candles:${pair}:${req.query.interval}:519` === barrier.key) {
    if (!barrier.released) await new Promise((done) => pending.push(done));
  } else await new Promise((done) => setTimeout(done, 50));
  const value = {
    id: ++upstreamId,
    key,
    start,
    end: performance.now(),
    utc: new Date().toISOString(),
    weight: req.path.endsWith('/klines') ? 2 : 2,
    weightModel: 'synthetic-v1',
    barrier: Boolean(barrier),
  };
  upstream.push(value);
  record('upstream.jsonl', value);
  res.json(
    fault === 'ohlcv' && Array.isArray(entry.raw)
      ? entry.raw.map((row, index) =>
          index === 30
            ? [row[0], row[1], row[2], row[3], String(Number(row[4]) + 1), ...row.slice(5)]
            : row,
        )
      : entry.raw,
  );
});
const replayServer = replay.listen(3026, '127.0.0.1');
await once(replayServer, 'listening');
const provider = createCachedMarketDataProvider({
  provider: createBinanceMarketDataProvider({
    fetch: (input, init) => {
      const url = new URL(String(input));
      if (
        url.origin !== 'https://api.binance.com' ||
        !['/api/v3/klines', '/api/v3/ticker/24hr'].includes(url.pathname)
      )
        throw new Error('The replay adapter received an unknown endpoint.');
      url.protocol = 'http:';
      url.host = '127.0.0.1:3026';
      return nativeFetch(url, init);
    },
    now: Date.now,
    timeoutMs: 5000,
    logger,
  }),
  now: Date.now,
  ttlMs: 5000,
  logger,
});
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  const requestPath = req.originalUrl.split('?')[0];
  const id =
    typeof req.headers['x-perf-id'] === 'string'
      ? req.headers['x-perf-id']
      : `browser-${crypto.randomUUID()}`;
  const store = { id };
  context.run(store, () => {
    res.setHeader('x-perf-id', id);
    const json = res.json.bind(res);
    res.json = (body) => {
      if (requestPath.startsWith('/api/market-data/')) {
        const isCandles = requestPath.endsWith('/candles');
        const key = isCandles
          ? `${req.query.pair}:${req.query.timeframe}`
          : `summary:${req.query.pair}`;
        const oracle = fixture.keys[key];
        const actual = isCandles ? body?.candles : body;
        const expected = isCandles ? oracle?.candles : oracle?.expected;
        const valid =
          res.statusCode === 200 &&
          JSON.stringify(actual) === JSON.stringify(expected) &&
          (!isCandles ||
            (body.warmupCount === 19 &&
              body.pair === req.query.pair &&
              body.timeframe === req.query.timeframe &&
              Number.isSafeInteger(body.dataTime)));
        const reconciliation = {
          id,
          key,
          status: res.statusCode,
          valid,
          count: body?.candles?.length,
          dataTime: body?.dataTime,
          cacheState: store.cacheState,
        };
        reconciliations.push(reconciliation);
        record('reconciliation.jsonl', reconciliation);
      }
      return json(body);
    };
    next();
  });
});
app.use(express.static(resolve(root, 'apps/web/build/client')));
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/'))
    return res.sendFile(resolve(root, 'apps/web/build/client/__spa-fallback.html'));
  next();
});
app.use(createApp({ logger, auth, authConfig: { google: false }, marketDataProvider: provider }));
const server = app.listen(5195, '127.0.0.1');
await once(server, 'listening');
const control = express();
control.use(express.json());
control.post('/begin', (req, res) => {
  if (fault) return res.status(409).json({ error: 'The benchmark fault is still active.' });
  if (!/^[a-zA-Z0-9_-]+$/.test(req.body.run)) return res.sendStatus(400);
  active = resolve(root, 'docs/testing/evidence/market-data', req.body.run);
  mkdirSync(active, { recursive: true });
  barrier = req.body.barrier
    ? { key: 'candles:BTCUSDT:5m:519', waiters: req.body.waiters, joined: 0 }
    : undefined;
  upstream.length = 0;
  cacheEvents.length = 0;
  reconciliations.length = 0;
  res.json({ pid: process.pid, database: databaseName });
});
control.get('/state', (_req, res) =>
  res.json({
    upstream,
    reconciliations: reconciliations.slice(-100),
    cacheEvents,
    unexpected,
    pending: pending.length,
    barrier,
    pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
  }),
);
control.post('/barrier', (req, res) => {
  barrier = { key: 'candles:BTCUSDT:5m:519', waiters: req.body.waiters, joined: 0 };
  res.json({ armed: true });
});
control.post('/release', (_req, res) => {
  barrier = undefined;
  pending.splice(0).forEach((release) => release());
  res.json({ released: true });
});
control.get('/mail', (_req, res) => res.json(mails.at(-1) ?? ''));
control.post('/fault', (req, res) => {
  if (active || ![null, 'ohlcv'].includes(req.body.fault)) return res.sendStatus(409);
  fault = req.body.fault;
  res.json({ fault });
});
control.get('/environment', async (_req, res) => {
  const info = (await pool.query('SELECT version(), pg_database_size(current_database()) AS bytes'))
    .rows[0];
  const counts = (
    await pool.query(
      'SELECT (SELECT count(*) FROM "user") AS users, (SELECT count(*) FROM "session") AS sessions',
    )
  ).rows[0];
  const migrations = (
    await pool.query('SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id')
  ).rows;
  res.json({
    databaseName,
    version: info.version,
    bytes: info.bytes,
    users: counts.users,
    sessions: counts.sessions,
    migrations,
  });
});
control.post('/end', (_req, res) => {
  active = undefined;
  barrier = undefined;
  pending.splice(0).forEach((release) => release());
  res.json({ ended: true });
});
const controlServer = control.listen(3025, '127.0.0.1');
const timer = setInterval(() => {
  record('resources.jsonl', {
    utc: new Date().toISOString(),
    monotonic: performance.now(),
    process: 'api-replay-web',
    cpu: process.cpuUsage(),
    memory: process.memoryUsage(),
    eventLoopP95Ms: eventLoop.percentile(95) / 1e6,
    connections: pool.totalCount,
    waiting: pool.waitingCount,
  });
  eventLoop.reset();
}, 1000);
const stop = () => {
  clearInterval(timer);
  eventLoop.disable();
  pending.splice(0).forEach((release) => release());
  replayServer.close();
  controlServer.close();
  server.close(() => {
    void pool.end();
  });
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
console.log(JSON.stringify({ ready: true, pid: process.pid }));
