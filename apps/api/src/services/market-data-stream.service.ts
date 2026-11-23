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

const METRICS_INTERVAL_MS = 10_000;

export type ClientFrameSink = (serializedFrame: string) => void;

export interface MarketDataStreamHub {
  subscribe(clientId: string, channel: MarketChannel, sink: ClientFrameSink): void;
  unsubscribe(clientId: string, channel: MarketChannel): void;
  removeClient(clientId: string): void;
  isUpstreamAvailable(): boolean;
  onStatus(handler: (status: StreamStatusEvent) => void): () => void;
  close(): Promise<void>;
}

function channelKey(channel: MarketChannel): string {
  return channel.kind === 'kline'
    ? `kline:${channel.pair}:${channel.timeframe}`
    : `summary:${channel.pair}`;
}

interface ClientSubscriptionState {
  sink: ClientFrameSink;
  channels: Map<string, MarketChannel>;
  provider: MarketDataStreamProvider;
  ownsProvider: boolean;
}

/**
 * Baseline B1 hub (per-client combined upstream): opens one dedicated upstream stream provider per
 * client when `createClientStreamProvider` is supplied, and serializes each event per client.
 */
export function createMarketDataStreamHub({
  streamProvider,
  createClientStreamProvider,
  onCandleClosed,
  now,
  logger,
}: {
  streamProvider?: MarketDataStreamProvider;
  createClientStreamProvider?: () => MarketDataStreamProvider;
  onCandleClosed: (pair: MarketPair, timeframe: MarketTimeframe) => void;
  now: () => number;
  logger: Logger;
}): MarketDataStreamHub {
  const clients = new Map<string, ClientSubscriptionState>();
  const statusListeners = new Set<(status: StreamStatusEvent) => void>();
  let upstreamAvailable = true;
  let droppedInvalidEvents = 0;
  let closed = false;

  const eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
  eventLoopMonitor.enable();

  function handleCandle(event: StreamCandleEvent, targetClientId?: string) {
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
    if (targetClientId !== undefined) {
      const client = clients.get(targetClientId);
      if (client?.channels.has(key)) {
        client.sink(JSON.stringify(parsed.data));
      }
    } else {
      for (const client of clients.values()) {
        if (client.channels.has(key)) {
          client.sink(JSON.stringify(parsed.data));
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

  function handleSummary(event: StreamSummaryEvent, targetClientId?: string) {
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
    if (targetClientId !== undefined) {
      const client = clients.get(targetClientId);
      if (client?.channels.has(key)) {
        client.sink(JSON.stringify(parsed.data));
      }
    } else {
      for (const client of clients.values()) {
        if (client.channels.has(key)) {
          client.sink(JSON.stringify(parsed.data));
        }
      }
    }
  }

  function handleStatus(status: StreamStatusEvent, targetClientId?: string) {
    upstreamAvailable = status.upstream === 'available';
    for (const listener of statusListeners) {
      listener(status);
    }
    const frame = JSON.stringify({
      type: 'status',
      upstream: status.upstream,
      resyncRequired: status.resyncRequired,
      serverTime: now(),
    });
    if (targetClientId !== undefined) {
      clients.get(targetClientId)?.sink(frame);
      return;
    }
    for (const client of clients.values()) {
      client.sink(frame);
    }
  }

  if (streamProvider) {
    streamProvider.onCandle((event) => {
      handleCandle(event);
    });
    streamProvider.onSummary((event) => {
      handleSummary(event);
    });
    streamProvider.onStatus((status) => {
      handleStatus(status);
    });
  }

  const metricsTimer = setInterval(() => {
    if (clients.size === 0) return;
    const topicKeys = new Set<string>();
    let totalSubscriptions = 0;
    for (const client of clients.values()) {
      for (const key of client.channels.keys()) {
        topicKeys.add(key);
        totalSubscriptions += 1;
      }
    }
    const memory = process.memoryUsage();
    logger.info(
      {
        activeWsClients: clients.size,
        activeTopics: topicKeys.size,
        upstreamSubscriptions: totalSubscriptions,
        fanOutRatio: totalSubscriptions === 0 ? 0 : 1,
        eventLoopLagP95Ms: Number((eventLoopMonitor.percentile(95) / 1e6).toFixed(3)),
        heapUsedMb: Number((memory.heapUsed / (1024 * 1024)).toFixed(2)),
        rssMb: Number((memory.rss / (1024 * 1024)).toFixed(2)),
        droppedInvalidEvents,
      },
      'Market data stream hub summary.',
    );
    eventLoopMonitor.reset();
  }, METRICS_INTERVAL_MS);

  function ensureClient(clientId: string, sink: ClientFrameSink): ClientSubscriptionState {
    const existing = clients.get(clientId);
    if (existing) {
      existing.sink = sink;
      return existing;
    }
    if (createClientStreamProvider) {
      const provider = createClientStreamProvider();
      provider.onCandle((event) => {
        handleCandle(event, clientId);
      });
      provider.onSummary((event) => {
        handleSummary(event, clientId);
      });
      provider.onStatus((status) => {
        handleStatus(status, clientId);
      });
      const state: ClientSubscriptionState = {
        sink,
        channels: new Map(),
        provider,
        ownsProvider: true,
      };
      clients.set(clientId, state);
      return state;
    }
    if (!streamProvider) {
      throw new Error('A stream provider or per-client factory is required.');
    }
    const state: ClientSubscriptionState = {
      sink,
      channels: new Map(),
      provider: streamProvider,
      ownsProvider: false,
    };
    clients.set(clientId, state);
    return state;
  }

  return {
    subscribe(clientId, channel, sink) {
      if (closed) return;
      const client = ensureClient(clientId, sink);
      const key = channelKey(channel);
      if (client.channels.has(key)) return;
      client.channels.set(key, channel);
      client.provider.subscribe(channel);
    },
    unsubscribe(clientId, channel) {
      const client = clients.get(clientId);
      if (!client) return;
      const key = channelKey(channel);
      if (!client.channels.delete(key)) return;
      client.provider.unsubscribe(channel);
    },
    removeClient(clientId) {
      const client = clients.get(clientId);
      if (!client) return;
      clients.delete(clientId);
      for (const channel of client.channels.values()) {
        client.provider.unsubscribe(channel);
      }
      client.channels.clear();
      if (client.ownsProvider) {
        void client.provider.close();
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
      const closePromises: Promise<void>[] = [];
      for (const client of clients.values()) {
        if (client.ownsProvider) closePromises.push(client.provider.close());
      }
      clients.clear();
      statusListeners.clear();
      if (streamProvider) closePromises.push(streamProvider.close());
      await Promise.all(closePromises);
    },
  };
}
