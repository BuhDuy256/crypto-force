import { expect, it } from 'vitest';
import { candleHistorySchema } from './market-data.schema';

// Checks the REST HTTP boundary in Node. Run: pnpm --filter @crypto-force/shared test.
// Invalid prices, duplicate times cannot become chart input.
// Disabling the consistency checks made this test fail.
it('rejects inconsistent prices, unordered times', () => {
  const candle = {
    openTime: 1799971200000,
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 500,
    isClosed: true,
  };
  const history = {
    pair: 'BTCUSDT',
    timeframe: '1m',
    candles: [candle],
    warmupCount: 0,
    dataTime: 1799971260000,
  };
  expect(candleHistorySchema.safeParse(history).success).toBe(true);
  for (const invalid of [
    { ...history, candles: [{ ...candle, high: 95 }] },
    { ...history, candles: [{ ...candle, low: 106 }] },
    { ...history, candles: [candle, candle] },
    { ...history, candles: [candle, { ...candle, openTime: 1799971140000 }] },
  ]) {
    expect(candleHistorySchema.safeParse(invalid).success).toBe(false);
  }
});
