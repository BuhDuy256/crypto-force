import { useEffect, useRef } from 'react';
import type { BacktestRun } from '@crypto-force/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getBacktestRun } from '~/api/backtest';
import { backtestKeys } from './useBacktests';

const NOTICE_DURATION_MS = 8000;

/**
 * Shows a toast when the running backtest finishes or fails, on any workspace screen.
 * A cancelled run gets no toast, because the person who cancelled it already sees a message.
 */
export function useBacktestFinishNotice(activeRun: BacktestRun | null): void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const lastRunningId = useRef<string | null>(null);
  const runningId = activeRun?.status === 'running' ? activeRun.id : null;

  useEffect(() => {
    const previousId = lastRunningId.current;
    lastRunningId.current = runningId;
    if (previousId === null || previousId === runningId) return;

    const openRun = (id: string): void => {
      void navigate(`/backtest?view=runs&run=${encodeURIComponent(id)}`);
    };
    let ignore = false;
    queryClient
      .query({
        queryKey: backtestKeys.detail(previousId),
        queryFn: ({ signal }) => getBacktestRun(previousId, signal),
        staleTime: 0,
      })
      .then((run) => {
        if (ignore) return;
        const action = {
          label: 'View run',
          onClick: () => {
            openRun(run.id);
          },
        };
        if (run.status === 'completed') {
          toast.success(`Backtest ${run.id} finished: ${run.resultLabel}.`, {
            action,
            duration: NOTICE_DURATION_MS,
          });
        } else if (run.status === 'failed') {
          toast.error(`Backtest ${run.id} failed. Open the run to see why.`, {
            action,
            duration: NOTICE_DURATION_MS,
          });
        }
      })
      .catch(() => {
        // The run list still shows the final status when the detail request fails.
      });
    return () => {
      ignore = true;
    };
  }, [runningId, queryClient, navigate]);
}
