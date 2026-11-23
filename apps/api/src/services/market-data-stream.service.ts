import { monitorEventLoopDelay } from 'node:perf_hooks';
import {
  wsServerMessageSchema,
  type MarketChannel,
  type MarketPair,
  type MarketTimeframe,
} from '@crypto-force/shared';
import type { Logger } from 'pino';
import type {
  MarketDataStreamProvider,
  StreamCandleEvent,
  StreamStatusEvent,
  StreamSummaryEvent,
} from '../providers/market-data/market-data-provider';

const IDLE_UNSUBSCRIBE_DELAY_MS = 5_000;
const METRICS_INTERVAL_MS = 10_000;

type ClientFrameSink = (serializedFrame: string) => void;

export interface MarketDataStreamHub {
  subscribe(clientId: string, channel: MarketChannel, sink: ClientFrameSink): void;
  unsubscribe(clientId: string, channel: MarketChannel): void;
  removeClient(clientId: string): void;
  isUpstreamAvailable(): boolean;
  onStatus(handler: (status: StreamStatusEvent) => void): () => void;
  close(): Promise<void>;
}

interface TopicEntry {
  channel: MarketChannel;
  subscribers: Map<string, ClientFrameSink>;
  idleTimer?: ReturnType<typeof setTimeout> | undefined;
  lastValidEventAt?: number | undefined;
}

function channelKey(channel: MarketChannel): string {
  return channel.kind === 'kline'
    ? `kline:${channel.pair}:${channel.timeframe}`
    : `summary:${channel.pair}`;
}

export function createMarketDataStreamHub({
  streamProvider,
  onCandleClosed,
  now,
  logger,
}: {
  streamProvider: MarketDataStreamProvider;
  onCandleClosed: (pair: MarketPair, timeframe: MarketTimeframe) => void;
  now: () => number;
  logger: Logger;
}): MarketDataStreamHub {
  const topics = new Map<string, TopicEntry>();
  const clientSinks = new Map<string, ClientFrameSink>();
  const clientTopics = new Map<string, Set<string>>();
  const statusListeners = new Set<(status: StreamStatusEvent) => void>();
  let upstreamAvailable = true;
  let droppedInvalidEvents = 0;
  let closed = false;

  const eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
  eventLoopMonitor.enable();

  function handleCandle(event: StreamCandleEvent) {
    const start = performance.now();
    const message = {
      type: 'candle' as const,
      pair: event.pair,
      timeframe: event.timeframe,
      candle: event.candle,
      dataTime: event.dataTime,
      ...(event.sourceTime !== undefined ? { sourceTime: event.sourceTime } : {}),
    };
    const parsed = wsServerMessageSchema.safeParse(message);
    if (!parsed.success) {
      droppedInvalidEvents += 1;
      logger.warn(
        { pair: event.pair, timeframe: event.timeframe, droppedInvalidEvents },
        'Dropped invalid live candle event.',
      );
      return;
    }

    if (event.candle.isClosed) {
      onCandleClosed(event.pair, event.timeframe);
    }

    const key = `kline:${event.pair}:${event.timeframe}`;
    const topic = topics.get(key);
    if (topic) {
      topic.lastValidEventAt = event.dataTime;
      if (topic.subscribers.size > 0) {
        const serialized = JSON.stringify(parsed.data);
        for (const sink of topic.subscribers.values()) {
          sink(serialized);
        }
      }
    }

    const dispatchDurationMs = performance.now() - start;
    const upstreamDelayMs =
      event.sourceTime !== undefined ? event.dataTime - event.sourceTime : undefined;
    logger.debug(
      {
        pair: event.pair,
        timeframe: event.timeframe,
        dispatchDurationMs,
        ...(upstreamDelayMs !== undefined ? { upstreamDelayMs } : {}),
      },
      'Dispatched live candle event.',
    );
  }

  function handleSummary(event: StreamSummaryEvent) {
    const message = {
      type: 'summary' as const,
      summary: event.summary,
      ...(event.sourceTime !== undefined ? { sourceTime: event.sourceTime } : {}),
    };
    const parsed = wsServerMessageSchema.safeParse(message);
    if (!parsed.success) {
      droppedInvalidEvents += 1;
      logger.warn(
        { pair: event.summary.pair, droppedInvalidEvents },
        'Dropped invalid live summary event.',
      );
      return;
    }

    const key = `summary:${event.summary.pair}`;
    const topic = topics.get(key);
    if (topic) {
      topic.lastValidEventAt = event.summary.dataTime;
      if (topic.subscribers.size > 0) {
        const serialized = JSON.stringify(parsed.data);
        for (const sink of topic.subscribers.values()) {
          sink(serialized);
        }
      }
    }
  }

  function handleStatus(status: StreamStatusEvent) {
    upstreamAvailable = status.upstream === 'available';
    for (const listener of statusListeners) {
      listener(status);
    }
    const serialized = JSON.stringify({
      type: 'status',
      upstream: status.upstream,
      resyncRequired: status.resyncRequired,
      serverTime: now(),
    });
    for (const sink of clientSinks.values()) {
      sink(serialized);
    }
  }

  streamProvider.onCandle(handleCandle);
  streamProvider.onSummary(handleSummary);
  streamProvider.onStatus(handleStatus);

  const metricsTimer = setInterval(() => {
    if (clientSinks.size === 0) return;
    let activeTopics = 0;
    let totalSubscribers = 0;
    for (const topic of topics.values()) {
      if (topic.subscribers.size > 0) {
        activeTopics += 1;
        totalSubscribers += topic.subscribers.size;
      }
    }
    const upstreamSubscriptions = topics.size;
    const fanOutRatio =
      upstreamSubscriptions === 0
        ? 0
        : Number((totalSubscribers / upstreamSubscriptions).toFixed(2));
    const memory = process.memoryUsage();
    logger.info(
      {
        activeWsClients: clientSinks.size,
        activeTopics,
        upstreamSubscriptions,
        fanOutRatio,
        eventLoopLagP95Ms: Number((eventLoopMonitor.percentile(95) / 1e6).toFixed(3)),
        heapUsedMb: Number((memory.heapUsed / (1024 * 1024)).toFixed(2)),
        rssMb: Number((memory.rss / (1024 * 1024)).toFixed(2)),
        droppedInvalidEvents,
      },
      'Market data stream hub summary.',
    );
    eventLoopMonitor.reset();
  }, METRICS_INTERVAL_MS);

  function scheduleIdleUnsubscribe(key: string, topic: TopicEntry) {
    if (topic.idleTimer !== undefined) return;
    topic.idleTimer = setTimeout(() => {
      topic.idleTimer = undefined;
      if (topic.subscribers.size === 0 && topics.get(key) === topic) {
        topics.delete(key);
        streamProvider.unsubscribe(topic.channel);
      }
    }, IDLE_UNSUBSCRIBE_DELAY_MS);
  }

  return {
    subscribe(clientId, channel, sink) {
      if (closed) return;
      clientSinks.set(clientId, sink);
      const key = channelKey(channel);
      let topic = topics.get(key);
      if (topic) {
        if (topic.idleTimer !== undefined) {
          clearTimeout(topic.idleTimer);
          topic.idleTimer = undefined;
        }
        topic.subscribers.set(clientId, sink);
      } else {
        topic = {
          channel,
          subscribers: new Map([[clientId, sink]]),
        };
        topics.set(key, topic);
        streamProvider.subscribe(channel);
      }
      const owned = clientTopics.get(clientId) ?? new Set<string>();
      owned.add(key);
      clientTopics.set(clientId, owned);
    },
    unsubscribe(clientId, channel) {
      const key = channelKey(channel);
      const owned = clientTopics.get(clientId);
      if (owned) {
        owned.delete(key);
        if (owned.size === 0) {
          clientTopics.delete(clientId);
          clientSinks.delete(clientId);
        }
      }
      const topic = topics.get(key);
      if (!topic) return;
      if (!topic.subscribers.delete(clientId)) return;
      if (topic.subscribers.size === 0) {
        scheduleIdleUnsubscribe(key, topic);
      }
    },
    removeClient(clientId) {
      const owned = clientTopics.get(clientId);
      clientTopics.delete(clientId);
      clientSinks.delete(clientId);
      if (!owned) return;
      for (const key of owned) {
        const topic = topics.get(key);
        if (topic && topic.subscribers.delete(clientId) && topic.subscribers.size === 0) {
          scheduleIdleUnsubscribe(key, topic);
        }
      }
    },
    isUpstreamAvailable() {
      return upstreamAvailable;
    },
    onStatus(handler) {
      statusListeners.add(handler);
      return () => {
        statusListeners.delete(handler);
      };
    },
    async close() {
      closed = true;
      clearInterval(metricsTimer);
      eventLoopMonitor.disable();
      for (const topic of topics.values()) {
        if (topic.idleTimer !== undefined) {
          clearTimeout(topic.idleTimer);
          topic.idleTimer = undefined;
        }
      }
      topics.clear();
      clientSinks.clear();
      clientTopics.clear();
      statusListeners.clear();
      await streamProvider.close();
    },
  };
}
