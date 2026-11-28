import type {
  BacktestResultSummary,
  BacktestRun,
  StrategyLibraryItem,
  StrategyPreviewResponse,
} from '@crypto-force/shared';
import {
  backtestRunDetailSchema,
  backtestRunListResponseSchema,
  strategyListResponseSchema,
  strategyPreviewResponseSchema,
} from '@crypto-force/shared';
import { describe, expect, it } from 'vitest';
import {
  buildStrategyPreview,
  createMockRunResult,
  seedBacktestRuns,
  seedStrategyLibrary,
} from './fixtures/strategy-backtest';

function expectValidPreview(preview: StrategyPreviewResponse, hasShortExample: boolean): void {
  expect(strategyPreviewResponseSchema.safeParse(preview).success).toBe(true);
  expect(preview.hasShortExample).toBe(hasShortExample);
}

function expectValidLibrary(items: StrategyLibraryItem[]): void {
  expect(strategyListResponseSchema.safeParse({ items, totalCount: items.length }).success).toBe(
    true,
  );
  expect(items.length).toBe(3);
}

function expectValidRuns(runs: BacktestRun[]): void {
  expect(backtestRunListResponseSchema.safeParse({ runs }).success).toBe(true);
  expect(runs.map((run) => run.status)).toEqual(['completed', 'failed', 'cancelled']);
}

function expectAccountingInvariant(result: BacktestResultSummary): void {
  expect(result.grossPnlUsd - result.totalFeeUsd - result.totalSlippageUsd).toBeCloseTo(
    result.netPnlUsd,
    6,
  );
}

function expectValidDetail(runs: BacktestRun[], result: BacktestResultSummary): void {
  const completedRun = runs[0];
  expect(completedRun).toBeDefined();
  const detail = {
    ...completedRun,
    drift: { deletedFromLibrary: false, currentName: null, currentVersion: null },
    result,
  };
  expect(backtestRunDetailSchema.safeParse(detail).success).toBe(true);
}

describe('strategy and backtest development fixtures', () => {
  it('produces schema-valid strategy previews and library items', () => {
    expectValidPreview(buildStrategyPreview('prompt', true), true);
    expectValidPreview(buildStrategyPreview('url', false), false);
    expectValidLibrary(seedStrategyLibrary());
  });

  it('produces schema-valid backtest runs and preserves P/L accounting invariance', () => {
    const runs = seedBacktestRuns();
    const result = createMockRunResult(0.08, 5);
    expectValidRuns(runs);
    expectAccountingInvariant(result);
    expectValidDetail(runs, result);
  });
});
