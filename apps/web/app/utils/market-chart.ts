import type { CandleHistory } from '@crypto-force/shared';
import type { UTCTimestamp } from 'lightweight-charts';

export function toChartSeries(history: CandleHistory) {
  return {
    candles: history.candles.map(({ openTime, open, high, low, close }) => ({
      time: (openTime / 1000) as UTCTimestamp,
      open,
      high,
      low,
      close,
    })),
    volume: history.candles.map(({ openTime, volume }) => ({
      time: (openTime / 1000) as UTCTimestamp,
      value: volume,
    })),
    ma20: history.ma20.map(({ openTime, value }) => ({
      time: (openTime / 1000) as UTCTimestamp,
      value,
    })),
  };
}
