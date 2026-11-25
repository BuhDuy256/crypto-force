// Runs real Express and Better Auth on the integration _test DB with an injected provider.
// Run API Vitest with test/market-data/http.test.ts. Expected: REST HTTP contract, safe logs and error envelope.
// Session bypass, query stripping and error disclosure mutations fail assertions.
// Provider rejection and malformed outbound JSON reach the HTTP error assertions.
// Wrong log status, missing duration and credential disclosure mutations fail log assertions.
// Raw Auth callback and unmatched URL path mutations disclose tokens and fail assertions.
import { once } from 'node:events';
import { createServer } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '../../src/app';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider';
import {
  MarketDataProviderError,
  type MarketDataProvider,
} from '../../src/providers/market-data/market-data-provider';
import {
  APP_URL,
  controlClock,
  createHarness,
  createIpPool,
  createVerifiedAccount,
  pool,
  newResetToken,
  TEST_SECRET,
} from '../support/harness';
import { outbound, resetOutbound } from '../support/outbound';
import { candles } from './fixtures';

const fetchLoopback = globalThis.fetch;
const h = createHarness();
const provider = { getCandles: vi.fn(), getSummary: vi.fn() };
const dependencies = {
  logger: h.logger,
  auth: h.auth,
  authConfig: { google: false },
  marketDataProvider: provider,
};
const server = createServer(createApp(dependencies));
let origin = '';
let cookie = '';
beforeAll(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('The loopback server has no TCP address.');
  origin = `http://127.0.0.1:${String(address.port)}`;
  cookie = (await createVerifiedAccount(h, createIpPool(81))).cookie;
});
beforeEach(() => {
  h.logs.length = 0;
  provider.getCandles.mockReset();
  provider.getSummary.mockReset();
});

it('keeps the reset callback token out of HTTP logs while preserving its redirect', async () => {
  const ip = createIpPool(84);
  const account = await createVerifiedAccount(h, ip);
  const token = await newResetToken(h, account.email, ip());
  h.logs.length = 0;
  const callback = new URL(`/api/auth/reset-password/${token}`, origin);
  callback.searchParams.set('callbackURL', `${APP_URL}/reset-password`);
  const response = await fetchLoopback(callback, { redirect: 'manual' });
  expect(response.status).toBe(302);
  const location = new URL(response.headers.get('location') ?? '', APP_URL);
  expect(location.pathname).toBe('/reset-password');
  expect(location.searchParams.get('token')).toBe(token);
  await response.text();
  expect(JSON.stringify(h.logs)).not.toContain(token);
  expect(h.logs.find((entry) => entry.method === 'GET')).toMatchObject({
    path: '/api/auth/{*splat}',
    status: 302,
  });
});

it('keeps unknown URL path segments out of HTTP logs', async () => {
  const response = await fetchLoopback(`${origin}/private/Private-path-token`);
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({
    error: { code: 'NOT_FOUND', message: 'Resource not found' },
  });
  expect(JSON.stringify(h.logs)).not.toContain('Private-path-token');
  expect(h.logs.find((entry) => entry.method === 'GET')).toMatchObject({
    path: '/unmatched',
    status: 404,
  });
});

it.each(['candles?pair=BTCUSDT&timeframe=1m', 'summary?pair=BTCUSDT'])(
  'returns a safe 503 with no-store for unavailable source on %s',
  async (path) => {
    const fault = new MarketDataProviderError('unavailable', {
      cause: new Error('Private network sentinel.'),
    });
    provider.getCandles.mockRejectedValue(fault);
    provider.getSummary.mockRejectedValue(fault);
    const response = await get(path);
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(await response.json()).toEqual({
      error: { code: 'MARKET_DATA_UNAVAILABLE', message: 'The market data is unavailable.' },
    });
  },
);

it.each([200, 400, 401, 502, 503, 500])(
  'logs HTTP method, path, status and duration without credentials for status %s',
  async (status) => {
    if (status === 500) provider.getSummary.mockRejectedValue(new Error(TEST_SECRET));
    else if (status === 503)
      provider.getSummary.mockRejectedValue(new MarketDataProviderError('unavailable'));
    else if (status === 502) provider.getSummary.mockResolvedValue({ pair: 'BTCUSDT' });
    else
      provider.getSummary.mockResolvedValue({
        pair: 'BTCUSDT',
        lastPrice: 271.25,
        change24hPercent: -2,
        dataTime: 1735689659999,
      });
    const response = await fetchLoopback(
      `${origin}/api/market-data/summary?pair=BTCUSDT${status === 400 ? '&secret=Private-query-sentinel' : ''}`,
      {
        headers: {
          cookie: status === 401 ? 'Private-cookie-sentinel' : cookie,
          authorization: 'Bearer Private-token-sentinel',
        },
      },
    );
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toContain('no-store');
    await response.text();
    const record = h.logs.find((entry) => entry.method === 'GET');
    expect(record).toMatchObject({ method: 'GET', path: '/api/market-data/summary', status });
    expect(record?.durationMs).toEqual(expect.any(Number));
    expect(Number.isFinite(record?.durationMs)).toBe(true);
    expect(record?.durationMs).toBeGreaterThanOrEqual(0);
    const logs = JSON.stringify(h.logs);
    for (const credential of [
      cookie,
      'Private-cookie-sentinel',
      'Private-token-sentinel',
      'Private-query-sentinel',
      TEST_SECRET,
    ])
      expect(logs).not.toContain(credential);
  },
);
afterEach(() => {
  expect(outbound.unexpected).toEqual([]);
  resetOutbound();
  vi.useRealTimers();
  vi.clearAllMocks();
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    }),
  );
  await pool.end();
});

async function get(path: string, session = cookie) {
  return fetchLoopback(`${origin}/api/market-data/${path}`, { headers: { cookie: session } });
}

async function errorBody(response: Response) {
  return z
    .object({ error: z.object({ code: z.string(), message: z.string().min(1) }) })
    .parse(await response.json());
}

it.each(['candles?pair=BTCUSDT&timeframe=1m', 'summary?pair=BTCUSDT'])(
  'rejects missing session for %s without calling the provider',
  async (path) => {
    const response = await get(path, '');
    expect(response.status).toBe(401);
    expect(await errorBody(response)).toMatchObject({
      error: { code: 'UNAUTHENTICATED' },
    });
    expect(provider.getCandles).not.toHaveBeenCalled();
    expect(provider.getSummary).not.toHaveBeenCalled();
  },
);

it.each(['candles?pair=BTCUSDT&timeframe=abc', 'summary?pair=DOGEUSDT'])(
  'checks the session before the query for %s',
  async (path) => {
    const response = await get(path, '');
    expect(response.status).toBe(401);
    expect(await errorBody(response)).toMatchObject({
      error: { code: 'UNAUTHENTICATED' },
    });
    expect(provider.getCandles).not.toHaveBeenCalled();
    expect(provider.getSummary).not.toHaveBeenCalled();
  },
);

it.each([
  'candles?pair=BTCUSDT',
  'candles?pair=BTCUSDT&timeframe=1m&limit=1',
  'candles?pair=BTCUSDT&pair=ETHUSDT&timeframe=1m',
  'summary?pair=BTCUSDT&timeframe=1m',
  'summary?pair=DOGEUSDT',
])('rejects invalid query %s without calling the provider', async (path) => {
  const response = await get(path);
  expect(response.status).toBe(400);
  expect(await errorBody(response)).toMatchObject({
    error: { code: 'INVALID_QUERY' },
  });
  expect(provider.getCandles).not.toHaveBeenCalled();
  expect(provider.getSummary).not.toHaveBeenCalled();
});

it('returns a candle snapshot with no-store', async () => {
  provider.getCandles.mockResolvedValue({ candles: candles(1), dataTime: 1735689659999 });
  const response = await get('candles?pair=BTCUSDT&timeframe=1m');
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await response.json()).toEqual({
    pair: 'BTCUSDT',
    timeframe: '1m',
    warmupCount: 0,
    dataTime: 1735689659999,
    candles: [
      {
        openTime: 1735689600000,
        open: 100,
        high: 101,
        low: 99,
        close: 100,
        volume: 10,
        isClosed: false,
      },
    ],
  });
  expect(provider.getCandles).toHaveBeenCalledExactlyOnceWith({
    pair: 'BTCUSDT',
    timeframe: '1m',
    limit: 519,
  });
});

it('rejects invalid source data with 502', async () => {
  provider.getCandles.mockResolvedValue({
    candles: [{ ...candles(1)[0], volume: -1 }],
    dataTime: 1735689659999,
  });
  const response = await get('candles?pair=BTCUSDT&timeframe=1m');
  expect(response.status).toBe(502);
  expect(await errorBody(response)).toMatchObject({
    error: { code: 'MARKET_DATA_INVALID' },
  });
});

it('hides unexpected provider error details behind 500', async () => {
  provider.getCandles.mockRejectedValue(new Error('Private upstream sentinel.'));
  const response = await get('candles?pair=BTCUSDT&timeframe=1m');
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

it('denies a revoked session even after a successful data request', async () => {
  const account = await createVerifiedAccount(h, createIpPool(82));
  provider.getCandles.mockResolvedValue({ candles: [], dataTime: 1735689659999 });
  expect((await get('candles?pair=BTCUSDT&timeframe=1m', account.cookie)).status).toBe(200);
  const signout = await h.call('/sign-out', { body: {}, cookie: account.cookie });
  expect(signout.status).toBe(200);
  provider.getCandles.mockClear();
  const response = await get('candles?pair=BTCUSDT&timeframe=1m', account.cookie);
  expect(response.status).toBe(401);
  expect(await errorBody(response)).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  expect(provider.getCandles).not.toHaveBeenCalled();
});

it('rejects an expired session without invoking the provider', async () => {
  const clock = controlClock();
  const account = await createVerifiedAccount(h, createIpPool(83));
  clock.at(604801);
  const response = await get('candles?pair=BTCUSDT&timeframe=1m', account.cookie);
  expect(response.status).toBe(401);
  expect(await errorBody(response)).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
  expect(provider.getCandles).not.toHaveBeenCalled();
});

it('returns the selected pair summary without fetching candles', async () => {
  provider.getSummary.mockResolvedValue({
    pair: 'ETHUSDT',
    lastPrice: 218.5,
    change24hPercent: 0,
    dataTime: 1735689659999,
  });
  const response = await get('summary?pair=ETHUSDT');
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await response.json()).toEqual({
    pair: 'ETHUSDT',
    lastPrice: 218.5,
    change24hPercent: 0,
    dataTime: 1735689659999,
  });
  expect(provider.getSummary).toHaveBeenCalledExactlyOnceWith('ETHUSDT');
  expect(provider.getCandles).not.toHaveBeenCalled();
});

it('rejects excess provider candles with 502 instead of truncating them', async () => {
  provider.getCandles.mockResolvedValue({ candles: candles(520), dataTime: 1735720799999 });
  const response = await get('candles?pair=BTCUSDT&timeframe=1m');
  expect(response.status).toBe(502);
  expect(await errorBody(response)).toMatchObject({ error: { code: 'MARKET_DATA_INVALID' } });
  expect(provider.getCandles).toHaveBeenCalledExactlyOnceWith({
    pair: 'BTCUSDT',
    timeframe: '1m',
    limit: 519,
  });
});

it.each(['candles', 'summary'] as const)(
  'returns 502 for malformed upstream JSON on %s',
  async (resource) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response('Private malformed payload {', {
        headers: { 'content-type': 'application/json' },
      }),
    );
    const adapter = createBinanceMarketDataProvider({
      fetch,
      now: () => 1735720799999,
      timeoutMs: 5000,
      logger: h.logger,
    });
    provider.getCandles.mockImplementation(
      (input: Parameters<MarketDataProvider['getCandles']>[0]) => adapter.getCandles(input),
    );
    provider.getSummary.mockImplementation(
      (pair: Parameters<MarketDataProvider['getSummary']>[0]) => adapter.getSummary(pair),
    );
    const path =
      resource === 'candles' ? 'candles?pair=BTCUSDT&timeframe=1m' : 'summary?pair=BTCUSDT';
    const response = await get(path);
    expect(response.status).toBe(502);
    const rawBody: unknown = await response.clone().json();
    expect(JSON.stringify(rawBody)).not.toContain('Private malformed payload');
    const body = await errorBody(response);
    expect(body).toMatchObject({ error: { code: 'MARKET_DATA_INVALID' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
