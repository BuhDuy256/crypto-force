import {
  wsServerMessageSchema,
  type Candle,
  type CandleHistory,
  type MarketPair,
  type MarketTimeframe,
} from '@crypto-force/shared';

const MAX_DISPLAY_CANDLES = 500;
const WARMUP_CANDLES = 19;
const MAX_STORED_CANDLES = MAX_DISPLAY_CANDLES + WARMUP_CANDLES;
const MAX_BUFFERED_EVENTS = 50;

export interface LiveCandleEvent {
  pair: MarketPair;
  timeframe: MarketTimeframe;
  candle: Candle;
  dataTime: number;
  sourceTime?: number;
}

export type MergeCandleResult =
  | { kind: 'ignored'; history: CandleHistory }
  | { kind: 'applied'; history: CandleHistory }
  | { kind: 'resync-required'; history: CandleHistory; reason: 'missing-closed-boundary' };

export type ReconcileSnapshotResult =
  | { kind: 'ready'; history: CandleHistory }
  | {
      kind: 'resync-required';
      history: CandleHistory;
      reason: 'missing-closed-boundary' | 'buffer-overflow';
    };

export function mergeCandleEvent(
  history: CandleHistory,
  event: LiveCandleEvent,
): MergeCandleResult {
  const validated = wsServerMessageSchema.safeParse({
    type: 'candle',
    pair: event.pair,
    timeframe: event.timeframe,
    candle: event.candle,
    dataTime: event.dataTime,
    ...(event.sourceTime !== undefined ? { sourceTime: event.sourceTime } : {}),
  });
  if (!validated.success || validated.data.type !== 'candle') {
    return { kind: 'ignored', history };
  }
  if (event.pair !== history.pair || event.timeframe !== history.timeframe) {
    return { kind: 'ignored', history };
  }
  if (event.dataTime < history.dataTime) {
    return { kind: 'ignored', history };
  }

  const last = history.candles.at(-1);
  if (!last) {
    return {
      kind: 'applied',
      history: {
        ...history,
        candles: [event.candle],
        warmupCount: 0,
        dataTime: event.dataTime,
      },
    };
  }

  if (event.candle.openTime < last.openTime) {
    return { kind: 'ignored', history };
  }

  if (event.candle.openTime === last.openTime) {
    if (last.isClosed) {
      return { kind: 'ignored', history };
    }
    const nextCandles = [...history.candles.slice(0, -1), event.candle];
    return {
      kind: 'applied',
      history: {
        ...history,
        candles: nextCandles,
        warmupCount: Math.max(0, nextCandles.length - MAX_DISPLAY_CANDLES),
        dataTime: event.dataTime,
      },
    };
  }

  if (!last.isClosed) {
    return { kind: 'resync-required', history, reason: 'missing-closed-boundary' };
  }

  const appended = [...history.candles, event.candle];
  const trimmed =
    appended.length > MAX_STORED_CANDLES
      ? appended.slice(appended.length - MAX_STORED_CANDLES)
      : appended;
  return {
    kind: 'applied',
    history: {
      ...history,
      candles: trimmed,
      warmupCount: Math.max(0, trimmed.length - MAX_DISPLAY_CANDLES),
      dataTime: event.dataTime,
    },
  };
}

export function reconcileSnapshotWithBuffer(
  snapshot: CandleHistory,
  bufferedEvents: readonly LiveCandleEvent[],
): ReconcileSnapshotResult {
  if (bufferedEvents.length > MAX_BUFFERED_EVENTS) {
    return { kind: 'resync-required', history: snapshot, reason: 'buffer-overflow' };
  }
  let current = snapshot;
  for (const event of bufferedEvents) {
    const result = mergeCandleEvent(current, event);
    if (result.kind === 'resync-required') {
      return { kind: 'resync-required', history: current, reason: result.reason };
    }
    if (result.kind === 'applied') {
      current = result.history;
    }
  }
  return { kind: 'ready', history: current };
}
