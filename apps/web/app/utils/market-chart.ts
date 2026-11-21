import type { CandleHistory } from '@crypto-force/shared';
import type { UTCTimestamp } from 'lightweight-charts';

export function toChartSeries(history: CandleHistory) {
  const visible = history.candles.slice(history.warmupCount);
  const ma20 = history.candles.flatMap((candle, index) => {
    if (index < 19 || index < history.warmupCount) return [];
    const value =
      history.candles.slice(index - 19, index + 1).reduce((sum, point) => sum + point.close, 0) /
      20;
    return [{ time: (candle.openTime / 1000) as UTCTimestamp, value }];
  });
  return {
    candles: visible.map(({ openTime, open, high, low, close }) => ({
      time: (openTime / 1000) as UTCTimestamp,
      open,
      high,
      low,
      close,
    })),
    volume: visible.map(({ openTime, volume }) => ({
      time: (openTime / 1000) as UTCTimestamp,
      value: volume,
    })),
    ma20,
  };
}
