// Checks REST candle cache invalidation on closed candle events through the cache decorator seam.
// Run: pnpm --filter @crypto-force/api exec vitest run test/market-data/cache-invalidation.test.ts.
// Requires the _test DB from API global setup; uses an injected provider fake and manual clock.
// Expected: docs/testing/test-scopes/TS-002-market-data/websocket-verification.md (seam S2).
// Pre-build red state: createCachedMarketDataProvider does not yet expose invalidateCandles.
// Fault checks (gate for build step): omitting invalidation or clearing unrelated keys must fail.
import { expect, it, vi } from 'vitest';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider';
import { MarketDataProviderError } from '../../src/providers/market-data/market-data-provider';
import { candles, capturingLogger } from './fixtures';

interface InvalidatableCache {
  invalidateCandles: (
    pair: 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT',
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
  ) => void;
}

it('invalidates cached candle snapshots for the closed pair and timeframe across limits while preserving other keys and summary', async () => {
  const provider = {
    getCandles: vi
      .fn()
      .mockResolvedValueOnce({ candles: candles(2, 300000), dataTime: 1735689899000 })
      .mockResolvedValueOnce({ candles: candles(2, 300000), dataTime: 1735689899000 })
      .mockResolvedValueOnce({ candles: candles(2, 900000), dataTime: 1735689899000 })
      .mockResolvedValueOnce({ candles: candles(2, 300000), dataTime: 1735689899000 })
      .mockResolvedValueOnce({
        candles: candles(2, 300000).map((item) => ({ ...item, isClosed: true })),
        dataTime: 1735689900500,
      })
      .mockResolvedValueOnce({
        candles: candles(2, 300000).map((item) => ({ ...item, isClosed: true })),
        dataTime: 1735689900500,
      }),
    getSummary: vi.fn().mockResolvedValue({
      pair: 'BTCUSDT',
      lastPrice: 618.125,
      change24hPercent: -1.25,
      dataTime: 1735689899000,
    }),
  };
  let now = 1000;
  const capture = capturingLogger();
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => now,
    ttlMs: 5000,
    logger: capture.logger,
  });

  await cache.getCandles({ pair: 'BTCUSDT', timeframe: '5m', limit: 519 });
  await cache.getCandles({ pair: 'BTCUSDT', timeframe: '5m', limit: 500 });
  await cache.getCandles({ pair: 'BTCUSDT', timeframe: '15m', limit: 519 });
  await cache.getCandles({ pair: 'ETHUSDT', timeframe: '5m', limit: 519 });
  await cache.getSummary('BTCUSDT');
  expect(provider.getCandles).toHaveBeenCalledTimes(4);
  expect(provider.getSummary).toHaveBeenCalledTimes(1);

  now = 2500;
  (cache as unknown as InvalidatableCache).invalidateCandles('BTCUSDT', '5m');

  await expect(cache.getCandles({ pair: 'BTCUSDT', timeframe: '5m', limit: 519 })).resolves.toEqual(
    {
      candles: [
        {
          openTime: 1735689600000,
          open: 100,
          high: 101,
          low: 99,
          close: 100,
          volume: 10,
          isClosed: true,
        },
        {
          openTime: 1735689900000,
          open: 101,
          high: 102,
          low: 100,
          close: 101,
          volume: 11,
          isClosed: true,
        },
      ],
      dataTime: 1735689900500,
    },
  );
  await expect(
    cache.getCandles({ pair: 'BTCUSDT', timeframe: '5m', limit: 500 }),
  ).resolves.toMatchObject({
    dataTime: 1735689900500,
  });
  await cache.getCandles({ pair: 'BTCUSDT', timeframe: '15m', limit: 519 });
  await cache.getCandles({ pair: 'ETHUSDT', timeframe: '5m', limit: 519 });
  await cache.getSummary('BTCUSDT');

  expect(provider.getCandles).toHaveBeenCalledTimes(6);
  expect(provider.getSummary).toHaveBeenCalledTimes(1);
});

it('keeps cached source errors on unaffected keys when another pair and timeframe invalidates', async () => {
  const getCandles = vi.fn();
  getCandles
    .mockRejectedValueOnce(new MarketDataProviderError('unavailable'))
    .mockResolvedValue({ candles: candles(1, 300000), dataTime: 1735689900500 });
  const provider = { getCandles, getSummary: vi.fn() };
  let now = 1000;
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => now,
    ttlMs: 5000,
    logger: capturingLogger().logger,
  });

  await expect(cache.getCandles({ pair: 'ETHUSDT', timeframe: '5m', limit: 519 })).rejects.toThrow(
    'The market data provider request failed.',
  );
  now = 2000;
  (cache as unknown as InvalidatableCache).invalidateCandles('BTCUSDT', '5m');
  await expect(cache.getCandles({ pair: 'ETHUSDT', timeframe: '5m', limit: 519 })).rejects.toThrow(
    'The market data provider request failed.',
  );
  expect(getCandles).toHaveBeenCalledTimes(1);
});
