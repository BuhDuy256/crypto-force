// Checks the approved service boundary in Node. The API Vitest setup requires the _test DB.
// Run: pnpm --filter @crypto-force/api exec vitest run test/market-data/service.test.ts.
// Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md, fixture/window and domain invariants. No production module mocks.
// Missing service code prevents assertions. Provider fault sensitivity must run after Step 08 is green.
import { expect, it, vi } from 'vitest';
import { createMarketDataService } from '../../src/services/market-data.service';
import { candles, capturingLogger } from './fixtures';
import closedCandles from './closed-candles.json';

it.each([
  [0, 0],
  [1, 0],
  [19, 0],
  [20, 0],
  [21, 0],
  [499, 0],
  [500, 0],
  [501, 1],
  [518, 18],
  [519, 19],
])('keeps %i real candles with warmup %i', async (count, warmupCount) => {
  const getCandles = vi
    .fn()
    .mockResolvedValue({ candles: candles(count), dataTime: 1735720739999 });
  const provider = { getCandles, getSummary: vi.fn() };
  const service = createMarketDataService({ provider, logger: capturingLogger().logger });
  const result = await service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' });
  expect(getCandles).toHaveBeenCalledExactlyOnceWith({
    pair: 'BTCUSDT',
    timeframe: '1m',
    limit: 519,
  });
  expect(result).toMatchObject({
    pair: 'BTCUSDT',
    timeframe: '1m',
    warmupCount,
    dataTime: 1735720739999,
  });
  expect(result.candles).toHaveLength(count);
  expect(result).not.toHaveProperty('ma20');
});

it('preserves every closed candle against the literal reference', async () => {
  const service = createMarketDataService({
    provider: {
      getCandles: vi.fn().mockResolvedValue({ candles: candles(), dataTime: 1735720739999 }),
      getSummary: vi.fn(),
    },
    logger: capturingLogger().logger,
  });
  const result = await service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' });
  expect(result.candles.filter((item: { isClosed: boolean }) => item.isClosed)).toEqual(
    closedCandles,
  );
});

it('keeps gaps without manufacturing candles', async () => {
  const input = candles(21).filter((_, i) => i !== 10);
  const service = createMarketDataService({
    provider: {
      getCandles: vi.fn().mockResolvedValue({ candles: input, dataTime: 1735690859999 }),
      getSummary: vi.fn(),
    },
    logger: capturingLogger().logger,
  });
  const result = await service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' });
  expect(result.candles).toEqual(input);
  expect(result.candles).toHaveLength(20);
  expect(result.candles).not.toContainEqual(expect.objectContaining({ openTime: 1735690200000 }));
});

it.each([{ high: 0 }, { volume: -1 }, { openTime: 1735689600001 }, { isClosed: 'false' }])(
  'rejects invalid domain data %j',
  async (change) => {
    const service = createMarketDataService({
      provider: {
        getCandles: vi.fn().mockResolvedValue({
          candles: [{ ...candles(1)[0], ...change }],
          dataTime: 1735689659999,
        }),
        getSummary: vi.fn(),
      },
      logger: capturingLogger().logger,
    });
    await expect(service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' })).rejects.toThrow();
  },
);

it('rejects 520 candles when the provider limit is 519', async () => {
  const getCandles = vi.fn().mockResolvedValue({ candles: candles(520), dataTime: 1735720799999 });
  const service = createMarketDataService({
    provider: { getCandles, getSummary: vi.fn() },
    logger: capturingLogger().logger,
  });
  await expect(service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' })).rejects.toThrow();
  expect(getCandles).toHaveBeenCalledExactlyOnceWith({
    pair: 'BTCUSDT',
    timeframe: '1m',
    limit: 519,
  });
});
