import { useState, type JSX } from 'react';
import {
  backtestRunSchema,
  type BacktestRun,
  type BacktestRunDetail,
  type CreateBacktestInput,
  type StrategyLibraryItem,
} from '@crypto-force/shared';
import { useLocation, useSearchParams } from 'react-router';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  useActiveBacktest,
  useBacktestRunDetail,
  useBacktestRuns,
  useCancelBacktest,
  useCreateBacktest,
} from '~/hooks/useBacktests';
import { useStrategyList } from '~/hooks/useStrategies';
import { cn } from '~/utils/cn';
import { ActiveRunConflictDialog } from './components/ActiveRunConflictDialog';
import {
  BacktestSetupForm,
  toCreateBacktestInput,
  useBacktestForm,
  type BacktestFormValues,
  type UnsavedStrategy,
} from './components/BacktestSetupForm';
import { RunDetailView } from './components/RunDetailView';
import { RunStatusCard } from './components/RunStatusCard';
import { RunsListView } from './components/RunsListView';
import { BacktestResultsSection } from './components/BacktestResultsSection';

type BacktestTab = 'setup' | 'runs';

interface BacktestRouteState {
  from?: string | undefined;
  strategyName?: string | undefined;
  unsavedRules?: string[] | undefined;
}

interface PendingConflict {
  activeRun: BacktestRun;
  input: CreateBacktestInput;
}

const MA_CROSSOVER = 'MA Crossover';

const PAGE_CLASS = 'mx-auto flex w-full max-w-page flex-col gap-6 p-4 sm:p-7';

const DEFAULT_VALUES: BacktestFormValues = {
  pair: 'BTCUSDT',
  timeframe: '5m',
  from: '2025-05-01',
  to: '2025-05-15',
  capitalUsd: 100,
  strategyName: MA_CROSSOVER,
  strategyId: null,
  feePercent: 0.08,
  slippageBps: 5,
};

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rules: string[] = [];
  for (const rule of value) {
    if (typeof rule !== 'string') return undefined;
    rules.push(rule);
  }
  return rules;
}

function readRouteState(value: unknown): BacktestRouteState {
  if (typeof value !== 'object' || value === null) return {};
  const record = value as Record<string, unknown>;
  return {
    from: typeof record.from === 'string' ? record.from : undefined,
    strategyName: typeof record.strategyName === 'string' ? record.strategyName : undefined,
    unsavedRules: readStringArray(record.unsavedRules),
  };
}

function activeRunFromError(error: unknown): BacktestRun | null {
  if (typeof error !== 'object' || error === null) return null;
  const candidate = error as { code?: unknown; activeRun?: unknown };
  if (candidate.code !== 'BACKTEST_ALREADY_RUNNING') return null;
  const parsed = backtestRunSchema.safeParse(candidate.activeRun);
  return parsed.success ? parsed.data : null;
}

function readRunId(value: string | null): string | null {
  return value === null || value === '' ? null : value;
}

function latestCompletedRunId(runs: BacktestRun[]): string | null {
  let latest: BacktestRun | null = null;
  for (const run of runs) {
    if (run.status !== 'completed') continue;
    if (latest === null || run.startedAt > latest.startedAt) latest = run;
  }
  return latest?.id ?? null;
}

function inputsMatchRun(values: Partial<BacktestFormValues>, run: BacktestRunDetail): boolean {
  return (
    values.pair === run.pair &&
    values.timeframe === run.timeframe &&
    values.from === run.from &&
    values.to === run.to &&
    values.capitalUsd === run.capitalUsd &&
    values.strategyName === run.strategyName &&
    values.strategyId === run.strategyId &&
    values.feePercent === run.feePercent &&
    values.slippageBps === run.slippageBps
  );
}

export function BacktestPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const strategyParam = searchParams.get('strategy');

  return <BacktestContent key={strategyParam ?? 'new'} strategyParam={strategyParam} />;
}

function BacktestContent({ strategyParam }: { strategyParam: string | null }) {
  const strategiesQuery = useStrategyList();

  if (strategyParam !== null && strategiesQuery.isPending) {
    return (
      <section className={PAGE_CLASS}>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Backtest</h1>
          <p className="text-sm text-muted-foreground">
            Replay a strategy over a past period, with fees and slippage, trade by trade.
          </p>
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          Loading your strategy…
        </p>
      </section>
    );
  }

  return (
    <BacktestWorkspace items={strategiesQuery.data?.items ?? []} strategyParam={strategyParam} />
  );
}

function BacktestWorkspace({
  items,
  strategyParam,
}: {
  items: StrategyLibraryItem[];
  strategyParam: string | null;
}) {
  const location = useLocation();
  const routeState = readRouteState(location.state);
  const [searchParams, setSearchParams] = useSearchParams();
  const runId = readRunId(searchParams.get('run'));
  const showRuns = runId !== null || searchParams.get('view') === 'runs';
  const runsQuery = useBacktestRuns();
  const runsCount = runsQuery.data?.runs.length ?? 0;

  const handoffItem =
    strategyParam === null ? undefined : items.find((item) => item.id === strategyParam);
  const handoffUnsaved =
    handoffItem === undefined && routeState.unsavedRules !== undefined
      ? { name: routeState.strategyName ?? 'Unsaved strategy', rules: routeState.unsavedRules }
      : null;

  const form = useBacktestForm({
    ...DEFAULT_VALUES,
    strategyName: handoffItem?.name ?? handoffUnsaved?.name ?? DEFAULT_VALUES.strategyName,
    strategyId: handoffItem?.id ?? null,
    ...(handoffUnsaved === null ? {} : { unsavedRules: handoffUnsaved.rules }),
  });

  const latestCompletedId = latestCompletedRunId(runsQuery.data?.runs ?? []);
  const latestCompletedQuery = useBacktestRunDetail(latestCompletedId);
  const resultsRun = latestCompletedQuery.data ?? null;
  const formValues = useWatch({ control: form.control });
  const inputsChanged = resultsRun !== null && !inputsMatchRun(formValues, resultsRun);

  const [unsavedStrategy, setUnsavedStrategy] = useState<UnsavedStrategy | null>(handoffUnsaved);
  const [note, setNote] = useState<string | null>(
    handoffItem === undefined && handoffUnsaved === null
      ? null
      : `Loaded ${handoffItem?.name ?? handoffUnsaved?.name ?? ''} from ${routeState.from ?? 'your library'}. Run the backtest to see its results.`,
  );

  const createBacktest = useCreateBacktest();
  const cancelBacktest = useCancelBacktest();
  const activeQuery = useActiveBacktest();
  const [watchedRunId, setWatchedRunId] = useState<string | null>(null);
  const [dismissedRunId, setDismissedRunId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<PendingConflict | null>(null);
  const [conflictBusy, setConflictBusy] = useState(false);

  const activeRun = activeQuery.data?.run ?? null;
  const watchedId = watchedRunId ?? activeRun?.id ?? null;
  const watchedQuery = useBacktestRunDetail(watchedId);
  const watchedRun =
    dismissedRunId !== null && dismissedRunId === watchedId
      ? null
      : (watchedQuery.data ?? (activeRun?.id === watchedId ? activeRun : null));

  function setTab(tab: BacktestTab): void {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (tab === 'runs') {
          next.set('view', 'runs');
          next.delete('run');
        } else {
          next.delete('view');
          next.delete('run');
        }
        return next;
      },
      { replace: true },
    );
  }

  function openRun(id: string): void {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('view', 'runs');
        next.set('run', id);
        return next;
      },
      { replace: true },
    );
  }

  function backToRuns(): void {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('run');
        next.set('view', 'runs');
        return next;
      },
      { replace: true },
    );
  }

  function dismissWatchedRun(): void {
    if (watchedId !== null) setDismissedRunId(watchedId);
    setWatchedRunId(null);
  }

  async function handleCreate(input: CreateBacktestInput): Promise<void> {
    try {
      const run = await createBacktest.mutateAsync(input);
      setWatchedRunId(run.id);
      setDismissedRunId(null);
      toast(`Backtest ${run.id} started. You can keep working in other tabs.`);
    } catch (error) {
      const active = activeRunFromError(error);
      if (active !== null) {
        setConflict({ activeRun: active, input });
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Could not start the backtest.');
    }
  }

  function handleCancel(id: string): void {
    cancelBacktest.mutate(id, {
      onSuccess: () => {
        toast('Backtest cancelled. Nothing was kept from it.');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  async function handleCancelAndRun(): Promise<void> {
    if (conflict === null) return;
    setConflictBusy(true);
    try {
      await cancelBacktest.mutateAsync(conflict.activeRun.id);
      const run = await createBacktest.mutateAsync(conflict.input);
      setConflict(null);
      setWatchedRunId(run.id);
      setDismissedRunId(null);
      toast(`Backtest ${run.id} started. You can keep working in other tabs.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start the backtest.');
    } finally {
      setConflictBusy(false);
    }
  }

  function settingsFromRun(run: BacktestRunDetail): {
    values: BacktestFormValues;
    unsaved: UnsavedStrategy | null;
  } {
    const item =
      run.strategyId === null ? undefined : items.find((entry) => entry.id === run.strategyId);
    const isBuiltIn = run.strategyId === null && run.strategyName === MA_CROSSOVER;
    const unsaved =
      item === undefined && !isBuiltIn ? { name: run.strategyName, rules: run.rules } : null;
    return {
      values: {
        pair: run.pair,
        timeframe: run.timeframe,
        from: run.from,
        to: run.to,
        capitalUsd: run.capitalUsd,
        strategyName: item?.name ?? run.strategyName,
        strategyId: item?.id ?? null,
        feePercent: run.feePercent,
        slippageBps: run.slippageBps,
        ...(unsaved === null ? {} : { unsavedRules: unsaved.rules }),
      },
      unsaved,
    };
  }

  function applyRunSettings(run: BacktestRunDetail, start: boolean): void {
    const { values, unsaved } = settingsFromRun(run);
    setUnsavedStrategy(unsaved);
    setNote(
      unsaved === null
        ? `Loaded ${run.strategyName} from run ${run.id}.`
        : `Loaded ${run.strategyName} from run ${run.id}. It isn't in your library, so this run's copy of its rules is used.`,
    );
    setTab('setup');
    form.reset(values);
    if (start) {
      void form.handleSubmit((formValues) => {
        void handleCreate(toCreateBacktestInput(formValues));
      })();
    }
  }

  return (
    <section className={PAGE_CLASS}>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Backtest</h1>
        <p className="text-sm text-muted-foreground">
          Replay a strategy over a past period, with fees and slippage, trade by trade.
        </p>
      </div>

      <div role="tablist" aria-label="Backtest views" className="flex flex-wrap border-b">
        <TabButton
          id="backtest-tab-setup"
          label="Set up & run"
          selected={!showRuns}
          onSelect={() => {
            setTab('setup');
          }}
        />
        <TabButton
          id="backtest-tab-runs"
          label={`Runs (${String(runsCount)})`}
          selected={showRuns}
          onSelect={() => {
            setTab('runs');
          }}
        />
      </div>

      {showRuns ? (
        runId === null ? (
          <RunsListView
            onOpenRun={openRun}
            onSetUp={() => {
              setTab('setup');
            }}
          />
        ) : (
          <RunDetailView
            runId={runId}
            onBack={backToRuns}
            onRunAgain={(run) => {
              applyRunSettings(run, true);
            }}
            onCopySettings={(run) => {
              applyRunSettings(run, false);
            }}
            renderResults={(detail) => <BacktestResultsSection run={detail} />}
          />
        )
      ) : (
        <>
          <BacktestSetupForm
            form={form}
            strategies={items}
            unsavedStrategy={unsavedStrategy}
            note={note}
            isStarting={createBacktest.isPending}
            onStrategyChange={() => {
              setNote(null);
            }}
            onSubmit={(input) => {
              void handleCreate(input);
            }}
          />
          {watchedRun === null ? null : (
            <RunStatusCard
              run={watchedRun}
              isCancelling={cancelBacktest.isPending}
              onCancel={() => {
                handleCancel(watchedRun.id);
              }}
              onViewDetails={() => {
                openRun(watchedRun.id);
              }}
              onDismiss={dismissWatchedRun}
            />
          )}
          {resultsRun === null ? null : (
            <BacktestResultsSection
              run={resultsRun}
              isStale={inputsChanged}
              runDisabled={createBacktest.isPending}
              onRunAgain={() => {
                void form.handleSubmit((values) => {
                  void handleCreate(toCreateBacktestInput(values));
                })();
              }}
              onRevertInputs={() => {
                applyRunSettings(resultsRun, false);
              }}
            />
          )}
        </>
      )}

      <ActiveRunConflictDialog
        open={conflict !== null}
        activeRun={conflict?.activeRun ?? null}
        cancelling={conflictBusy}
        onClose={() => {
          setConflict(null);
        }}
        onViewRunningRun={() => {
          if (conflict === null) return;
          openRun(conflict.activeRun.id);
          setConflict(null);
        }}
        onCancelAndRun={() => {
          void handleCancelAndRun();
        }}
      />
    </section>
  );
}

function TabButton({
  id,
  label,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        'min-h-11 border-b-2 px-4 text-[15px]',
        selected
          ? 'border-info font-semibold text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
