import { z } from 'zod';
import { marketPairSchema } from './market-data.schema';

export const backtestTimeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h']);
export const backtestRunStatusSchema = z.enum(['running', 'completed', 'failed', 'cancelled']);
export const backtestTradeSideSchema = z.enum(['LONG', 'SHORT']);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createBacktestInputSchema = z
  .strictObject({
    pair: marketPairSchema,
    timeframe: backtestTimeframeSchema,
    from: isoDateSchema,
    to: isoDateSchema,
    capitalUsd: z.number().min(1),
    strategyName: z.string().trim().min(1).max(80),
    strategyId: z.string().min(1).nullable(),
    feePercent: z.number().min(0).max(1),
    slippageBps: z.number().int().min(0).max(100),
    unsavedRules: z.array(z.string().min(1)).optional(),
  })
  .refine((value) => value.to > value.from, {
    path: ['to'],
    message: 'End date must be after the start date.',
  });

export const backtestTradeSchema = z.strictObject({
  index: z.number().int().positive(),
  openedAt: z.string().min(1),
  openedTimeSec: z.number().int().positive(),
  closedTimeSec: z.number().int().positive(),
  side: backtestTradeSideSchema,
  pnlUsd: z.number(),
  pnlPercent: z.number(),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.number().positive(),
  feeUsd: z.number().nonnegative(),
  slippageUsd: z.number().nonnegative(),
  heldDuration: z.string().min(1),
});

export const backtestEquityPointSchema = z.strictObject({
  timeSec: z.number().int().positive(),
  accountValueUsd: z.number().nonnegative(),
  buyAndHoldUsd: z.number().nonnegative(),
  drawdownUsd: z.number().nonpositive(),
});

export const backtestPriceCandleSchema = z.strictObject({
  timeSec: z.number().int().positive(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
  ma20: z.number().positive().nullable(),
  ma50: z.number().positive().nullable(),
});

export const backtestResultSummarySchema = z.strictObject({
  netReturnUsd: z.number(),
  netReturnPercent: z.number(),
  maxDrawdownUsd: z.number().nonpositive(),
  maxDrawdownPercent: z.number().nonpositive(),
  winRatePercent: z.number().nonnegative(),
  winningTrades: z.number().int().nonnegative(),
  totalTrades: z.number().int().nonnegative(),
  avgNetPerTradeUsd: z.number(),
  avgCostPerTradeUsd: z.number(),
  buyAndHoldPercent: z.number(),
  vsBuyAndHoldPts: z.number(),
  grossPnlUsd: z.number(),
  totalFeeUsd: z.number().nonnegative(),
  totalSlippageUsd: z.number().nonnegative(),
  netPnlUsd: z.number(),
  costShareOfGrossPercent: z.number().nonnegative(),
  supportLevel: z.number().positive(),
  resistanceLevel: z.number().positive(),
  assumptions: z.array(z.string().min(1)),
  equityCurve: z.array(backtestEquityPointSchema).min(2),
  priceSeries: z.array(backtestPriceCandleSchema).min(2),
  trades: z.array(backtestTradeSchema),
});

export const backtestRunSchema = z.strictObject({
  id: z.string().min(1),
  status: backtestRunStatusSchema,
  progressPercent: z.number().min(0).max(100),
  strategyId: z.string().nullable(),
  strategyName: z.string().min(1),
  strategyVersion: z.string().min(1),
  strategyKind: z.enum(['builtin', 'strategy', 'composite']),
  rules: z.array(z.string().min(1)).min(1),
  pair: marketPairSchema,
  timeframe: backtestTimeframeSchema,
  from: isoDateSchema,
  to: isoDateSchema,
  capitalUsd: z.number().min(1),
  feePercent: z.number().min(0).max(1),
  slippageBps: z.number().int().min(0).max(100),
  startedAt: z.string().min(1),
  endedAt: z.string().nullable(),
  resultLabel: z.string().min(1),
  failureReason: z.string().nullable(),
});

export const backtestRunDetailSchema = backtestRunSchema.extend({
  drift: z.strictObject({
    deletedFromLibrary: z.boolean(),
    currentName: z.string().nullable(),
    currentVersion: z.string().nullable(),
  }),
  result: backtestResultSummarySchema.nullable(),
});

export const backtestRunListResponseSchema = z.strictObject({
  runs: z.array(backtestRunSchema),
});

export const activeBacktestResponseSchema = z.strictObject({
  run: backtestRunSchema.nullable(),
});

export const backtestConflictErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.literal('BACKTEST_ALREADY_RUNNING'),
    message: z.string().min(1),
  }),
  activeRun: backtestRunSchema,
});

export type BacktestTimeframe = z.infer<typeof backtestTimeframeSchema>;
export type BacktestRunStatus = z.infer<typeof backtestRunStatusSchema>;
export type BacktestTradeSide = z.infer<typeof backtestTradeSideSchema>;
export type CreateBacktestInput = z.infer<typeof createBacktestInputSchema>;
export type BacktestTrade = z.infer<typeof backtestTradeSchema>;
export type BacktestEquityPoint = z.infer<typeof backtestEquityPointSchema>;
export type BacktestPriceCandle = z.infer<typeof backtestPriceCandleSchema>;
export type BacktestResultSummary = z.infer<typeof backtestResultSummarySchema>;
export type BacktestRun = z.infer<typeof backtestRunSchema>;
export type BacktestRunDetail = z.infer<typeof backtestRunDetailSchema>;
export type BacktestRunListResponse = z.infer<typeof backtestRunListResponseSchema>;
export type ActiveBacktestResponse = z.infer<typeof activeBacktestResponseSchema>;
export type BacktestConflictError = z.infer<typeof backtestConflictErrorSchema>;
