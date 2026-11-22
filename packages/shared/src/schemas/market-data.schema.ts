import { z } from 'zod';

/** Draft HTTP representation for the mock frontend. Review before backend integration. */
export const marketPairSchema = z.enum(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
export const marketTimeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h']);
export const candleHistoryInputSchema = z.object({
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
    ma20: z.array(z.object({ openTime: timestampSchema, value: z.number().positive() })),
  })
  .superRefine((history, context) => {
    for (const points of [history.candles, history.ma20]) {
      if (
        points.some(
          (point, index) => index > 0 && point.openTime <= (points[index - 1]?.openTime ?? -1),
        )
      ) {
        context.addIssue({
          code: 'custom',
          message: 'The timestamps must be unique and increase in order.',
        });
      }
    }
    const candleTimes = new Set(history.candles.map((candle) => candle.openTime));
    if (history.ma20.some((point) => !candleTimes.has(point.openTime))) {
      context.addIssue({ code: 'custom', message: 'Each MA point must match a candle timestamp.' });
    }
  });
export const marketSummarySchema = z.object({
  pair: marketPairSchema,
  lastPrice: z.number().positive(),
  change24hPercent: z.number(),
});
export type MarketPair = z.infer<typeof marketPairSchema>;
export type MarketTimeframe = z.infer<typeof marketTimeframeSchema>;
export type CandleHistory = z.infer<typeof candleHistorySchema>;
export type MarketSummary = z.infer<typeof marketSummarySchema>;
