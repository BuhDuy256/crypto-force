import type { BacktestRun, BacktestRunStatus } from '@crypto-force/shared';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { useBacktestRuns } from '~/hooks/useBacktests';
import { formatBacktestPeriod } from '~/utils/strategy-draft';

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

const SKELETON_ROWS = [0, 1, 2];

function formatStamp(value: string): string {
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

function versionLabel(run: BacktestRun): string {
  if (run.strategyVersion === 'built-in') return 'built-in strategy';
  if (run.strategyVersion === 'unsaved') return 'unsaved strategy';
  return `strategy v${run.strategyVersion}`;
}

function runTitle(run: BacktestRun): string {
  const period = formatBacktestPeriod(run.from, run.to) ?? `${run.from} – ${run.to}`;
  return `${run.strategyName} · ${run.pair} ${run.timeframe} · ${period}`;
}

interface RunsListViewProps {
  onOpenRun: (runId: string) => void;
  onSetUp: () => void;
}

export function RunsListView({ onOpenRun, onSetUp }: RunsListViewProps) {
  const query = useBacktestRuns();

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5" aria-busy="true">
        {SKELETON_ROWS.map((row) => (
          <Skeleton key={row} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load your backtest runs</AlertTitle>
        <AlertDescription>
          <p>{query.error.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void query.refetch();
            }}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const runs = [...query.data.runs].sort((left, right) =>
    right.startedAt.localeCompare(left.startedAt),
  );

  if (runs.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card p-8 text-center"
      >
        <strong className="text-base">No runs yet</strong>
        <p className="max-w-md text-sm text-muted-foreground">
          Set up a backtest and run it. Every run is kept here with its settings.
        </p>
        <Button type="button" onClick={onSetUp}>
          Set up a backtest
        </Button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="backtest-runs-heading"
      className="rounded-xl border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id="backtest-runs-heading" className="text-lg font-semibold">
          Runs
        </h2>
        <span className="text-sm text-muted-foreground">
          Manual backtests, newest first. Each run keeps the settings and strategy rules it ran
          with.
        </span>
      </div>
      <ul className="mt-3 flex flex-col border-t">
        {runs.map((run) => (
          <li
            key={run.id}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b py-4 last:border-b-0"
          >
            <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1">
              <button
                type="button"
                className="self-start text-left text-base font-bold break-words underline decoration-border underline-offset-4 hover:decoration-foreground"
                onClick={() => {
                  onOpenRun(run.id);
                }}
              >
                {runTitle(run)}
              </button>
              <span className="text-sm text-muted-foreground">
                Run {run.id} · started {formatStamp(run.startedAt)} · {versionLabel(run)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Badge variant={STATUS_VARIANT[run.status]}>{STATUS_LABEL[run.status]}</Badge>
              <span className="text-sm text-foreground">
                {run.status === 'running' ? `${run.progressPercent}%` : run.resultLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Open run ${run.id}`}
                onClick={() => {
                  onOpenRun(run.id);
                }}
              >
                Open
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
