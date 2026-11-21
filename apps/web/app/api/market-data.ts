import {
  candleHistorySchema,
  marketSummarySchema,
  type MarketPair,
  type MarketTimeframe,
} from '@crypto-force/shared';

export async function getCandleHistory(
  input: { pair: MarketPair; timeframe: MarketTimeframe },
  signal: AbortSignal,
) {
  const response = await fetch(`/api/market-data/candles?${new URLSearchParams(input)}`, {
    signal,
  });
  if (!response.ok) throw new Error('Cannot load candle history.');
  const data = candleHistorySchema.parse(await response.json());
  if (data.pair !== input.pair || data.timeframe !== input.timeframe) {
    throw new Error('The candle history does not match the selection.');
  }
  return data;
}

export async function getMarketSummary(pair: MarketPair, signal: AbortSignal) {
  const response = await fetch(`/api/market-data/summary?${new URLSearchParams({ pair })}`, {
    signal,
  });
  if (!response.ok) throw new Error('Cannot load the market summary.');
  const data = marketSummarySchema.parse(await response.json());
  if (data.pair !== pair) throw new Error('The market summary does not match the selection.');
  return data;
}
