import {
  createBacktestInputSchema,
  type BacktestRun,
  type BacktestRunDetail,
} from '@crypto-force/shared';
import { http, HttpResponse } from 'msw';
import {
  createMockRunResult,
  formatResultLabel,
  seedBacktestRuns,
} from './fixtures/strategy-backtest';
import { readMockLibraryItems } from './strategy.handlers';

const LISTING_DATES: Record<BacktestRun['pair'], string> = {
  BTCUSDT: '2017-08-17',
  ETHUSDT: '2017-08-17',
  SOLUSDT: '2020-08-11',
};

const MA_CROSSOVER_RULES = [
  'LONG when MA(20) crosses above MA(50); SHORT when it crosses below',
  'Stop loss and take profit from the strategy settings',
];

const runs: BacktestRun[] = seedBacktestRuns();

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function nowStamp(): string {
  return new Date().toISOString();
}

function paramId(value: string | readonly string[] | undefined): string {
  return typeof value === 'string' ? value : (value?.[0] ?? '');
}

function displayDate(isoDate: string): string {
  const [year = '', month = '', day = ''] = isoDate.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${Number(day)} ${months[Number(month) - 1] ?? month} ${year}`;
}

function nextRunId(): string {
  const highest = runs.reduce((max, run) => {
    const value = Number(run.id.replace(/\D/g, ''));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 1042);
  return `R-${highest + 1}`;
}

function advanceActiveRuns(): void {
  for (const run of runs) {
    if (run.status !== 'running') continue;
    const next = run.progressPercent + 35;
    if (next < 100) {
      run.progressPercent = next;
      continue;
    }
    run.progressPercent = 100;
    run.endedAt = nowStamp();
    const listingDate = LISTING_DATES[run.pair];
    if (run.from < listingDate) {
      run.status = 'failed';
      run.resultLabel = 'Failed · no candles for that period';
      run.failureReason = `Binance has no ${run.pair} candles before ${displayDate(listingDate)}, when the pair was listed. Pick a start date on or after that day.`;
      continue;
    }
    run.status = 'completed';
    const result = createMockRunResult(run.feePercent, run.slippageBps);
    run.resultLabel = formatResultLabel(result);
    run.failureReason = null;
  }
}

function buildDrift(run: BacktestRun): BacktestRunDetail['drift'] {
  if (!run.strategyId) {
    return { deletedFromLibrary: false, currentName: null, currentVersion: null };
  }
  const item = readMockLibraryItems().find((entry) => entry.id === run.strategyId);
  if (!item) {
    return { deletedFromLibrary: true, currentName: null, currentVersion: null };
  }
  return {
    deletedFromLibrary: false,
    currentName: item.name,
    currentVersion: item.version,
  };
}

function toDetail(run: BacktestRun): BacktestRunDetail {
  return {
    ...run,
    drift: buildDrift(run),
    result:
      run.status === 'completed' ? createMockRunResult(run.feePercent, run.slippageBps) : null,
  };
}

export const backtestHandlers = [
  http.get('/api/backtests', () => {
    advanceActiveRuns();
    return HttpResponse.json({ runs });
  }),

  http.get('/api/backtests/active', () => {
    advanceActiveRuns();
    const activeRun = runs.find((run) => run.status === 'running') ?? null;
    return HttpResponse.json({ run: activeRun });
  }),

  http.get('/api/backtests/:id', ({ params }) => {
    advanceActiveRuns();
    const id = paramId(params.id);
    const run = runs.find((entry) => entry.id === id);
    if (!run) {
      return errorResponse(404, 'NOT_FOUND', 'That backtest run does not exist.');
    }
    return HttpResponse.json(toDetail(run));
  }),

  http.post('/api/backtests', async ({ request }) => {
    const input = createBacktestInputSchema.safeParse(await request.json());
    if (!input.success) {
      return errorResponse(400, 'INVALID_INPUT', 'Check the backtest setup and try again.');
    }
    const activeRun = runs.find((run) => run.status === 'running');
    if (activeRun) {
      return HttpResponse.json(
        {
          error: {
            code: 'BACKTEST_ALREADY_RUNNING',
            message:
              'A backtest is already running. Wait for it to finish, or cancel it before you start another.',
          },
          activeRun,
        },
        { status: 409 },
      );
    }
    const item = input.data.strategyId
      ? readMockLibraryItems().find((entry) => entry.id === input.data.strategyId)
      : undefined;
    const unsavedRules = input.data.unsavedRules;
    const fallbackRules =
      input.data.strategyName === 'MA Crossover'
        ? MA_CROSSOVER_RULES
        : [
            `${input.data.strategyName} has no saved rules.`,
            'Stop loss and take profit from the strategy settings',
          ];
    const rules = item?.rules ?? (unsavedRules?.length ? unsavedRules : fallbackRules);
    const run: BacktestRun = {
      id: nextRunId(),
      status: 'running',
      progressPercent: 15,
      strategyId: input.data.strategyId,
      strategyName: item?.name ?? input.data.strategyName,
      strategyVersion:
        item?.version ?? (input.data.strategyName === 'MA Crossover' ? 'built-in' : 'unsaved'),
      strategyKind: item?.kind ?? 'builtin',
      rules,
      pair: input.data.pair,
      timeframe: input.data.timeframe,
      from: input.data.from,
      to: input.data.to,
      capitalUsd: input.data.capitalUsd,
      feePercent: input.data.feePercent,
      slippageBps: input.data.slippageBps,
      startedAt: nowStamp(),
      endedAt: null,
      resultLabel: 'Running',
      failureReason: null,
    };
    runs.unshift(run);
    return HttpResponse.json(run, { status: 201 });
  }),

  http.post('/api/backtests/:id/cancel', ({ params }) => {
    const id = paramId(params.id);
    const run = runs.find((entry) => entry.id === id);
    if (!run) {
      return errorResponse(404, 'NOT_FOUND', 'That backtest run does not exist.');
    }
    if (run.status === 'running') {
      run.status = 'cancelled';
      run.endedAt = nowStamp();
      run.resultLabel = 'Cancelled';
      run.failureReason = null;
    }
    return HttpResponse.json(run);
  }),
];
