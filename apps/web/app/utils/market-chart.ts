import { marketPairPriceDecimals, type CandleHistory, type MarketPair } from '@crypto-force/shared';
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

/**
 * Price with the pair decimals, rounded half-up only for display (ADR-005). Intl rounds with
 * `halfExpand`, which equals half-up for the positive prices of the contract.
 */
export function formatPrice(pair: MarketPair, value: number) {
  const digits = marketPairPriceDecimals[pair];
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatVolume(value: number) {
  return value.toLocaleString('en-US');
}

/** Date and time in the device time zone, with the zone name (docs/UCs/market-data.md, MK-43). */
export function formatDateTime(epochMs: number) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).format(epochMs);
}
