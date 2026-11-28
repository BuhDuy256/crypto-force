import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ActiveBacktestResponse,
  BacktestRun,
  BacktestRunDetail,
  BacktestRunListResponse,
  CreateBacktestInput,
} from '@crypto-force/shared';
import {
  BacktestApiError,
  cancelBacktestRun,
  createBacktestRun,
  getActiveBacktest,
  getBacktestRun,
  listBacktestRuns,
} from '~/api/backtest';

export const backtestKeys = {
  all: ['backtests'] as const,
  list: () => [...backtestKeys.all, 'list'] as const,
  active: () => [...backtestKeys.all, 'active'] as const,
  detail: (id: string) => [...backtestKeys.all, 'detail', id] as const,
};

function runningPollDelay(isRunning: boolean) {
  return isRunning ? 1000 : false;
}

export function useBacktestRuns() {
  return useQuery<BacktestRunListResponse>({
    queryKey: backtestKeys.list(),
    queryFn: ({ signal }) => listBacktestRuns(signal),
    refetchInterval: (query) =>
      runningPollDelay(query.state.data?.runs.some((run) => run.status === 'running') ?? false),
  });
}

/**
 * The run that blocks a new manual backtest. A `404` means the backend does not serve this route
 * yet (Phase 5), so the existing workspace routes read it as no active run.
 */
export function useActiveBacktest() {
  return useQuery<ActiveBacktestResponse>({
    queryKey: backtestKeys.active(),
    queryFn: async ({ signal }) => {
      try {
        return await getActiveBacktest(signal);
      } catch (error) {
        if (error instanceof BacktestApiError && error.status === 404) {
          return { run: null };
        }
        throw error;
      }
    },
    retry: false,
    refetchInterval: (query) => runningPollDelay(query.state.data?.run != null),
  });
}

export function useBacktestRunDetail(id: string | null) {
  return useQuery<BacktestRunDetail>({
    queryKey: backtestKeys.detail(id ?? ''),
    enabled: id !== null,
    queryFn: ({ signal }) => getBacktestRun(id ?? '', signal),
    refetchInterval: (query) => runningPollDelay(query.state.data?.status === 'running'),
  });
}

function useInvalidateBacktests() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: backtestKeys.all });
  };
}

export function useCreateBacktest() {
  const invalidate = useInvalidateBacktests();
  return useMutation<BacktestRun, Error, CreateBacktestInput>({
    mutationFn: (input) => createBacktestRun(input),
    onSuccess: invalidate,
  });
}

export function useCancelBacktest() {
  const invalidate = useInvalidateBacktests();
  return useMutation<BacktestRun, Error, string>({
    mutationFn: (id) => cancelBacktestRun(id),
    onSuccess: invalidate,
  });
}
