import { expect, it } from 'vitest';
import { candleHistorySchema, marketSummarySchema } from '@crypto-force/shared';
import { toChartSeries } from '../app/utils/market-chart';
import { candleFixture, summaryFixture } from './fixtures/market-data';

// Checks development fixtures in Node. Run: pnpm --filter @crypto-force/web test.
// Closes normalized to 1..20 have a hand-calculated mean of 10.5.
// Changing the MA divisor from 20 to 19 made this test fail.
it('provides valid fixtures with client MA20 for each pair and timeframe', () => {
  for (const pair of ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const) {
    expect(marketSummarySchema.safeParse(summaryFixture(pair)).success).toBe(true);
    for (const timeframe of ['1m', '5m', '15m', '1h', '4h', '1d'] as const) {
      expect(candleHistorySchema.safeParse(candleFixture(pair, timeframe)).success).toBe(true);
    }
  }
  const history = candleFixture('BTCUSDT', '1m');
  expect(history.candles.slice(0, 20).map((candle) => (candle.close - 67000) / 67)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  ]);
  expect(toChartSeries(history).ma20).toEqual([
    { time: 1799972340, value: 67703.5 },
    { time: 1799972400, value: 67770.5 },
    { time: 1799972460, value: 67837.5 },
    { time: 1799972520, value: 67904.5 },
    { time: 1799972580, value: 67971.5 },
  ]);
  expect((toChartSeries(history).ma20[0]?.value ?? 0) - 67000).toBeCloseTo(703.5);
  expect(((toChartSeries(history).ma20[0]?.value ?? 0) - 67000) / 67).toBeCloseTo(10.5);
});
