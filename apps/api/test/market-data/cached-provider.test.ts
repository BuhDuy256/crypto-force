// Checks cache behavior through the provider boundary. Run API Vitest with test/market-data.
// The _test DB is required by global setup. Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md cache state table.
// TTL starts when the inner provider resolves (approved 2026-11-21): fresh while elapsed < ttlMs.
// Fault checks: bypassing single-flight or retaining rejection must fail the waiter assertions.
import type { MarketPair } from '@crypto-force/shared';
import { describe, expect, it, vi } from 'vitest';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider';
import { candles, capturingLogger, deferred } from './fixtures';

const request = { pair: 'BTCUSDT', timeframe: '1m', limit: 519 } as const;

it('shares pending work and preserves the received snapshot on a fresh hit', async () => {
  const pending = deferred<{ candles: ReturnType<typeof candles>; dataTime: number }>();
  const provider = { getCandles: vi.fn(() => pending.promise), getSummary: vi.fn() };
  let now = 1735689659999;
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => now,
    ttlMs: 5000,
    logger: capturingLogger().logger,
  });
  const first = cache.getCandles(request);
  const second = cache.getCandles(request);
  expect(provider.getCandles).toHaveBeenCalledTimes(1);
  pending.resolve({ candles: candles(1), dataTime: 1735689659999 });
  const snapshot = {
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
    dataTime: 1735689659999,
  };
  await first.then((value) => {
    expect(value).toEqual(snapshot);
  });
  await second.then((value) => {
    expect(value).toEqual(snapshot);
  });
  now = 1735689660001;
  expect(await cache.getCandles(request)).toEqual(snapshot);
  expect(provider.getCandles).toHaveBeenCalledTimes(1);
});

it('logs miss, join and hit for the requested candle key', async () => {
  const pending = deferred<{ candles: ReturnType<typeof candles>; dataTime: number }>();
  const capture = capturingLogger();
  const cache = createCachedMarketDataProvider({
    provider: { getCandles: () => pending.promise, getSummary: vi.fn() },
    now: () => 0,
    ttlMs: 5000,
    logger: capture.logger,
  });
  const first = cache.getCandles(request);
  const second = cache.getCandles(request);
  pending.resolve({ candles: [], dataTime: 1 });
  await Promise.all([first, second]);
  await cache.getCandles(request);
  expect(capture.records).toEqual([
    expect.objectContaining({ level: 20, key: 'candles:BTCUSDT:1m:519', cacheState: 'miss' }),
    expect.objectContaining({ level: 20, key: 'candles:BTCUSDT:1m:519', cacheState: 'join' }),
    expect.objectContaining({ level: 20, key: 'candles:BTCUSDT:1m:519', cacheState: 'hit' }),
  ]);
});

it('shares summary waiters, expires at TTL and retries after an expired refresh fails', async () => {
  const pending = deferred<{
    pair: MarketPair;
    lastPrice: number;
    change24hPercent: number;
    dataTime: number;
  }>();
  const provider = {
    getCandles: vi.fn(),
    getSummary: vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockRejectedValueOnce(new Error('Source failed.'))
      .mockResolvedValue({
        pair: 'SOLUSDT',
        lastPrice: 150.25,
        change24hPercent: -2,
        dataTime: 7000,
      }),
  };
  let now = 0;
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => now,
    ttlMs: 5000,
    logger: capturingLogger().logger,
  });
  const first = cache.getSummary('SOLUSDT');
  const second = cache.getSummary('SOLUSDT');
  expect(provider.getSummary).toHaveBeenCalledTimes(1);
  now = 2000;
  pending.resolve({ pair: 'SOLUSDT', lastPrice: 149.75, change24hPercent: -1, dataTime: 2000 });
  await first.then((value) => {
    expect(value).toEqual({
      pair: 'SOLUSDT',
      lastPrice: 149.75,
      change24hPercent: -1,
      dataTime: 2000,
    });
  });
  await second.then((value) => {
    expect(value).toEqual({
      pair: 'SOLUSDT',
      lastPrice: 149.75,
      change24hPercent: -1,
      dataTime: 2000,
    });
  });
  now = 6999;
  await expect(cache.getSummary('SOLUSDT')).resolves.toEqual({
    pair: 'SOLUSDT',
    lastPrice: 149.75,
    change24hPercent: -1,
    dataTime: 2000,
  });
  expect(provider.getSummary).toHaveBeenCalledTimes(1);
  now = 7000;
  await expect(cache.getSummary('SOLUSDT')).rejects.toThrow('Source failed.');
  await expect(cache.getSummary('SOLUSDT')).resolves.toEqual({
    pair: 'SOLUSDT',
    lastPrice: 150.25,
    change24hPercent: -2,
    dataTime: 7000,
  });
  expect(provider.getSummary).toHaveBeenCalledTimes(3);
});

it('rejects all waiters and retries only on the next caller', async () => {
  const pending = deferred<never>();
  const provider = {
    getCandles: vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue({ candles: [], dataTime: 1 }),
    getSummary: vi.fn(),
  };
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => 0,
    ttlMs: 5000,
    logger: capturingLogger().logger,
  });
  const first = expect(cache.getCandles(request)).rejects.toThrow('Source failed.');
  const second = expect(cache.getCandles(request)).rejects.toThrow('Source failed.');
  pending.reject(new Error('Source failed.'));
  await Promise.all([first, second]);
  expect(provider.getCandles).toHaveBeenCalledTimes(1);
  await expect(cache.getCandles(request)).resolves.toEqual({ candles: [], dataTime: 1 });
  expect(provider.getCandles).toHaveBeenCalledTimes(2);
});

it('separates pair, timeframe, limit and summary namespaces', async () => {
  const provider = {
    getCandles: vi.fn().mockResolvedValue({ candles: [], dataTime: 1 }),
    getSummary: vi.fn().mockImplementation((pair: MarketPair) =>
      Promise.resolve({
        pair,
        lastPrice: pair === 'ETHUSDT' ? 218.5 : 618.125,
        change24hPercent: pair === 'ETHUSDT' ? 0 : -1.25,
      }),
    ),
  };
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => 0,
    ttlMs: 5000,
    logger: capturingLogger().logger,
  });
  for (const input of [
    request,
    { ...request, pair: 'ETHUSDT' },
    { ...request, timeframe: '5m' },
    { ...request, limit: 500 },
  ] as const) {
    await cache.getCandles(input);
  }
  await cache.getCandles(request);
  expect(provider.getCandles.mock.calls).toEqual([
    [request],
    [{ pair: 'ETHUSDT', timeframe: '1m', limit: 519 }],
    [{ pair: 'BTCUSDT', timeframe: '5m', limit: 519 }],
    [{ pair: 'BTCUSDT', timeframe: '1m', limit: 500 }],
  ]);
  expect(await cache.getSummary('BTCUSDT')).toEqual({
    pair: 'BTCUSDT',
    lastPrice: 618.125,
    change24hPercent: -1.25,
  });
  await cache.getSummary('BTCUSDT');
  await cache.getSummary('ETHUSDT');
  expect(provider.getSummary.mock.calls).toEqual([['BTCUSDT'], ['ETHUSDT']]);
});

describe('TTL counted from provider resolution, not from request start', () => {
  // Request starts at clock 0, provider resolves at 2000. Each read starts from a fresh cache.
  it.each([
    { readAt: 6999, providerCalls: 1 },
    { readAt: 7000, providerCalls: 2 },
    { readAt: 7001, providerCalls: 2 },
  ])(
    'read at $readAt makes $providerCalls provider calls in total',
    async ({ readAt, providerCalls }) => {
      const pending = deferred<{ candles: ReturnType<typeof candles>; dataTime: number }>();
      const provider = {
        getCandles: vi
          .fn()
          .mockReturnValueOnce(pending.promise)
          .mockResolvedValue({ candles: [], dataTime: 2 }),
        getSummary: vi.fn(),
      };
      let now = 0;
      const cache = createCachedMarketDataProvider({
        provider,
        now: () => now,
        ttlMs: 5000,
        logger: capturingLogger().logger,
      });
      const first = cache.getCandles(request);
      now = 2000;
      pending.resolve({ candles: candles(1), dataTime: 1 });
      await first;
      now = readAt;
      await cache.getCandles(request);
      expect(provider.getCandles).toHaveBeenCalledTimes(providerCalls);
    },
  );
});
