import { marketPairSchema, marketTimeframeSchema, type MarketChannel } from '@crypto-force/shared';
import type { Logger } from 'pino';
import { WebSocket, type RawData } from 'ws';
import { z } from 'zod';
import type {
  MarketDataStreamProvider,
  StreamCandleEvent,
  StreamStatusEvent,
  StreamSummaryEvent,
} from './market-data-provider';

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 15_000;
const MAX_COMMANDS_PER_SECOND = 5;
const COMMAND_WINDOW_MS = 1_000;
// Rotate proactively 10 minutes before Binance's hard 24-hour connection limit.
const ROTATION_INTERVAL_MS = (23 * 60 + 50) * 60 * 1_000;

const decimalString = z
  .string()
  .regex(/^-?\d+(?:\.\d+)?$/)
  .transform(Number)
  .pipe(z.number());

const timestamp = z.number().int().nonnegative();

const klineDataSchema = z.object({
  e: z.literal('kline'),
  E: timestamp.optional(),
  s: marketPairSchema,
  k: z.object({
    t: timestamp,
    i: marketTimeframeSchema,
    o: decimalString,
    h: decimalString,
    l: decimalString,
    c: decimalString,
    v: decimalString,
    x: z.boolean(),
  }),
});

const tickerDataSchema = z.object({
  e: z.literal('24hrTicker'),
  E: timestamp.optional(),
  s: marketPairSchema,
  c: decimalString,
  P: decimalString,
});

const serverShutdownSchema = z.object({
  e: z.literal('serverShutdown'),
});

const combinedEnvelopeSchema = z.object({
  stream: z.string(),
  data: z.unknown(),
});

const ackSchema = z.object({
  id: z.number().int(),
  result: z.null(),
});

function toStreamName(channel: MarketChannel): string {
  const symbol = channel.pair.toLowerCase();
  return channel.kind === 'kline' ? `${symbol}@kline_${channel.timeframe}` : `${symbol}@ticker`;
}

function rawDataToString(raw: RawData): string {
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
  return Buffer.from(raw).toString('utf8');
}

export function createBinanceStreamProvider({
  wsUrl,
  now,
  logger,
  createWebSocket,
  random = Math.random,
}: {
  wsUrl: string;
  now: () => number;
  logger: Logger;
  createWebSocket?: (url: string) => WebSocket;
  random?: () => number;
}): MarketDataStreamProvider {
  const activeStreams = new Set<string>();
  const pendingSubscribe = new Set<string>();
  const pendingUnsubscribe = new Set<string>();
  const sentCommandTimestamps: number[] = [];

  let candleHandler: ((event: StreamCandleEvent) => void) | undefined;
  let summaryHandler: ((event: StreamSummaryEvent) => void) | undefined;
  let statusHandler: ((event: StreamStatusEvent) => void) | undefined;

  let currentSocket: WebSocket | undefined;
  let rotatingSocket: WebSocket | undefined;
  let rotationAckId: number | undefined;
  let commandId = 0;
  let attempt = 0;
  let disconnectedAt: number | undefined;
  let closed = false;
  let flushQueued = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let rotationTimer: ReturnType<typeof setTimeout> | undefined;
  let rateLimitTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimer(timer: ReturnType<typeof setTimeout> | undefined) {
    if (timer !== undefined) clearTimeout(timer);
    return undefined;
  }

  function nextCommandId(): number {
    commandId += 1;
    return commandId;
  }

  function pruneCommandWindow(current: number) {
    while (
      sentCommandTimestamps.length > 0 &&
      current - (sentCommandTimestamps[0] ?? 0) >= COMMAND_WINDOW_MS
    ) {
      sentCommandTimestamps.shift();
    }
  }

  function canSendCommand(current: number): boolean {
    pruneCommandWindow(current);
    return sentCommandTimestamps.length < MAX_COMMANDS_PER_SECOND;
  }

  function sendControl(socket: WebSocket, method: 'SUBSCRIBE' | 'UNSUBSCRIBE', params: string[]) {
    const id = nextCommandId();
    sentCommandTimestamps.push(now());
    socket.send(JSON.stringify({ method, params, id }));
    return id;
  }

  function scheduleRateLimitedFlush() {
    if (closed || rateLimitTimer !== undefined) return;
    const current = now();
    pruneCommandWindow(current);
    const oldest = sentCommandTimestamps[0];
    const delay = oldest === undefined ? 0 : Math.max(1, COMMAND_WINDOW_MS - (current - oldest));
    rateLimitTimer = setTimeout(() => {
      rateLimitTimer = undefined;
      flushPendingCommands();
    }, delay);
  }

  function flushPendingCommands() {
    if (closed || !currentSocket || currentSocket.readyState !== WebSocket.OPEN) return;
    if (pendingSubscribe.size > 0) {
      if (!canSendCommand(now())) {
        scheduleRateLimitedFlush();
        return;
      }
      const params = [...pendingSubscribe];
      pendingSubscribe.clear();
      sendControl(currentSocket, 'SUBSCRIBE', params);
    }
    if (pendingUnsubscribe.size > 0) {
      if (!canSendCommand(now())) {
        scheduleRateLimitedFlush();
        return;
      }
      const params = [...pendingUnsubscribe];
      pendingUnsubscribe.clear();
      sendControl(currentSocket, 'UNSUBSCRIBE', params);
      if (activeStreams.size === 0) {
        closeIdleConnection();
      }
    }
  }

  function queueFlush() {
    if (flushQueued || closed) return;
    flushQueued = true;
    queueMicrotask(() => {
      flushQueued = false;
      flushPendingCommands();
    });
  }

  function closeIdleConnection() {
    clearTimer(rotationTimer);
    rotationTimer = undefined;
    clearTimer(reconnectTimer);
    reconnectTimer = undefined;
    if (rotatingSocket) {
      const rot = rotatingSocket;
      rotatingSocket = undefined;
      rotationAckId = undefined;
      rot.close(1000);
    }
    if (currentSocket) {
      const sock = currentSocket;
      currentSocket = undefined;
      sock.close(1000);
    }
  }

  function scheduleRotation() {
    clearTimer(rotationTimer);
    rotationTimer = undefined;
    if (closed || activeStreams.size === 0) return;
    rotationTimer = setTimeout(() => {
      rotationTimer = undefined;
      startRotation();
    }, ROTATION_INTERVAL_MS);
  }

  function startRotation() {
    if (closed || activeStreams.size === 0 || rotatingSocket !== undefined) return;
    logger.info(
      { activeStreamsCount: activeStreams.size },
      'Starting proactive Binance WebSocket rotation.',
    );
    openSocket({ isReconnect: false, isRotation: true });
  }

  function scheduleReconnect(code?: number) {
    if (closed || activeStreams.size === 0 || reconnectTimer !== undefined) return;
    const cap = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt);
    const backoffMs = Math.floor(cap * random());
    attempt += 1;
    disconnectedAt ??= now();
    logger.warn(
      {
        event: 'binance_ws_disconnected',
        code,
        attempt,
        backoffMs,
        activeStreamsCount: activeStreams.size,
      },
      'Binance WebSocket disconnected; scheduling reconnect.',
    );
    statusHandler?.({ upstream: 'unavailable', resyncRequired: false });
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      if (closed || activeStreams.size === 0) return;
      openSocket({ isReconnect: true, isRotation: false });
    }, backoffMs);
  }

  function handleMessage(socket: WebSocket, raw: RawData) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawDataToString(raw));
    } catch {
      logger.warn(
        { event: 'binance_ws_invalid_frame' },
        'Dropped malformed JSON frame from Binance WebSocket.',
      );
      return;
    }

    const ack = ackSchema.safeParse(parsedJson);
    if (ack.success) {
      if (socket === rotatingSocket && ack.data.id === rotationAckId) {
        const previous = currentSocket;
        currentSocket = rotatingSocket;
        rotatingSocket = undefined;
        rotationAckId = undefined;
        scheduleRotation();
        logger.info(
          { activeStreamsCount: activeStreams.size },
          'Completed proactive Binance WebSocket rotation.',
        );
        previous?.close(1000);
        flushPendingCommands();
      }
      return;
    }

    // Only emit domain events from the active primary socket to avoid duplicates during rotation.
    if (socket !== currentSocket) return;

    const envelope = combinedEnvelopeSchema.safeParse(parsedJson);
    if (!envelope.success) {
      if (serverShutdownSchema.safeParse(parsedJson).success) {
        startRotation();
        return;
      }
      logger.warn(
        { event: 'binance_ws_invalid_frame' },
        'Dropped unrecognized envelope from Binance WebSocket.',
      );
      return;
    }

    const { stream, data } = envelope.data;
    if (serverShutdownSchema.safeParse(data).success) {
      startRotation();
      return;
    }

    const kline = klineDataSchema.safeParse(data);
    if (kline.success) {
      const k = kline.data.k;
      candleHandler?.({
        pair: kline.data.s,
        timeframe: k.i,
        candle: {
          openTime: k.t,
          open: k.o,
          high: k.h,
          low: k.l,
          close: k.c,
          volume: k.v,
          isClosed: k.x,
        },
        dataTime: now(),
        ...(kline.data.E !== undefined ? { sourceTime: kline.data.E } : {}),
      });
      return;
    }

    const ticker = tickerDataSchema.safeParse(data);
    if (ticker.success) {
      summaryHandler?.({
        summary: {
          pair: ticker.data.s,
          lastPrice: ticker.data.c,
          change24hPercent: ticker.data.P,
          dataTime: now(),
        },
        ...(ticker.data.E !== undefined ? { sourceTime: ticker.data.E } : {}),
      });
      return;
    }

    logger.warn(
      { event: 'binance_ws_invalid_frame', stream },
      'Dropped invalid market data payload from Binance WebSocket.',
    );
  }

  function openSocket({ isReconnect, isRotation }: { isReconnect: boolean; isRotation: boolean }) {
    if (closed) return;
    const socket = createWebSocket ? createWebSocket(wsUrl) : new WebSocket(wsUrl);
    if (isRotation) {
      rotatingSocket = socket;
    } else {
      currentSocket = socket;
    }

    socket.on('open', () => {
      if (closed) {
        socket.close(1000);
        return;
      }
      if (isRotation) {
        const params = [...activeStreams];
        if (params.length === 0) {
          rotatingSocket = undefined;
          socket.close(1000);
          return;
        }
        rotationAckId = sendControl(socket, 'SUBSCRIBE', params);
        return;
      }

      const downtimeMs = disconnectedAt === undefined ? 0 : now() - disconnectedAt;
      disconnectedAt = undefined;
      attempt = 0;
      pendingSubscribe.clear();
      pendingUnsubscribe.clear();

      const params = [...activeStreams];
      if (params.length > 0) {
        sendControl(socket, 'SUBSCRIBE', params);
      }
      scheduleRotation();
      logger.info(
        {
          event: 'binance_ws_connected',
          isReconnect,
          downtimeMs,
          activeStreamsCount: activeStreams.size,
        },
        'Connected to Binance WebSocket.',
      );
      statusHandler?.({ upstream: 'available', resyncRequired: isReconnect });
    });

    socket.on('message', (raw) => {
      handleMessage(socket, raw);
    });

    socket.on('error', () => {
      // Close event handles cleanup and backoff transitions.
    });

    socket.on('close', (code) => {
      if (socket === rotatingSocket) {
        rotatingSocket = undefined;
        rotationAckId = undefined;
        if (!closed && currentSocket === undefined && activeStreams.size > 0) {
          scheduleReconnect(code);
        }
        return;
      }
      if (socket !== currentSocket) return;
      currentSocket = undefined;
      clearTimer(rotationTimer);
      rotationTimer = undefined;
      if (closed || activeStreams.size === 0) return;
      scheduleReconnect(code);
    });
  }

  return {
    subscribe(channel) {
      if (closed) return;
      const stream = toStreamName(channel);
      if (activeStreams.has(stream)) return;
      activeStreams.add(stream);
      pendingUnsubscribe.delete(stream);
      if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
        pendingSubscribe.add(stream);
        queueFlush();
      } else if (currentSocket === undefined && reconnectTimer === undefined) {
        openSocket({ isReconnect: false, isRotation: false });
      }
    },
    unsubscribe(channel) {
      if (closed) return;
      const stream = toStreamName(channel);
      if (!activeStreams.has(stream)) return;
      activeStreams.delete(stream);
      pendingSubscribe.delete(stream);
      if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
        pendingUnsubscribe.add(stream);
        queueFlush();
      } else if (activeStreams.size === 0) {
        closeIdleConnection();
      }
    },
    onCandle(handler) {
      candleHandler = handler;
    },
    onSummary(handler) {
      summaryHandler = handler;
    },
    onStatus(handler) {
      statusHandler = handler;
    },
    async close() {
      closed = true;
      clearTimer(reconnectTimer);
      reconnectTimer = undefined;
      clearTimer(rotationTimer);
      rotationTimer = undefined;
      clearTimer(rateLimitTimer);
      rateLimitTimer = undefined;
      const sockets = [currentSocket, rotatingSocket].filter(
        (item): item is WebSocket => item !== undefined,
      );
      currentSocket = undefined;
      rotatingSocket = undefined;
      rotationAckId = undefined;
      await Promise.all(
        sockets.map(
          (sock) =>
            new Promise<void>((resolve) => {
              if (sock.readyState === WebSocket.CLOSED) {
                resolve();
                return;
              }
              sock.once('close', () => {
                resolve();
              });
              sock.close(1000);
            }),
        ),
      );
    },
  };
}
