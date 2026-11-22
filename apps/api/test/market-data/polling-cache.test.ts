// Checks error retention through the public provider boundary with an injected clock.
// Run: pnpm --filter @crypto-force/api exec vitest run test/market-data/polling-cache.test.ts.
// Global setup requires the dedicated _test DB. Expected: ADR-008 in docs/architecture/30-decisions.md.
// The current product deletes typed errors immediately. Retention assertions fail on that defect.
import { expect, it, vi } from 'vitest';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider';
import { MarketDataProviderError } from '../../src/providers/market-data/market-data-provider';
import { capturingLogger, deferred } from './fixtures';

const request = { pair: 'BTCUSDT', timeframe: '5m', limit: 519 } as const;

it.each(['invalid', 'unavailable'] as const)(
  'retains a candle %s error until 5000 ms after rejection',
  async (kind) => {
    const pending = deferred<{ candles: []; dataTime: number }>();
    const error = new MarketDataProviderError(kind);
    const provider = {
      getCandles: vi.fn(),
      getSummary: vi.fn(),
    };
    provider.getCandles
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue({ candles: [], dataTime: 9000 });
    let now = 0;
    const cache = createCachedMarketDataProvider({
      provider,
      now: () => now,
      ttlMs: 5000,
      logger: capturingLogger().logger,
    });
    const first = expect(cache.getCandles(request)).rejects.toMatchObject({ kind });
    const joined = expect(cache.getCandles(request)).rejects.toMatchObject({ kind });
    now = 2000;
    pending.reject(error);
    await Promise.all([first, joined]);
    now = 6999;
    await expect(cache.getCandles(request)).rejects.toMatchObject({ kind });
    expect(provider.getCandles).toHaveBeenCalledTimes(1);
    now = 7000;
    await expect(cache.getCandles(request)).resolves.toEqual({ candles: [], dataTime: 9000 });
    expect(provider.getCandles).toHaveBeenCalledTimes(2);
  },
);

it.each([4999, 5000, 5001])('reads a summary error at elapsed %i ms', async (elapsed) => {
  const error = new MarketDataProviderError('unavailable');
  const provider = {
    getCandles: vi.fn(),
    getSummary: vi.fn(),
  };
  provider.getSummary
    .mockRejectedValueOnce(error)
    .mockResolvedValue({ pair: 'BTCUSDT', lastPrice: 123, change24hPercent: -1 });
  let now = 1000;
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => now,
    ttlMs: 5000,
    logger: capturingLogger().logger,
  });
  await expect(cache.getSummary('BTCUSDT')).rejects.toMatchObject({ kind: 'unavailable' });
  now = 1000 + elapsed;
  if (elapsed === 4999) {
    await expect(cache.getSummary('BTCUSDT')).rejects.toMatchObject({ kind: 'unavailable' });
    expect(provider.getSummary).toHaveBeenCalledTimes(1);
  } else {
    await expect(cache.getSummary('BTCUSDT')).resolves.toEqual({
      pair: 'BTCUSDT',
      lastPrice: 123,
      change24hPercent: -1,
    });
    expect(provider.getSummary).toHaveBeenCalledTimes(2);
  }
});

it('does not retain unexpected errors', async () => {
  const provider = {
    getCandles: vi
      .fn()
      .mockRejectedValueOnce(new Error('Unexpected source failure.'))
      .mockResolvedValue({ candles: [], dataTime: 7 }),
    getSummary: vi.fn(),
  };
  const cache = createCachedMarketDataProvider({
    provider,
    now: () => 0,
    ttlMs: 5000,
    logger: capturingLogger().logger,
  });
  await expect(cache.getCandles(request)).rejects.toThrow('Unexpected source failure.');
  await expect(cache.getCandles(request)).resolves.toEqual({ candles: [], dataTime: 7 });
  expect(provider.getCandles).toHaveBeenCalledTimes(2);
});
