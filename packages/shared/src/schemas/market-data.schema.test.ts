import { expect, it } from 'vitest';
import { candleHistorySchema } from './market-data.schema';

// Checks the draft HTTP boundary in Node. Run: pnpm --filter @crypto-force/shared test.
// Invalid prices, duplicate times and unmatched MA points cannot become chart input.
// Disabling the consistency checks made this test fail.
it('rejects inconsistent prices, unordered times and unmatched MA points', () => {
  const candle = {
    openTime: 1799971200000,
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 500,
  };
  const history = { pair: 'BTCUSDT', timeframe: '1m', candles: [candle], ma20: [] };
  expect(candleHistorySchema.safeParse(history).success).toBe(true);
  for (const invalid of [
    { ...history, candles: [{ ...candle, high: 95 }] },
    { ...history, candles: [{ ...candle, low: 106 }] },
    { ...history, candles: [candle, candle] },
    { ...history, candles: [candle, { ...candle, openTime: 1799971140000 }] },
    { ...history, ma20: [{ openTime: 1799971260000, value: 102.5 }] },
    {
      ...history,
      ma20: [
        { openTime: 1799971200000, value: 102.5 },
        { openTime: 1799971200000, value: 103 },
      ],
    },
  ]) {
    expect(candleHistorySchema.safeParse(invalid).success).toBe(false);
  }
});
