// Runs real Express and Better Auth on the integration _test DB with an injected provider.
// Run API Vitest with test/market-data/http.test.ts. Expected: REST HTTP contract and error envelope.
// Provider bypass mutations and outbound-fault sensitivity remain Step 08 gates.
import { once } from 'node:events';
import { createServer } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApp } from '../../src/app';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider';
import {
  controlClock,
  createHarness,
  createIpPool,
  createVerifiedAccount,
  pool,
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
  provider.getCandles.mockReset();
  provider.getSummary.mockReset();
});
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
  provider.getSummary.mockResolvedValue({ pair: 'ETHUSDT', lastPrice: 218.5, change24hPercent: 0 });
  const response = await get('summary?pair=ETHUSDT');
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await response.json()).toEqual({ pair: 'ETHUSDT', lastPrice: 218.5, change24hPercent: 0 });
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
    provider.getCandles.mockImplementation((input) => adapter.getCandles(input));
    provider.getSummary.mockImplementation((pair) => adapter.getSummary(pair));
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
