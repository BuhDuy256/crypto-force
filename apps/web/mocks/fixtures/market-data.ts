import {
  candleHistorySchema,
  marketSummarySchema,
  type MarketPair,
  type MarketTimeframe,
} from '@crypto-force/shared';

const intervals = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
};
const prices = { BTCUSDT: 67_000, ETHUSDT: 3_000, SOLUSDT: 150 };

export function candleFixture(pair: MarketPair, timeframe: MarketTimeframe) {
  const base = prices[pair];
  const step = base / 1000;
  const start = 1_799_971_200_000;
  // Closes are base + step * (1..24). MA(20) values below are precomputed means.
  return candleHistorySchema.parse({
    pair,
    timeframe,
    candles: Array.from({ length: 24 }, (_, index) => ({
      openTime: start + index * intervals[timeframe],
      open: base + step * index,
      high: base + step * (index + 2),
      low: base + step * (index - 1),
      close: base + step * (index + 1),
      volume: (index + 1) * 100,
    })),
    ma20: [10.5, 11.5, 12.5, 13.5, 14.5].map((mean, index) => ({
      openTime: start + (index + 19) * intervals[timeframe],
      value: base + step * mean,
    })),
  });
}

export function summaryFixture(pair: MarketPair) {
  return marketSummarySchema.parse({
    pair,
    lastPrice: prices[pair] * 1.024,
    change24hPercent: pair === 'ETHUSDT' ? -1.25 : 2.4,
  });
}
