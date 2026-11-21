import { describe, expect, it } from 'vitest';
import { toChartSeries } from './market-chart';

// Checks the pure chart mapper in Node. Run: pnpm --filter @crypto-force/web test.
// Unix milliseconds become seconds. The sample OHLCV values must remain unchanged.
// Removing timestamp division by 1000 made this test fail.
describe('chart series', () => {
  it('maps timestamps and preserves OHLCV without changing the input', () => {
    const input = {
      pair: 'BTCUSDT' as const,
      timeframe: '1m' as const,
      candles: [
        {
          openTime: 1799971200000,
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 500,
          isClosed: true,
        },
      ],
      warmupCount: 0,
      dataTime: 1799971260000,
    };
    const original = structuredClone(input);
    expect(toChartSeries(input)).toEqual({
      candles: [{ time: 1799971200, open: 100, high: 110, low: 90, close: 105 }],
      volume: [{ time: 1799971200, value: 500 }],
      ma20: [],
    });
    expect(input).toEqual(original);
  });
});

it('hides warmup candles and keeps their closes in MA20', () => {
  const history = {
    pair: 'ETHUSDT' as const,
    timeframe: '1m' as const,
    candles: Array.from({ length: 519 }, (_, index) => ({
      openTime: 1799971200000 + index * 60000,
      open: index + 1,
      high: index + 1,
      low: index + 1,
      close: index + 1,
      volume: 1,
      isClosed: true,
    })),
    warmupCount: 19,
    dataTime: 1800002340000,
  };

  expect(toChartSeries(history).candles).toHaveLength(500);
  expect(toChartSeries(history).volume).toHaveLength(500);
  expect(toChartSeries(history).ma20).toHaveLength(500);
  expect(toChartSeries(history).candles[0]?.time).toBe(1799972340);
  expect(toChartSeries(history).ma20[0]).toEqual({ time: 1799972340, value: 10.5 });
  expect(toChartSeries(history).ma20.at(-1)?.value).toBe(509.5);
});
