import { z } from 'zod';

export const marketPairSchema = z.enum(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
export const marketTimeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h', '1d']);
export const candleHistoryInputSchema = z.strictObject({
  pair: marketPairSchema,
  timeframe: marketTimeframeSchema,
});
const timestampSchema = z.number().int().nonnegative();
const candleSchema = z
  .object({
    openTime: timestampSchema,
    open: z.number().positive(),
    high: z.number().positive(),
    low: z.number().positive(),
    close: z.number().positive(),
    volume: z.number().nonnegative(),
    isClosed: z.boolean(),
  })
  .refine(
    (candle) =>
      candle.high >= Math.max(candle.open, candle.close, candle.low) &&
      candle.low <= Math.min(candle.open, candle.close),
    { message: 'The candle prices are inconsistent.' },
  );
export const candleHistorySchema = candleHistoryInputSchema
  .extend({
    candles: z.array(candleSchema),
    warmupCount: z.number().int().nonnegative(),
    dataTime: timestampSchema,
  })
  .superRefine((history, context) => {
    for (const points of [history.candles]) {
      const invalidOrder = points.findIndex(
        (point, index) => index > 0 && point.openTime <= (points[index - 1]?.openTime ?? -1),
      );
      if (invalidOrder >= 0) {
        context.addIssue({
          code: 'custom',
          path: ['candles', invalidOrder, 'openTime'],
          message: 'The timestamps must be unique and increase in order.',
        });
      }
    }
    const intervals = {
      '1m': 60_000,
      '5m': 300_000,
      '15m': 900_000,
      '1h': 3_600_000,
      '4h': 14_400_000,
      '1d': 86_400_000,
    };
    if (
      history.warmupCount !== Math.max(0, history.candles.length - 500) ||
      history.candles.length > 519
    ) {
      context.addIssue({
        code: 'custom',
        message: 'The snapshot has an invalid warmup count or candle count.',
      });
    }
    const invalidCandle = history.candles.findIndex(
      (candle, index) =>
        candle.openTime % intervals[history.timeframe] !== 0 ||
        (!candle.isClosed && index < history.candles.length - 1),
    );
    if (invalidCandle >= 0) {
      context.addIssue({
        code: 'custom',
        path: ['candles', invalidCandle],
        message: 'The candle time or closed state is invalid.',
      });
    }
  });
export const marketSummarySchema = z.object({
  pair: marketPairSchema,
  lastPrice: z.number().positive(),
  change24hPercent: z.number(),
});
export const marketSummaryInputSchema = z.strictObject({ pair: marketPairSchema });
export type MarketPair = z.infer<typeof marketPairSchema>;
export type MarketTimeframe = z.infer<typeof marketTimeframeSchema>;
export type CandleHistory = z.infer<typeof candleHistorySchema>;
export type MarketSummary = z.infer<typeof marketSummarySchema>;

/**
 * Display decimals of each pair price (docs/architecture/30-decisions.md, ADR-005). Source: Binance
 * `GET /api/v3/exchangeInfo`, `PRICE_FILTER.tickSize` 0.01 for each pair, read on 2026-11-21.
 * Update the values and the date when Binance changes the tick size.
 */
export const marketPairPriceDecimals = {
  BTCUSDT: 2,
  ETHUSDT: 2,
  SOLUSDT: 2,
} as const satisfies Record<MarketPair, number>;
