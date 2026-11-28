// Checks the Strategy and Backtest development fixtures that the MSW handlers serve.
// Runs in Vitest without a browser. Run with `pnpm --filter @crypto-force/web test`.
// Expected values for the 0.08% fee and 5 bps run come from the prototype Backtest screen
// (docs/design/prototype/screens/Backtest.dc.html): 178 trades, gross +22.66, fees 8.90
// (178 × 0.05), slippage 5.34 (178 × 0.03), net +8.42 USD, account value 100 → 108.42.
// The 0.10% fee and 12 bps case scales the prototype costs by hand: 8.90 × 0.10 / 0.08 = 11.13,
// 5.34 × 12 / 5 = 12.82, and 22.66 − 11.13 − 12.82 = −1.29 USD.
// Faults run before this test passed: a fixture with 30 trade rows under a 178-trade summary,
// and trade rows that keep the base fee when the run fee changes (the 0.10% case).
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

function sumOf(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

interface ExpectedTotals {
  trades: number;
  grossUsd: number;
  feeUsd: number;
  slippageUsd: number;
  netUsd: number;
}

function expectTradeRowTotals(result: BacktestResultSummary, expected: ExpectedTotals): void {
  const { trades } = result;
  expect(trades.length).toBe(expected.trades);
  expect(result.totalTrades).toBe(expected.trades);
  expect(result.grossPnlUsd).toBeCloseTo(expected.grossUsd, 6);
  expect(sumOf(trades.map((trade) => trade.feeUsd))).toBeCloseTo(expected.feeUsd, 6);
  expect(sumOf(trades.map((trade) => trade.slippageUsd))).toBeCloseTo(expected.slippageUsd, 6);
  expect(sumOf(trades.map((trade) => trade.pnlUsd))).toBeCloseTo(expected.netUsd, 6);
  expect(result.totalFeeUsd).toBeCloseTo(expected.feeUsd, 6);
  expect(result.totalSlippageUsd).toBeCloseTo(expected.slippageUsd, 6);
  expect(result.netPnlUsd).toBeCloseTo(expected.netUsd, 6);
  const lastPoint = result.equityCurve[result.equityCurve.length - 1];
  expect(lastPoint?.accountValueUsd).toBeCloseTo(100 + expected.netUsd, 6);
}

function expectEveryTradeCost(
  result: BacktestResultSummary,
  feeUsd: number,
  slippageUsd: number,
): void {
  expect(result.trades.every((trade) => trade.feeUsd === feeUsd)).toBe(true);
  expect(result.trades.every((trade) => trade.slippageUsd === slippageUsd)).toBe(true);
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

  it('returns 178 trade rows whose fee, slippage, and net P/L add up to the summary totals', () => {
    const prototypeRun = createMockRunResult(0.08, 5);
    expectEveryTradeCost(prototypeRun, 0.05, 0.03);
    expectTradeRowTotals(prototypeRun, {
      trades: 178,
      grossUsd: 22.66,
      feeUsd: 8.9,
      slippageUsd: 5.34,
      netUsd: 8.42,
    });
    expectTradeRowTotals(createMockRunResult(0.1, 12), {
      trades: 178,
      grossUsd: 22.66,
      feeUsd: 11.13,
      slippageUsd: 12.82,
      netUsd: -1.29,
    });
  });
});
