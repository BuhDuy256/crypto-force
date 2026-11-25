import { useEffect } from 'react';
import { useRevalidator } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CandleHistory,
  MarketPair,
  MarketSummary,
  MarketTimeframe,
} from '@crypto-force/shared';
import { getCandleHistory, getMarketSummary, MarketDataRequestError } from '~/api/market-data';

const requestOptions = {
  retry: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  refetchOnWindowFocus: false,
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

export function useCandleHistory(pair: MarketPair, timeframe: MarketTimeframe, _live = true) {
  const client = useQueryClient();
  const queryKey = ['market-data', 'candles', pair, timeframe];
  const query = useQuery<CandleHistory>({
    ...requestOptions,
    staleTime: Infinity,
    queryKey,
    queryFn: async ({ signal }) => {
      const incoming = await getCandleHistory({ pair, timeframe }, signal);
      const current = client.getQueryData<CandleHistory>(queryKey);
      return current && incoming.dataTime < current.dataTime ? current : incoming;
    },
  });
  useSessionGate(query.error);
  return query;
}

export function useMarketSummary(pair: MarketPair, _live = true) {
  const client = useQueryClient();
  const queryKey = ['market-data', 'summary', pair];
  const query = useQuery<MarketSummary>({
    ...requestOptions,
    staleTime: Infinity,
    queryKey,
    queryFn: async ({ signal }) => {
      const incoming = await getMarketSummary(pair, signal);
      const current = client.getQueryData<MarketSummary>(queryKey);
      return current && incoming.dataTime < current.dataTime ? current : incoming;
    },
  });
  useSessionGate(query.error);
  return query;
}
