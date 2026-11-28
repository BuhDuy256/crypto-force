import { describe, expect, it } from 'vitest';
import { createBacktestInputSchema } from './backtest.schema';

describe('backtest schemas', () => {
  const validInput = {
    pair: 'BTCUSDT' as const,
    timeframe: '5m' as const,
    from: '2025-05-01',
    to: '2025-05-15',
    capitalUsd: 100,
    strategyName: 'MA Crossover',
    strategyId: null,
    feePercent: 0.08,
    slippageBps: 5,
  };

  it('accepts a valid manual backtest setup', () => {
    expect(createBacktestInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects end dates on or before start date', () => {
    expect(createBacktestInputSchema.safeParse({ ...validInput, to: '2025-05-01' }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, to: '2025-04-30' }).success).toBe(
      false,
    );
  });

  it('enforces numeric bounds for capital, fee percent, and integer slippage bps', () => {
    expect(createBacktestInputSchema.safeParse({ ...validInput, capitalUsd: 0.99 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, feePercent: -0.01 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, feePercent: 1.01 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, slippageBps: -1 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, slippageBps: 101 }).success).toBe(
      false,
    );
    expect(createBacktestInputSchema.safeParse({ ...validInput, slippageBps: 2.5 }).success).toBe(
      false,
    );
  });
});
