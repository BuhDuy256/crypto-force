// Checks cache behavior through the provider boundary. Run API Vitest with test/market-data.
// The _test DB is required by global setup. Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md cache state table.
// No exact TTL boundary or delayed-resolution TTL assertion is approved yet.
// Single-flight and rejected-promise retention mutations must run after the original tests pass.
import type { MarketPair } from '@crypto-force/shared';
import { expect, it, vi } from 'vitest';
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
  expect(await first).toEqual(snapshot);
  expect(await second).toEqual(snapshot);
  now = 1735689660001;
  expect(await cache.getCandles(request)).toEqual(snapshot);
  expect(provider.getCandles).toHaveBeenCalledTimes(1);
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
  expect(await cache.getCandles(request)).toEqual({ candles: [], dataTime: 1 });
  expect(provider.getCandles).toHaveBeenCalledTimes(2);
});

it('separates pair, timeframe, limit and summary namespaces', async () => {
  const provider = {
    getCandles: vi.fn().mockResolvedValue({ candles: [], dataTime: 1 }),
    getSummary: vi
      .fn()
      .mockImplementation((pair: MarketPair) =>
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
