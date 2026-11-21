import { useEffect } from 'react';
import { useRevalidator } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import type { MarketPair, MarketTimeframe } from '@crypto-force/shared';
import { getCandleHistory, getMarketSummary, MarketDataRequestError } from '~/api/market-data';

const manualRefresh = {
  staleTime: Infinity,
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
} as const;

/**
 * A 401 from Market Data re-runs the workspace session check, so the root boundary shows the
 * sign-in gate at the current URL (docs/UCs/market-data.md, MK-40). The gate is the one of
 * docs/architecture/30-decisions.md, ADR-001.
 */
function useSessionGate(error: Error | null) {
  const { revalidate } = useRevalidator();
  const unauthenticated =
    error instanceof MarketDataRequestError && error.code === 'UNAUTHENTICATED';
  useEffect(() => {
    if (unauthenticated) void revalidate();
  }, [unauthenticated, revalidate]);
}

export function useCandleHistory(pair: MarketPair, timeframe: MarketTimeframe) {
  const query = useQuery({
    ...manualRefresh,
    queryKey: ['market-data', 'candles', pair, timeframe],
    queryFn: ({ signal }) => getCandleHistory({ pair, timeframe }, signal),
  });
  useSessionGate(query.error);
  return query;
}

export function useMarketSummary(pair: MarketPair) {
  const query = useQuery({
    ...manualRefresh,
    queryKey: ['market-data', 'summary', pair],
    queryFn: ({ signal }) => getMarketSummary(pair, signal),
  });
  useSessionGate(query.error);
  return query;
}
