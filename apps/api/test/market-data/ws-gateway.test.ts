// Checks WebSocket upgrade security order, per-account tab limit, channel/payload/rate limits,
// 5s heartbeat, slow-consumer 4008 backpressure (>64 KB bufferedAmount), hook and 3s batch session
// revocation (4401) and graceful shutdown (1001) against real HTTP, Better Auth and PostgreSQL _test DB.
// Run: pnpm --filter @crypto-force/api exec vitest run test/market-data/ws-gateway.test.ts.
// Expected values: docs/testing/test-scopes/TS-002-market-data/websocket-verification.md (seams S5, S6).
// Pre-build red state: session.repository.ts, ws-session.service.ts, market-data-stream.service.ts
// and api/ws/market-data.ws.ts do not exist yet.
// Fault checks (gate for build step): checking session before Origin/TLS, allowing tab 5, omitting
// 4401 on DB session deletion, dropping heartbeat or skipping 4008 on >64KB bufferedAmount must fail.
import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { WebSocket, type RawData } from 'ws';
import { createApp } from '../../src/app';
import { attachMarketDataWs } from '../../src/api/ws/market-data.ws';
import { createAuth } from '../../src/configs/auth';
import { createSessionRepository } from '../../src/repositories/session.repository';
import { createAuthEmails } from '../../src/services/auth-email.service';
import { createMarketDataStreamHub } from '../../src/services/market-data-stream.service';
import { createWsSessionService } from '../../src/services/ws-session.service';
import type {
  MarketDataStreamProvider,
  StreamCandleEvent,
  StreamStatusEvent,
  StreamSummaryEvent,
} from '../../src/providers/market-data/market-data-provider';
import {
  APP_URL,
  createIpPool,
  createVerifiedAccount,
  db,
  MemoryMailer,
  NEW_PASSWORD,
  newResetToken,
  pool,
  resetPassword,
  sessionToken,
  TEST_SECRET,
  type Harness,
} from '../support/harness';
import { installFetchStub, outbound, resetOutbound } from '../support/outbound';
import { capturingLogger } from './fixtures';

function fakeStreamProvider() {
  let onCandleHandler: ((event: StreamCandleEvent) => void) | undefined;
  let onSummaryHandler: ((event: StreamSummaryEvent) => void) | undefined;
  let onStatusHandler: ((event: StreamStatusEvent) => void) | undefined;
  const provider: MarketDataStreamProvider = {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onCandle(handler) {
      onCandleHandler = handler;
    },
    onSummary(handler) {
      onSummaryHandler = handler;
    },
    onStatus(handler) {
      onStatusHandler = handler;
    },
    close: vi.fn(() => Promise.resolve()),
  };
  return {
    provider,
    emitCandle: (event: StreamCandleEvent) => {
      onCandleHandler?.(event);
    },
    emitSummary: (event: StreamSummaryEvent) => {
      onSummaryHandler?.(event);
    },
    emitStatus: (event: StreamStatusEvent) => {
      onStatusHandler?.(event);
    },
  };
}

function rawDataToString(raw: RawData): string {
  if (typeof raw === 'string') return raw;
  if (Buffer.isBuffer(raw)) return raw.toString('utf8');
  if (Array.isArray(raw)) return Buffer.concat(raw).toString('utf8');
  return Buffer.from(raw).toString('utf8');
}

function connectWs(url: string, headers: Record<string, string>) {
  return new Promise<
    | {
        connected: true;
        ws: WebSocket;
        messages: unknown[];
        closed: Promise<{ code: number; reason: string }>;
      }
    | { connected: false; statusCode: number }
  >((resolve, reject) => {
    const ws = new WebSocket(url, { headers });
    const messages: unknown[] = [];
    const closed = new Promise<{ code: number; reason: string }>((resolveClose) => {
      ws.once('close', (code, reason) => {
        resolveClose({ code, reason: reason.toString() });
      });
    });
    ws.on('message', (data) => {
      messages.push(JSON.parse(rawDataToString(data)));
    });
    ws.once('open', () => {
      resolve({ connected: true, ws, messages, closed });
    });
    ws.once('unexpected-response', (_req, res) => {
      ws.terminate();
      resolve({ connected: false, statusCode: res.statusCode ?? 0 });
    });
    ws.once('error', (error) => {
      if (ws.readyState === WebSocket.CONNECTING) reject(error);
    });
  });
}

async function createWsStack(
  options: { requireTls?: boolean; maxConnectionsPerUser?: number } = {},
) {
  installFetchStub();
  const capture = capturingLogger();
  const mailer = new MemoryMailer();
  const fakeStream = fakeStreamProvider();
  const revokeRef: { current?: (sessionId: string) => void } = {};

  const auth = createAuth({
    env: {
      NODE_ENV: options.requireTls ? 'production' : 'test',
      BETTER_AUTH_SECRET: TEST_SECRET,
      BETTER_AUTH_URL: APP_URL,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    },
    db,
    emails: createAuthEmails(mailer, APP_URL),
    logger: capture.logger,
    onSessionRevoked(sessionId: string) {
      revokeRef.current?.(sessionId);
    },
  } as Parameters<typeof createAuth>[0] & { onSessionRevoked?: (sessionId: string) => void });

  const app = createApp({
    logger: capture.logger,
    auth,
    authConfig: { google: false },
    marketDataProvider: { getCandles: vi.fn(), getSummary: vi.fn() },
  });
  const server: Server = createServer(app);
  const sessionRepository = createSessionRepository(db);
  const wsSessionService = createWsSessionService({ sessionRepository, now: Date.now });
  const streamHub = createMarketDataStreamHub({
    streamProvider: fakeStream.provider,
    onCandleClosed: vi.fn(),
    now: Date.now,
    logger: capture.logger,
  });
  const gateway = attachMarketDataWs({
    server,
    auth,
    wsSessionService,
    streamHub,
    allowedOrigin: APP_URL,
    requireTls: options.requireTls ?? false,
    maxConnectionsPerUser: options.maxConnectionsPerUser ?? 4,
    logger: capture.logger,
    now: Date.now,
  });
  revokeRef.current = (sessionId) => {
    gateway.revokeSession(sessionId);
  };

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('The test server has no port.');
  const wsUrl = `ws://127.0.0.1:${String(address.port)}/api/market-data/ws`;

  const harness: Harness = {
    auth,
    mailer,
    logger: capture.logger,
    logs: capture.records as Harness['logs'],
    call: async (path, { method = 'POST', body, cookie, ip, headers } = {}) => {
      const url = path.startsWith('http') ? path : `${APP_URL}/api/auth${path}`;
      return auth.handler(
        new Request(url, {
          method,
          headers: {
            'content-type': 'application/json',
            origin: APP_URL,
            ...(ip ? { 'x-forwarded-for': ip } : {}),
            ...(cookie ? { cookie } : {}),
            ...headers,
          },
          body: body === undefined || method === 'GET' ? null : JSON.stringify(body),
          redirect: 'manual',
        }),
      );
    },
  };

  return {
    wsUrl,
    harness,
    capture,
    fakeStream,
    gateway,
    streamHub,
    async stop() {
      await gateway.close();
      await streamHub.close();
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    },
  };
}

const ip = createIpPool(95);
let stack: Awaited<ReturnType<typeof createWsStack>> | undefined;

beforeAll(() => {
  resetOutbound();
});

afterEach(async () => {
  vi.useRealTimers();
  if (stack) {
    await stack.stop();
    stack = undefined;
  }
  expect(outbound.unexpected).toEqual([]);
});

afterAll(async () => {
  await pool.end();
});

describe('WebSocket Gateway handshake security and limits', () => {
  it('enforces Origin check (403) and production TLS check (403) before session check (401)', async () => {
    stack = await createWsStack({ requireTls: true });
    const account = await createVerifiedAccount(stack.harness, ip);

    // Omitting the cookie proves Origin and TLS checks run before getSession (must return 403, not 401).
    const missingOriginNoCookie = await connectWs(stack.wsUrl, {
      'x-forwarded-proto': 'https',
    });
    expect(missingOriginNoCookie).toEqual({ connected: false, statusCode: 403 });

    const wrongOriginNoCookie = await connectWs(stack.wsUrl, {
      origin: 'https://evil.example',
      'x-forwarded-proto': 'https',
    });
    expect(wrongOriginNoCookie).toEqual({ connected: false, statusCode: 403 });

    const nonTlsNoCookie = await connectWs(stack.wsUrl, {
      origin: APP_URL,
      'x-forwarded-proto': 'http',
    });
    expect(nonTlsNoCookie).toEqual({ connected: false, statusCode: 403 });

    const unauthenticated = await connectWs(stack.wsUrl, {
      origin: APP_URL,
      'x-forwarded-proto': 'https',
    });
    expect(unauthenticated).toEqual({ connected: false, statusCode: 401 });

    const valid = await connectWs(stack.wsUrl, {
      origin: APP_URL,
      cookie: account.cookie,
      'x-forwarded-proto': 'https',
    });
    expect(valid.connected).toBe(true);
    if (valid.connected) valid.ws.close(1000);

    // Logs must never contain raw session cookies or tokens.
    const token = sessionToken(account.cookie) ?? '';
    expect(JSON.stringify(stack.capture.records)).not.toContain(token);
  });

  it('allows 4 concurrent connections per account, closes the 5th with 4429 and keeps the first 4 open', async () => {
    stack = await createWsStack({ maxConnectionsPerUser: 4 });
    const account = await createVerifiedAccount(stack.harness, ip);
    const headers = { origin: APP_URL, cookie: account.cookie };

    const openTabs: Extract<Awaited<ReturnType<typeof connectWs>>, { connected: true }>[] = [];
    for (let index = 0; index < 4; index += 1) {
      const connection = await connectWs(stack.wsUrl, headers);
      expect(connection.connected).toBe(true);
      if (connection.connected) openTabs.push(connection);
    }

    const fifth = await connectWs(stack.wsUrl, headers);
    expect(fifth.connected).toBe(true);
    if (fifth.connected) {
      const closeResult = await fifth.closed;
      expect(closeResult.code).toBe(4429);
      expect(fifth.messages).toContainEqual(
        expect.objectContaining({ type: 'error', code: 'CONNECTION_LIMIT_EXCEEDED' }),
      );
    }

    for (const tab of openTabs) {
      expect(tab.ws.readyState).toBe(WebSocket.OPEN);
    }

    openTabs[0]?.ws.close(1000);
    await openTabs[0]?.closed;
    const replacement = await connectWs(stack.wsUrl, headers);
    expect(replacement.connected).toBe(true);
    if (replacement.connected) replacement.ws.close(1000);
    for (const tab of openTabs.slice(1)) tab.ws.close(1000);
  });

  it('enforces the 10-channel subscription limit, 4 KB maxPayload and 20 messages per 10 seconds rate limit', async () => {
    stack = await createWsStack();
    const account = await createVerifiedAccount(stack.harness, ip);
    const conn = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(conn.connected).toBe(true);
    if (!conn.connected) return;

    const tenChannels = [
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '1m' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '15m' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '1h' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '4h' },
      { kind: 'kline', pair: 'BTCUSDT', timeframe: '1d' },
      { kind: 'kline', pair: 'ETHUSDT', timeframe: '1m' },
      { kind: 'kline', pair: 'ETHUSDT', timeframe: '5m' },
      { kind: 'kline', pair: 'ETHUSDT', timeframe: '15m' },
      { kind: 'summary', pair: 'BTCUSDT' },
    ];
    conn.ws.send(JSON.stringify({ type: 'subscribe', channels: tenChannels }));
    await vi.waitFor(() => {
      expect(conn.messages).toContainEqual(expect.objectContaining({ type: 'subscribed' }));
    });

    // 11th channel must return SUBSCRIPTION_LIMIT_EXCEEDED.
    conn.ws.send(
      JSON.stringify({
        type: 'subscribe',
        channels: [{ kind: 'summary', pair: 'ETHUSDT' }],
      }),
    );
    await vi.waitFor(() => {
      expect(conn.messages).toContainEqual(
        expect.objectContaining({ type: 'error', code: 'SUBSCRIPTION_LIMIT_EXCEEDED' }),
      );
    });

    // 21st message inside 10s must trigger RATE_LIMITED and close with 4429.
    for (let index = 0; index < 19; index += 1) {
      conn.ws.send(
        JSON.stringify({
          type: 'unsubscribe',
          channels: [{ kind: 'summary', pair: 'SOLUSDT' }],
        }),
      );
    }
    const closed = await conn.closed;
    expect(closed.code).toBe(4429);
    expect(conn.messages).toContainEqual(
      expect.objectContaining({ type: 'error', code: 'RATE_LIMITED' }),
    );

    // Payload exceeding 4096 bytes must close the socket (ws emits 1009).
    const oversizedConn = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(oversizedConn.connected).toBe(true);
    if (oversizedConn.connected) {
      oversizedConn.ws.send('x'.repeat(4097));
      const oversizedClose = await oversizedConn.closed;
      expect(oversizedClose.code).toBe(1009);
    }
  });

  it('sends heartbeat frames every 5 seconds while upstream is healthy and pauses them when upstream is unavailable', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    stack = await createWsStack();
    const account = await createVerifiedAccount(stack.harness, ip);
    const conn = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(conn.connected).toBe(true);
    if (!conn.connected) return;

    await vi.advanceTimersByTimeAsync(5000);
    await vi.waitFor(() => {
      expect(conn.messages).toContainEqual(expect.objectContaining({ type: 'heartbeat' }));
    });

    const heartbeatsBefore = conn.messages.filter(
      (item) =>
        typeof item === 'object' && item !== null && 'type' in item && item.type === 'heartbeat',
    ).length;
    stack.fakeStream.emitStatus({ upstream: 'unavailable', resyncRequired: false });
    await vi.advanceTimersByTimeAsync(5000);
    const heartbeatsAfter = conn.messages.filter(
      (item) =>
        typeof item === 'object' && item !== null && 'type' in item && item.type === 'heartbeat',
    ).length;
    expect(heartbeatsAfter).toBe(heartbeatsBefore);
    conn.ws.close(1000);
  });

  it('closes a slow consumer with code 4008 when send buffer exceeds 64 KB without interrupting healthy clients', async () => {
    stack = await createWsStack();
    const account = await createVerifiedAccount(stack.harness, ip);
    const slow = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    const healthy = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(slow.connected && healthy.connected).toBe(true);
    if (!slow.connected || !healthy.connected) return;

    const sub = JSON.stringify({
      type: 'subscribe',
      channels: [{ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }],
    });
    slow.ws.send(sub);
    healthy.ws.send(sub);
    await vi.waitFor(() => {
      expect(slow.messages).toContainEqual(expect.objectContaining({ type: 'subscribed' }));
      expect(healthy.messages).toContainEqual(expect.objectContaining({ type: 'subscribed' }));
    });

    // Pause reads on the slow client TCP socket so server-side bufferedAmount grows past 64 KB.
    const rawSocket = (slow.ws as unknown as { _socket?: { pause: () => void } })._socket;
    rawSocket?.pause();
    for (let index = 0; index < 800; index += 1) {
      stack.fakeStream.emitCandle({
        pair: 'BTCUSDT',
        timeframe: '5m',
        candle: {
          openTime: 1735689600000,
          open: 100,
          high: 102 + index * 0.125,
          low: 99,
          close: 101 + index * 0.125,
          volume: 10 + index,
          isClosed: false,
        },
        dataTime: 1735689600500 + index,
      });
    }

    const slowClose = await slow.closed;
    expect(slowClose.code).toBe(4008);
    expect(healthy.ws.readyState).toBe(WebSocket.OPEN);
    expect(stack.capture.records).toContainEqual(expect.objectContaining({ closeCode: 4008 }));
    healthy.ws.close(1000);
  });

  it('closes all tabs with 4401 immediately on sign-out via auth hook', async () => {
    stack = await createWsStack();
    const account = await createVerifiedAccount(stack.harness, ip);
    const tab1 = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    const tab2 = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(tab1.connected && tab2.connected).toBe(true);
    if (!tab1.connected || !tab2.connected) return;

    const signOutRes = await stack.harness.call('/sign-out', { cookie: account.cookie, ip: ip() });
    expect(signOutRes.status).toBe(200);
    expect((await tab1.closed).code).toBe(4401);
    expect((await tab2.closed).code).toBe(4401);
  });

  it('closes open tabs with 4401 immediately on password reset', async () => {
    stack = await createWsStack();
    const account = await createVerifiedAccount(stack.harness, ip);
    const tab = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(tab.connected).toBe(true);
    if (!tab.connected) return;

    const token = await newResetToken(stack.harness, account.email, ip());
    const resetRes = await resetPassword(stack.harness, token, NEW_PASSWORD, ip());
    expect(resetRes.status).toBe(200);
    expect((await tab.closed).code).toBe(4401);
  });

  it('closes open tabs with 4401 on the 3-second batch database check after direct session deletion', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    stack = await createWsStack();
    const account = await createVerifiedAccount(stack.harness, ip);
    const tab = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(tab.connected).toBe(true);
    if (!tab.connected) return;

    const rawToken = sessionToken(account.cookie);
    expect(rawToken).toBeDefined();
    await pool.query('DELETE FROM session WHERE token = $1', [rawToken]);

    await vi.advanceTimersByTimeAsync(3000);
    expect((await tab.closed).code).toBe(4401);
  });

  it('closes active sockets with 1001 on graceful shutdown', async () => {
    stack = await createWsStack();
    const account = await createVerifiedAccount(stack.harness, ip);
    const conn = await connectWs(stack.wsUrl, { origin: APP_URL, cookie: account.cookie });
    expect(conn.connected).toBe(true);
    if (!conn.connected) return;

    await stack.gateway.close();
    expect((await conn.closed).code).toBe(1001);
  });
});
