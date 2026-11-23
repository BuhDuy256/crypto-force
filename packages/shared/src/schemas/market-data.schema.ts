import { z } from 'zod';

export const marketPairSchema = z.enum(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
export const marketTimeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h', '1d']);
export const candleHistoryInputSchema = z.strictObject({
  pair: marketPairSchema,
  timeframe: marketTimeframeSchema,
});
const timeframeIntervals: Record<MarketTimeframe, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
};

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
        candle.openTime % timeframeIntervals[history.timeframe] !== 0 ||
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
  dataTime: timestampSchema,
});
export const marketSummaryInputSchema = z.strictObject({ pair: marketPairSchema });

const marketChannelSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('kline'),
    pair: marketPairSchema,
    timeframe: marketTimeframeSchema,
  }),
  z.strictObject({
    kind: z.literal('summary'),
    pair: marketPairSchema,
  }),
]);

export const wsClientMessageSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('subscribe'),
    channels: z.array(marketChannelSchema).min(1),
  }),
  z.strictObject({
    type: z.literal('unsubscribe'),
    channels: z.array(marketChannelSchema).min(1),
  }),
]);

const wsErrorCodeSchema = z.enum([
  'INVALID_MESSAGE',
  'SUBSCRIPTION_LIMIT_EXCEEDED',
  'RATE_LIMITED',
  'CONNECTION_LIMIT_EXCEEDED',
]);

export const wsServerMessageSchema = z
  .discriminatedUnion('type', [
    z.strictObject({
      type: z.literal('subscribed'),
      channels: z.array(marketChannelSchema),
    }),
    z.strictObject({
      type: z.literal('unsubscribed'),
      channels: z.array(marketChannelSchema),
    }),
    z.strictObject({
      type: z.literal('candle'),
      pair: marketPairSchema,
      timeframe: marketTimeframeSchema,
      candle: candleSchema,
      dataTime: timestampSchema,
      sourceTime: timestampSchema.optional(),
    }),
    z.strictObject({
      type: z.literal('summary'),
      summary: marketSummarySchema,
      sourceTime: timestampSchema.optional(),
    }),
    z.strictObject({
      type: z.literal('heartbeat'),
      serverTime: timestampSchema,
    }),
    z.strictObject({
      type: z.literal('status'),
      upstream: z.enum(['available', 'unavailable']),
      resyncRequired: z.boolean(),
      serverTime: timestampSchema,
    }),
    z.strictObject({
      type: z.literal('error'),
      code: wsErrorCodeSchema,
      message: z.string().min(1),
    }),
  ])
  .superRefine((message, context) => {
    if (
      message.type === 'candle' &&
      message.candle.openTime % timeframeIntervals[message.timeframe] !== 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['candle', 'openTime'],
        message: 'The candle openTime is not aligned to the timeframe.',
      });
    }
  });

export type MarketPair = z.infer<typeof marketPairSchema>;
export type MarketTimeframe = z.infer<typeof marketTimeframeSchema>;
export type Candle = z.infer<typeof candleSchema>;
export type CandleHistory = z.infer<typeof candleHistorySchema>;
export type MarketSummary = z.infer<typeof marketSummarySchema>;
export type MarketChannel = z.infer<typeof marketChannelSchema>;
export type WsClientMessage = z.infer<typeof wsClientMessageSchema>;
export type WsServerMessage = z.infer<typeof wsServerMessageSchema>;
export type WsErrorCode = z.infer<typeof wsErrorCodeSchema>;

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
