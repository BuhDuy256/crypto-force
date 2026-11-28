import type { BacktestRun, BacktestRunStatus } from '@crypto-force/shared';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { formatRunTitle } from '~/utils/strategy-draft';

const STATUS_LABEL: Record<BacktestRunStatus, string> = {
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const STATUS_VARIANT: Record<BacktestRunStatus, 'info' | 'success' | 'destructive' | 'outline'> = {
  running: 'info',
  completed: 'success',
  failed: 'destructive',
  cancelled: 'outline',
};

function formatStamp(value: string | null): string {
  if (value === null) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface RunStatusCardProps {
  run: BacktestRun;
  isCancelling: boolean;
  onCancel: () => void;
  onViewDetails: () => void;
  onDismiss: () => void;
}

export function RunStatusCard({
  run,
  isCancelling,
  onCancel,
  onViewDetails,
  onDismiss,
}: RunStatusCardProps) {
  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-base font-semibold break-words">{formatRunTitle(run)}</h2>
        <Badge variant={STATUS_VARIANT[run.status]}>{STATUS_LABEL[run.status]}</Badge>
        <span className="text-sm text-muted-foreground">
          Run {run.id} · started {formatStamp(run.startedAt)}
        </span>
      </div>

      {run.status === 'running' ? (
        <>
          <div
            role="progressbar"
            aria-label="Backtest progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={run.progressPercent}
            className="h-2 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full bg-info transition-[width] duration-500"
              style={{ width: `${String(run.progressPercent)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Simulating {run.pair} {run.timeframe} candles · {run.progressPercent}%. You can switch
            to other tabs.
          </p>
        </>
      ) : null}

      {run.status === 'completed' ? (
        <p className="text-sm text-muted-foreground">Finished. {run.resultLabel}.</p>
      ) : null}

      {run.status === 'failed' ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {run.failureReason ?? 'The run failed.'}
        </p>
      ) : null}

      {run.status === 'cancelled' ? (
        <p className="text-sm text-muted-foreground">
          Cancelled before it finished. Nothing was kept from this run.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {run.status === 'running' ? (
          <Button type="button" variant="outline" disabled={isCancelling} onClick={onCancel}>
            {isCancelling ? 'Cancelling…' : 'Cancel run'}
          </Button>
        ) : null}
        {run.status === 'completed' || run.status === 'failed' ? (
          <Button type="button" onClick={onViewDetails}>
            View run details
          </Button>
        ) : null}
        {run.status === 'running' ? null : (
          <Button type="button" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </section>
  );
}
