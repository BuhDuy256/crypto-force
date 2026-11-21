import { useQuery } from '@tanstack/react-query';
import type { MarketPair, MarketTimeframe } from '@crypto-force/shared';
import { getCandleHistory, getMarketSummary } from '~/api/market-data';

const manualRefresh = {
  staleTime: Infinity,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
} as const;

export function useCandleHistory(pair: MarketPair, timeframe: MarketTimeframe) {
  return useQuery({
    ...manualRefresh,
    queryKey: ['market-data', 'candles', pair, timeframe],
    queryFn: ({ signal }) => getCandleHistory({ pair, timeframe }, signal),
  });
}

export function useMarketSummary(pair: MarketPair) {
  return useQuery({
    ...manualRefresh,
    queryKey: ['market-data', 'summary', pair],
    queryFn: ({ signal }) => getMarketSummary(pair, signal),
  });
}
