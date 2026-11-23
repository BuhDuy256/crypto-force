// Checks the Binance WebSocket stream adapter against a local WebSocketServer fake (no external
// network). Run: pnpm --filter @crypto-force/api exec vitest run test/market-data/stream-provider.test.ts.
// Requires the _test DB from API global setup. Expected values:
// docs/testing/test-scopes/TS-002-market-data/websocket-verification.md (seam S3).
// Pre-build red state: src/providers/market-data/binance-stream.provider.ts does not exist yet.
// Fault checks (gate for build step): omitting kline/ticker mapping, sending >5 commands/sec,
// skipping re-subscribe or resyncRequired after reconnect, or crashing on malformed JSON must fail.
import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { createBinanceStreamProvider } from '../../src/providers/market-data/binance-stream.provider';
import { capturingLogger } from './fixtures';

interface ControlMessage {
  method: string;
  params: string[];
  id: number;
}

function rawDataToString(raw: RawData): string {
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
  return Buffer.from(raw).toString('utf8');
}

async function startFakeBinanceWs() {
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await once(wss, 'listening');
  const address = wss.address();
  if (!address || typeof address === 'string') throw new Error('The fake WS server has no port.');
  const sockets: WebSocket[] = [];
  const received: { socketIndex: number; at: number; body: ControlMessage }[] = [];
  wss.on('connection', (socket) => {
    const socketIndex = sockets.length;
    sockets.push(socket);
    socket.on('message', (raw) => {
      const body = JSON.parse(rawDataToString(raw)) as ControlMessage;
      received.push({ socketIndex, at: Date.now(), body });
      socket.send(JSON.stringify({ result: null, id: body.id }));
    });
  });
  return {
    url: `ws://127.0.0.1:${String(address.port)}/stream`,
    sockets,
    received,
    async close() {
      for (const socket of sockets) socket.terminate();
      await new Promise<void>((resolve) => {
        wss.close(() => {
          resolve();
        });
      });
    },
  };
}

let server: Awaited<ReturnType<typeof startFakeBinanceWs>> | undefined;

afterEach(async () => {
  vi.useRealTimers();
  if (server) {
    await server.close();
    server = undefined;
  }
});

describe('BinanceStreamProvider through local WebSocket boundary', () => {
  it('opens lazily on first subscribe, normalizes kline and 24hrTicker frames, and ignores malformed frames safely', async () => {
    server = await startFakeBinanceWs();
    const capture = capturingLogger();
    const candles: unknown[] = [];
    const summaries: unknown[] = [];
    const provider = createBinanceStreamProvider({
      wsUrl: server.url,
      now: () => 1735689600500,
      logger: capture.logger,
      random: () => 0.5,
    });
    provider.onCandle((event) => {
      candles.push(event);
    });
    provider.onSummary((event) => {
      summaries.push(event);
    });

    expect(server.sockets).toHaveLength(0);
    provider.subscribe({ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' });
    provider.subscribe({ kind: 'summary', pair: 'BTCUSDT' });

    await vi.waitFor(() => {
      const subscribed = server?.received
        .filter((item) => item.body.method === 'SUBSCRIBE')
        .flatMap((item) => item.body.params);
      expect(subscribed).toEqual(expect.arrayContaining(['btcusdt@kline_5m', 'btcusdt@ticker']));
    });

    const socket = server.sockets[0];
    if (!socket) throw new Error('Expected an active upstream socket.');

    // Malformed JSON and missing-field payload must be dropped without logging raw sentinel.
    socket.send('not-json-PrivateUpstreamSentinel');
    socket.send(
      JSON.stringify({ stream: 'btcusdt@kline_5m', data: { e: 'kline', bad: 'Sentinel2' } }),
    );

    // Valid kline frame with exact binary decimals.
    socket.send(
      JSON.stringify({
        stream: 'btcusdt@kline_5m',
        data: {
          e: 'kline',
          E: 1735689600450,
          s: 'BTCUSDT',
          k: {
            t: 1735689600000,
            i: '5m',
            o: '100.125',
            h: '102.875',
            l: '99.0625',
            c: '101.375',
            v: '12.625',
            x: true,
          },
        },
      }),
    );

    // Valid 24hrTicker frame.
    socket.send(
      JSON.stringify({
        stream: 'btcusdt@ticker',
        data: {
          e: '24hrTicker',
          E: 1735689600480,
          s: 'BTCUSDT',
          c: '618.125',
          P: '-1.25',
        },
      }),
    );

    await vi.waitFor(() => {
      expect(candles).toHaveLength(1);
      expect(summaries).toHaveLength(1);
    });

    expect(candles[0]).toEqual({
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: {
        openTime: 1735689600000,
        open: 100.125,
        high: 102.875,
        low: 99.0625,
        close: 101.375,
        volume: 12.625,
        isClosed: true,
      },
      dataTime: 1735689600500,
      sourceTime: 1735689600450,
    });
    expect(summaries[0]).toEqual({
      summary: {
        pair: 'BTCUSDT',
        lastPrice: 618.125,
        change24hPercent: -1.25,
        dataTime: 1735689600500,
      },
      sourceTime: 1735689600480,
    });
    expect(JSON.stringify(capture.records)).not.toContain('PrivateUpstreamSentinel');
    expect(JSON.stringify(capture.records)).not.toContain('Sentinel2');

    await provider.close();
  });

  it('emits unavailable on upstream drop, reconnects on backoff timer, re-subscribes active topics on the new socket and emits available with resyncRequired', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    server = await startFakeBinanceWs();
    const statuses: unknown[] = [];
    const provider = createBinanceStreamProvider({
      wsUrl: server.url,
      now: () => Date.now(),
      logger: capturingLogger().logger,
      // With 1000 ms base and full jitter random=0.5, the first reconnect delay is 500 ms.
      random: () => 0.5,
    });
    provider.onStatus((status) => {
      statuses.push(status);
    });
    provider.subscribe({ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' });

    await vi.waitFor(() => {
      expect(
        server?.received.some(
          (item) => item.socketIndex === 0 && item.body.params.includes('btcusdt@kline_5m'),
        ),
      ).toBe(true);
    });

    server.sockets[0]?.close(1011, 'upstream restart');

    await vi.waitFor(() => {
      expect(statuses).toContainEqual(expect.objectContaining({ upstream: 'unavailable' }));
    });

    // Before 500 ms backoff expires, no replacement socket should open.
    await vi.advanceTimersByTimeAsync(499);
    expect(server.sockets).toHaveLength(1);

    // At 500 ms backoff, replacement socket opens, re-subscribes on socketIndex >= 1, and requests resync.
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() => {
      expect(server?.sockets.length).toBeGreaterThanOrEqual(2);
      expect(
        server?.received.some(
          (item) =>
            item.socketIndex >= 1 &&
            item.body.method === 'SUBSCRIBE' &&
            item.body.params.includes('btcusdt@kline_5m'),
        ),
      ).toBe(true);
      expect(statuses).toContainEqual(
        expect.objectContaining({ upstream: 'available', resyncRequired: true }),
      );
    });

    await provider.close();
  });

  it('batches rapid subscribe commands within the 5 commands per second limit', async () => {
    server = await startFakeBinanceWs();
    const provider = createBinanceStreamProvider({
      wsUrl: server.url,
      now: () => 1735689600500,
      logger: capturingLogger().logger,
      random: () => 0.5,
    });

    for (const timeframe of ['1m', '5m', '15m', '1h', '4h', '1d'] as const) {
      provider.subscribe({ kind: 'kline', pair: 'BTCUSDT', timeframe });
      provider.subscribe({ kind: 'kline', pair: 'ETHUSDT', timeframe });
    }

    await vi.waitFor(() => {
      const allParams = server?.received
        .filter((item) => item.body.method === 'SUBSCRIBE')
        .flatMap((item) => item.body.params);
      expect(allParams).toHaveLength(12);
    });

    const subscribeFrames = server.received.filter((item) => item.body.method === 'SUBSCRIBE');
    expect(subscribeFrames.length).toBeLessThanOrEqual(5);

    await provider.close();
  });

  it('rotates the upstream connection proactively at 23h50m while receiving keepalive pings without reporting unavailable', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    server = await startFakeBinanceWs();
    const statuses: { upstream: string; resyncRequired?: boolean }[] = [];
    const provider = createBinanceStreamProvider({
      wsUrl: server.url,
      now: () => Date.now(),
      logger: capturingLogger().logger,
      random: () => 0.5,
    });
    provider.onStatus((status) => {
      statuses.push(status);
    });
    provider.subscribe({ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' });

    await vi.waitFor(() => {
      expect(server?.sockets).toHaveLength(1);
    });

    // Keep the upstream socket alive with periodic pings so silence timeout does not trigger.
    const keepalive = setInterval(() => {
      const current = server?.sockets[0];
      if (current && current.readyState === current.OPEN) current.ping();
    }, 30_000);

    try {
      // Advance to 23 hours 50 minutes (85,800,000 ms).
      await vi.advanceTimersByTimeAsync(85_800_000);

      await vi.waitFor(() => {
        expect(server?.sockets.length).toBeGreaterThanOrEqual(2);
        expect(
          server?.received.some(
            (item) =>
              item.socketIndex >= 1 &&
              item.body.method === 'SUBSCRIBE' &&
              item.body.params.includes('btcusdt@kline_5m'),
          ),
        ).toBe(true);
      });
      expect(statuses.some((item) => item.upstream === 'unavailable')).toBe(false);
      expect(statuses.some((item) => item.resyncRequired === true)).toBe(false);
    } finally {
      clearInterval(keepalive);
      await provider.close();
    }
  });
});
