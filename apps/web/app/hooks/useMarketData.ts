import { useEffect } from 'react';
import { useRevalidator } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CandleHistory, MarketPair, MarketTimeframe } from '@crypto-force/shared';
import { getCandleHistory, getMarketSummary, MarketDataRequestError } from '~/api/market-data';

const pollingIntervalMs = 5000;
const requestOptions = {
  retry: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
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

export function useCandleHistory(pair: MarketPair, timeframe: MarketTimeframe, live = true) {
  const client = useQueryClient();
  const queryKey = ['market-data', 'candles', pair, timeframe];
  const query = useQuery<CandleHistory>({
    ...requestOptions,
    staleTime: live ? pollingIntervalMs : Infinity,
    refetchInterval: (current) =>
      live && current.state.data !== undefined ? pollingIntervalMs : false,
    refetchOnWindowFocus: (current) =>
      live && current.state.data !== undefined ? 'always' : false,
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

export function useMarketSummary(pair: MarketPair, live = true) {
  const query = useQuery({
    ...requestOptions,
    staleTime: live ? pollingIntervalMs : Infinity,
    refetchInterval: live ? pollingIntervalMs : false,
    refetchOnWindowFocus: live ? 'always' : false,
    queryKey: ['market-data', 'summary', pair],
    queryFn: ({ signal }) => getMarketSummary(pair, signal),
  });
  useSessionGate(query.error);
  return query;
}
