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
        { openTime: 1799971200000, open: 100, high: 110, low: 90, close: 105, volume: 500 },
      ],
      ma20: [{ openTime: 1799971200000, value: 10.5 }],
    };
    const original = structuredClone(input);
    expect(toChartSeries(input)).toEqual({
      candles: [{ time: 1799971200, open: 100, high: 110, low: 90, close: 105 }],
      volume: [{ time: 1799971200, value: 500 }],
      ma20: [{ time: 1799971200, value: 10.5 }],
    });
    expect(input).toEqual(original);
  });
});
