// Checks the Binance boundary with injected HTTP and clocks. API setup requires the _test DB.
// Run API Vitest with test/market-data/binance.test.ts. Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md mapping/cooldown.
// The adapter does not exist yet. Mapping, cooldown and abort mutations remain Step 08 gates.
import { afterEach, expect, it, vi } from 'vitest';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider';
import { capturingLogger, deferred, klines } from './fixtures';
import closedCandles from './closed-candles.json';

const request = { pair: 'BTCUSDT', timeframe: '1m', limit: 519 } as const;
afterEach(() => vi.useRealTimers());

it('maps every closed candle and requests the specified source key', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(klines()));
  const provider = createBinanceMarketDataProvider({
    fetch,
    now: () => 1735720739999,
    timeoutMs: 5000,
    logger: capturingLogger().logger,
  });
  const result = await provider.getCandles(request);
  expect(result.candles.filter((item: { isClosed: boolean }) => item.isClosed)).toEqual(
    closedCandles,
  );
  expect(result.dataTime).toBe(1735720739999);
  const input = fetch.mock.calls[0]?.[0];
  if (!input) throw new Error('The provider did not call the HTTP fake.');
  const url = new URL(input instanceof Request ? input.url : input);
  expect(url.origin).toBe('https://api.binance.com');
  expect(url.pathname).toBe('/api/v3/klines');
  expect(Object.fromEntries(url.searchParams)).toEqual({
    symbol: 'BTCUSDT',
    interval: '1m',
    limit: '519',
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it.each([
  [1735689659998, false],
  [1735689659999, false],
  [1735689660000, true],
])('uses receipt time %i for isClosed=%s', async (receivedAt, isClosed) => {
  let now = 1735689600000;
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(() => {
    now = receivedAt;
    return Promise.resolve(
      Response.json([
        [
          1735689600000,
          '100.125',
          '102.875',
          '99.0625',
          '101.375',
          '12.625',
          1735689659999,
          '1262.5',
          7,
          '6.25',
          '631.25',
          '0',
        ],
      ]),
    );
  });
  const provider = createBinanceMarketDataProvider({
    fetch,
    now: () => now,
    timeoutMs: 5000,
    logger: capturingLogger().logger,
  });
  expect(await provider.getCandles(request)).toEqual({
    candles: [
      {
        openTime: 1735689600000,
        open: 100.125,
        high: 102.875,
        low: 99.0625,
        close: 101.375,
        volume: 12.625,
        isClosed,
      },
    ],
    dataTime: receivedAt,
  });
});

it.each([429, 418])(
  'shares Retry-After cooldown after status %i without automatic retry',
  async (status) => {
    let now = 1000;
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response('Source sentinel.', { status, headers: { 'Retry-After': '2' } }),
      )
      .mockResolvedValue(
        Response.json({ symbol: 'ETHUSDT', lastPrice: '218.5', priceChangePercent: '0' }),
      );
    const provider = createBinanceMarketDataProvider({
      fetch,
      now: () => now,
      timeoutMs: 5000,
      logger: capturingLogger().logger,
    });
    await expect(provider.getCandles(request)).rejects.toThrow();
    now = 2999;
    await expect(provider.getSummary('ETHUSDT')).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
    now = 3000;
    expect(await provider.getSummary('ETHUSDT')).toEqual({
      pair: 'ETHUSDT',
      lastPrice: 218.5,
      change24hPercent: 0,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  },
);

it.each([403, 500, 503])('does not retry status %i and permits the next caller', async (status) => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(new Response('Source failed.', { status }))
    .mockResolvedValue(Response.json([]));
  const provider = createProvider(fetch);
  await expect(provider.getCandles(request)).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(await provider.getCandles(request)).toEqual({ candles: [], dataTime: 1735689660000 });
  expect(fetch).toHaveBeenCalledTimes(2);
});

function createProvider(fetch: typeof globalThis.fetch) {
  return createBinanceMarketDataProvider({
    fetch,
    now: () => 1735689660000,
    timeoutMs: 5000,
    logger: capturingLogger().logger,
  });
}

it('aborts at the configured timeout and never accepts a late response', async () => {
  vi.useFakeTimers();
  const pending = deferred<Response>();
  let signal: AbortSignal | null | undefined;
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation((_url, init) => {
    signal = init?.signal;
    return pending.promise;
  });
  const provider = createProvider(fetch);
  let settled = false;
  const result = provider.getCandles(request);
  const rejection = expect(result).rejects.toThrow();
  void result.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  await vi.advanceTimersByTimeAsync(4999);
  expect(settled).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await rejection;
  expect(signal?.aborted).toBe(true);
  pending.resolve(Response.json(klines(1)));
  await vi.advanceTimersByTimeAsync(1);
  expect(fetch).toHaveBeenCalledTimes(1);
  await expect(result).rejects.toThrow();
});

it('rejects an upstream response above the requested limit', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(klines(520)));
  const provider = createBinanceMarketDataProvider({
    fetch,
    now: () => 1735720799999,
    timeoutMs: 5000,
    logger: capturingLogger().logger,
  });
  await expect(provider.getCandles(request)).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
});
