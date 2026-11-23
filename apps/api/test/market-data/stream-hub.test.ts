// Checks MarketDataStreamHub through an injected MarketDataStreamProvider fake.
// Run: pnpm --filter @crypto-force/api exec vitest run test/market-data/stream-hub.test.ts.
// Requires the _test DB from API global setup. Expected values:
// docs/testing/test-scopes/TS-002-market-data/websocket-verification.md (seam S4).
// Pre-build red state: src/services/market-data-stream.service.ts does not exist yet.
// Fault checks (gate for build step): subscribing upstream per client, skipping 5s grace delay,
// omitting onCandleClosed, or forwarding invalid candles must fail these assertions.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMarketDataStreamHub } from '../../src/services/market-data-stream.service';
import type {
  MarketDataStreamProvider,
  StreamCandleEvent,
  StreamStatusEvent,
  StreamSummaryEvent,
} from '../../src/providers/market-data/market-data-provider';
import { capturingLogger } from './fixtures';

function fakeStreamProvider() {
  let candleHandler: ((event: StreamCandleEvent) => void) | undefined;
  let summaryHandler: ((event: StreamSummaryEvent) => void) | undefined;
  let statusHandler: ((event: StreamStatusEvent) => void) | undefined;
  const subscribed: unknown[] = [];
  const unsubscribed: unknown[] = [];
  const close = vi.fn(() => Promise.resolve());

  const provider: MarketDataStreamProvider = {
    subscribe(channel) {
      subscribed.push(channel);
    },
    unsubscribe(channel) {
      unsubscribed.push(channel);
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
    close,
  };

  return {
    provider,
    subscribed,
    unsubscribed,
    close,
    emitCandle: (event: StreamCandleEvent) => {
      candleHandler?.(event);
    },
    emitSummary: (event: StreamSummaryEvent) => {
      summaryHandler?.(event);
    },
    emitStatus: (event: StreamStatusEvent) => {
      statusHandler?.(event);
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('MarketDataStreamHub shared subscriptions and fan-out', () => {
  it('opens at most one upstream subscription for ten clients on the same topic and fans out identical serialized JSON', async () => {
    const fake = fakeStreamProvider();
    const onCandleClosed = vi.fn();
    const hub = createMarketDataStreamHub({
      streamProvider: fake.provider,
      onCandleClosed,
      now: () => 1735689600500,
      logger: capturingLogger().logger,
    });

    const received: string[][] = Array.from({ length: 10 }, () => []);
    for (let index = 0; index < 10; index += 1) {
      hub.subscribe(
        `client-${String(index)}`,
        { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' },
        (payload) => {
          received[index]?.push(payload);
        },
      );
    }

    expect(fake.subscribed).toEqual([{ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }]);

    fake.emitCandle({
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: {
        openTime: 1735689600000,
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 15,
        isClosed: false,
      },
      dataTime: 1735689600500,
      sourceTime: 1735689600450,
    });

    const expected = JSON.stringify({
      type: 'candle',
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: {
        openTime: 1735689600000,
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 15,
        isClosed: false,
      },
      dataTime: 1735689600500,
      sourceTime: 1735689600450,
    });
    for (const inbox of received) {
      expect(inbox).toEqual([expected]);
    }
    expect(onCandleClosed).not.toHaveBeenCalled();

    await hub.close();
  });

  it('keeps an idle upstream topic for 4999 ms and unsubscribes at 5000 ms', async () => {
    vi.useFakeTimers();
    const fake = fakeStreamProvider();
    const hub = createMarketDataStreamHub({
      streamProvider: fake.provider,
      onCandleClosed: vi.fn(),
      now: () => Date.now(),
      logger: capturingLogger().logger,
    });
    const channel = { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' } as const;

    hub.subscribe('client-1', channel, vi.fn());
    hub.unsubscribe('client-1', channel);

    await vi.advanceTimersByTimeAsync(4999);
    expect(fake.unsubscribed).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(fake.unsubscribed).toEqual([channel]);

    await hub.close();
  });

  it('cancels the idle unsubscribe timer when another client subscribes at 4999 ms', async () => {
    vi.useFakeTimers();
    const fake = fakeStreamProvider();
    const hub = createMarketDataStreamHub({
      streamProvider: fake.provider,
      onCandleClosed: vi.fn(),
      now: () => Date.now(),
      logger: capturingLogger().logger,
    });
    const channel = { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' } as const;

    hub.subscribe('client-1', channel, vi.fn());
    hub.unsubscribe('client-1', channel);
    await vi.advanceTimersByTimeAsync(4999);
    hub.subscribe('client-2', channel, vi.fn());
    await vi.advanceTimersByTimeAsync(5000);

    expect(fake.subscribed).toHaveLength(1);
    expect(fake.unsubscribed).toEqual([]);

    await hub.close();
  });

  it('calls onCandleClosed only when isClosed is true and drops invalid candles or summaries before fan-out', async () => {
    const fake = fakeStreamProvider();
    const onCandleClosed = vi.fn();
    const capture = capturingLogger();
    const hub = createMarketDataStreamHub({
      streamProvider: fake.provider,
      onCandleClosed,
      now: () => 1735689900500,
      logger: capture.logger,
    });
    const sink = vi.fn();
    hub.subscribe('client-1', { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }, sink);
    hub.subscribe('client-1', { kind: 'summary', pair: 'BTCUSDT' }, sink);

    // Invalid candle (high < low), off-interval openTime, and invalid summary (lastPrice <= 0).
    fake.emitCandle({
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: {
        openTime: 1735689600000,
        open: 100,
        high: 98,
        low: 99,
        close: 100,
        volume: 5,
        isClosed: true,
      },
      dataTime: 1735689900500,
    });
    fake.emitCandle({
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: {
        openTime: 1735689600001,
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 5,
        isClosed: true,
      },
      dataTime: 1735689900500,
    });
    fake.emitSummary({
      summary: { pair: 'BTCUSDT', lastPrice: 0, change24hPercent: 1, dataTime: 1735689900500 },
    });

    expect(sink).not.toHaveBeenCalled();
    expect(onCandleClosed).not.toHaveBeenCalled();

    // Valid closed candle must call onCandleClosed and fan out.
    fake.emitCandle({
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: {
        openTime: 1735689600000,
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        volume: 5,
        isClosed: true,
      },
      dataTime: 1735689900500,
    });

    expect(onCandleClosed).toHaveBeenCalledTimes(1);
    expect(onCandleClosed).toHaveBeenCalledWith('BTCUSDT', '5m');
    expect(sink).toHaveBeenCalledTimes(1);

    await hub.close();
  });

  it('logs periodic hub metrics every 10 seconds while clients are connected and forwards upstream status', async () => {
    vi.useFakeTimers();
    const fake = fakeStreamProvider();
    const capture = capturingLogger();
    const hub = createMarketDataStreamHub({
      streamProvider: fake.provider,
      onCandleClosed: vi.fn(),
      now: () => 1735689610000,
      logger: capture.logger,
    });
    const sink = vi.fn();

    hub.subscribe('client-1', { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }, sink);
    hub.subscribe('client-2', { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }, sink);

    fake.emitStatus({ upstream: 'unavailable', resyncRequired: false });
    expect(sink).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'status',
        upstream: 'unavailable',
        resyncRequired: false,
        serverTime: 1735689610000,
      }),
    );

    await vi.advanceTimersByTimeAsync(10_000);
    expect(capture.records).toContainEqual(
      expect.objectContaining({
        activeWsClients: 2,
        activeTopics: 1,
        upstreamSubscriptions: 1,
        fanOutRatio: 2,
        droppedInvalidEvents: 0,
      }),
    );

    await hub.close();
  });
});
