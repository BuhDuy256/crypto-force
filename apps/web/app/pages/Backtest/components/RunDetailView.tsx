import type { ReactNode } from 'react';
import type { BacktestRunDetail, BacktestRunStatus } from '@crypto-force/shared';
import { ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { useBacktestRunDetail, useCancelBacktest } from '~/hooks/useBacktests';
import { formatRunPeriod, formatRunTitle } from '~/utils/strategy-draft';

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

function versionLabel(version: string): string {
  if (version === 'built-in') return 'built-in';
  if (version === 'unsaved') return 'not saved in the library';
  return `v${version}`;
}

interface RunDetailViewProps {
  runId: string;
  onBack: () => void;
  onRunAgain: (run: BacktestRunDetail) => void;
  onCopySettings: (run: BacktestRunDetail) => void;
  renderResults?: (detail: BacktestRunDetail) => ReactNode;
}

export function RunDetailView({
  runId,
  onBack,
  onRunAgain,
  onCopySettings,
  renderResults,
}: RunDetailViewProps) {
  const query = useBacktestRunDetail(runId);
  const cancel = useCancelBacktest();

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant="ghost" className="self-start" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        All runs
      </Button>

      {query.isPending ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5" aria-busy="true">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load this run</AlertTitle>
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
      ) : (
        <RunDetailContent
          detail={query.data}
          isCancelling={cancel.isPending}
          onCancel={() => {
            cancel.mutate(query.data.id);
          }}
          onRunAgain={onRunAgain}
          onCopySettings={onCopySettings}
          renderResults={renderResults}
        />
      )}
    </div>
  );
}

interface RunDetailContentProps {
  detail: BacktestRunDetail;
  isCancelling: boolean;
  onCancel: () => void;
  onRunAgain: (run: BacktestRunDetail) => void;
  onCopySettings: (run: BacktestRunDetail) => void;
  renderResults?: ((detail: BacktestRunDetail) => ReactNode) | undefined;
}

function RunDetailContent({
  detail,
  isCancelling,
  onCancel,
  onRunAgain,
  onCopySettings,
  renderResults,
}: RunDetailContentProps) {
  const renamed =
    !detail.drift.deletedFromLibrary &&
    detail.drift.currentName !== null &&
    detail.drift.currentName !== detail.strategyName;
  const newerVersion =
    !detail.drift.deletedFromLibrary &&
    detail.drift.currentVersion !== null &&
    detail.drift.currentVersion !== detail.strategyVersion;
  const rerunLabel =
    detail.status === 'failed' ? 'Retry with these settings' : 'Run again with these settings';

  return (
    <>
      <section
        aria-labelledby="backtest-run-heading"
        className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="backtest-run-heading" className="mr-auto text-xl font-semibold break-words">
            {formatRunTitle(detail)}
          </h2>
          <Badge variant={STATUS_VARIANT[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
          <span className="text-sm text-muted-foreground">
            Run {detail.id} · started {formatStamp(detail.startedAt)}
            {detail.endedAt === null ? '' : ` · ended ${formatStamp(detail.endedAt)}`}
          </span>
        </div>

        {detail.drift.deletedFromLibrary ? (
          <p
            role="note"
            className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
          >
            {`${detail.strategyName} is no longer in your library. The settings and rules below are the copy this run used.`}
          </p>
        ) : (
          <>
            {renamed ? (
              <p
                role="note"
                className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
              >
                {`This strategy is now called ${detail.drift.currentName ?? ''}.`}
              </p>
            ) : null}
            {newerVersion ? (
              <p
                role="note"
                className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
              >
                {`It is now at v${detail.drift.currentVersion ?? ''}. This run used v${detail.strategyVersion}, shown below.`}
              </p>
            ) : null}
          </>
        )}

        {detail.status === 'running' ? (
          <>
            <div
              role="progressbar"
              aria-label="Backtest progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={detail.progressPercent}
              className="h-2 overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full bg-info transition-[width] duration-500"
                style={{ width: `${String(detail.progressPercent)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Running · {detail.progressPercent}%. Results appear here when it finishes.
            </p>
          </>
        ) : null}

        {detail.status === 'failed' ? (
          <p
            role="status"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {detail.failureReason ?? 'The run failed.'}
          </p>
        ) : null}

        {detail.status === 'cancelled' ? (
          <p
            role="status"
            className="rounded-lg border border-info/40 bg-info/10 p-3 text-sm text-info"
          >
            Cancelled before it finished. Nothing was kept from this run.
          </p>
        ) : null}

        <h3 className="text-sm font-semibold">Settings used</h3>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Strategy</dt>
            <dd className="text-sm break-words">
              {detail.strategyName} · {versionLabel(detail.strategyVersion)}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Pair</dt>
            <dd className="text-sm">{detail.pair}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Timeframe</dt>
            <dd className="text-sm">{detail.timeframe}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Period</dt>
            <dd className="text-sm break-words">{formatRunPeriod(detail.from, detail.to)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Capital</dt>
            <dd className="text-sm">{detail.capitalUsd} USD</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Fee</dt>
            <dd className="text-sm">{detail.feePercent}%</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Slippage</dt>
            <dd className="text-sm">{detail.slippageBps} bps</dd>
          </div>
        </dl>

        <h3 className="text-sm font-semibold">Strategy rules at run time</h3>
        <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground">
          {detail.rules.map((rule, index) => (
            <li key={`${String(index)}-${rule}`}>{rule}</li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          {detail.status === 'running' ? (
            <Button type="button" variant="outline" disabled={isCancelling} onClick={onCancel}>
              {isCancelling ? 'Cancelling…' : 'Cancel run'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                onRunAgain(detail);
              }}
            >
              {rerunLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCopySettings(detail);
            }}
          >
            Copy settings to a new backtest
          </Button>
        </div>
      </section>

      {detail.status === 'completed' && detail.result !== null ? renderResults?.(detail) : null}
    </>
  );
}
