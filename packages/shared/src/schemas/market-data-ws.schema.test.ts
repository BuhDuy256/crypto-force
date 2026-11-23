// Checks approved WebSocket message schemas, MarketSummary dataTime and new API env fields through
// package public exports. No I/O or doubles. Run: pnpm --filter @crypto-force/shared test.
// Expected values come from docs/architecture/22-api-endpoints.md and
// docs/testing/test-scopes/TS-002-market-data/websocket-verification.md.
// Pre-build red state: MarketSummary currently omits dataTime, apiEnvSchema omits WS/pool env
// variables, and wsClientMessageSchema/wsServerMessageSchema are not exported yet.
// Fault checks (gate for build step): omitting dataTime rejection, allowing extra WS keys or
// accepting off-interval openTime must fail these assertions.
import * as shared from '@crypto-force/shared';
import { describe, expect, it } from 'vitest';

const baseEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/crypto_force',
  API_PORT: '3000',
  BETTER_AUTH_SECRET: 'secret-value-that-is-at-least-32-characters',
  BETTER_AUTH_URL: 'http://localhost:5173',
};

const validOpenCandle = {
  openTime: 1735689600000,
  open: 100.125,
  high: 102.875,
  low: 99.0625,
  close: 101.375,
  volume: 12.625,
  isClosed: false,
};

describe('MarketSummary dataTime contract', () => {
  it('accepts a summary with an integer UTC epoch dataTime', () => {
    expect(
      shared.marketSummarySchema.safeParse({
        pair: 'BTCUSDT',
        lastPrice: 618.125,
        change24hPercent: -1.25,
        dataTime: 1735689659999,
      }),
    ).toEqual({
      success: true,
      data: {
        pair: 'BTCUSDT',
        lastPrice: 618.125,
        change24hPercent: -1.25,
        dataTime: 1735689659999,
      },
    });
  });

  it.each([
    { pair: 'BTCUSDT', lastPrice: 618.125, change24hPercent: -1.25 },
    { pair: 'BTCUSDT', lastPrice: 618.125, change24hPercent: -1.25, dataTime: -1 },
    { pair: 'BTCUSDT', lastPrice: 618.125, change24hPercent: -1.25, dataTime: 1735689659.5 },
    { pair: 'BTCUSDT', lastPrice: 618.125, change24hPercent: -1.25, dataTime: '1735689659999' },
  ])('rejects invalid MarketSummary dataTime %j', (input) => {
    expect(shared.marketSummarySchema.safeParse(input).success).toBe(false);
  });
});

describe('API WebSocket and database pool environment contract', () => {
  it('applies approved defaults for DATABASE_POOL_MAX, WS_MAX_CONNECTIONS_PER_USER and BINANCE_WS_URL', () => {
    expect(shared.apiEnvSchema.safeParse(baseEnv)).toMatchObject({
      success: true,
      data: {
        DATABASE_POOL_MAX: 20,
        WS_MAX_CONNECTIONS_PER_USER: 4,
        BINANCE_WS_URL: 'wss://stream.binance.com:9443/stream',
      },
    });
  });

  it('accepts custom valid pool size, connection limit and loopback ws replay URL', () => {
    expect(
      shared.apiEnvSchema.safeParse({
        ...baseEnv,
        DATABASE_POOL_MAX: '32',
        WS_MAX_CONNECTIONS_PER_USER: '6',
        BINANCE_WS_URL: 'ws://127.0.0.1:3019/stream',
      }),
    ).toMatchObject({
      success: true,
      data: {
        DATABASE_POOL_MAX: 32,
        WS_MAX_CONNECTIONS_PER_USER: 6,
        BINANCE_WS_URL: 'ws://127.0.0.1:3019/stream',
      },
    });
  });

  it.each([
    { DATABASE_POOL_MAX: '0' },
    { DATABASE_POOL_MAX: '-5' },
    { DATABASE_POOL_MAX: '2.5' },
    { WS_MAX_CONNECTIONS_PER_USER: '0' },
    { WS_MAX_CONNECTIONS_PER_USER: '-1' },
    { BINANCE_WS_URL: 'http://127.0.0.1:3019/stream' },
    { BINANCE_WS_URL: 'not-a-url' },
  ])('rejects invalid WebSocket or pool env override %j', (override) => {
    expect(shared.apiEnvSchema.safeParse({ ...baseEnv, ...override }).success).toBe(false);
  });
});

describe('WebSocket client message contract', () => {
  const clientSchema = () =>
    (shared as Record<string, unknown>).wsClientMessageSchema as {
      safeParse: (value: unknown) => { success: boolean; data?: unknown };
    };

  it.each([
    {
      type: 'subscribe',
      channels: [
        { kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' },
        { kind: 'summary', pair: 'BTCUSDT' },
      ],
    },
    {
      type: 'unsubscribe',
      channels: [{ kind: 'kline', pair: 'ETHUSDT', timeframe: '1d' }],
    },
  ])('accepts valid client frame %j', (frame) => {
    expect(clientSchema().safeParse(frame).success).toBe(true);
  });

  it.each([
    { type: 'subscribe', channels: [] },
    { type: 'subscribe', channels: [{ kind: 'kline', pair: 'XRPUSDT', timeframe: '5m' }] },
    { type: 'subscribe', channels: [{ kind: 'kline', pair: 'BTCUSDT', timeframe: '2h' }] },
    {
      type: 'subscribe',
      channels: [{ kind: 'summary', pair: 'BTCUSDT', timeframe: '5m' }],
    },
    {
      type: 'subscribe',
      channels: [{ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }],
      extra: true,
    },
    { type: 'ping' },
  ])('rejects invalid client frame %j', (frame) => {
    expect(clientSchema().safeParse(frame).success).toBe(false);
  });
});

describe('WebSocket server message contract', () => {
  const serverSchema = () =>
    (shared as Record<string, unknown>).wsServerMessageSchema as {
      safeParse: (value: unknown) => { success: boolean; data?: unknown };
    };

  it.each([
    {
      type: 'subscribed',
      channels: [{ kind: 'kline', pair: 'BTCUSDT', timeframe: '5m' }],
    },
    {
      type: 'unsubscribed',
      channels: [{ kind: 'summary', pair: 'SOLUSDT' }],
    },
    {
      type: 'candle',
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: validOpenCandle,
      dataTime: 1735689600500,
      sourceTime: 1735689600450,
    },
    {
      type: 'summary',
      summary: {
        pair: 'BTCUSDT',
        lastPrice: 618.125,
        change24hPercent: -1.25,
        dataTime: 1735689600500,
      },
      sourceTime: 1735689600450,
    },
    { type: 'heartbeat', serverTime: 1735689605000 },
    {
      type: 'status',
      upstream: 'unavailable',
      resyncRequired: false,
      serverTime: 1735689610000,
    },
    {
      type: 'status',
      upstream: 'available',
      resyncRequired: true,
      serverTime: 1735689620000,
    },
    { type: 'error', code: 'INVALID_MESSAGE', message: 'The message is invalid.' },
    {
      type: 'error',
      code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
      message: 'The subscription limit was exceeded.',
    },
    { type: 'error', code: 'RATE_LIMITED', message: 'Too many messages were sent.' },
    {
      type: 'error',
      code: 'CONNECTION_LIMIT_EXCEEDED',
      message: 'Too many live tabs are open for this account.',
    },
  ])('accepts valid server frame %j', (frame) => {
    expect(serverSchema().safeParse(frame).success).toBe(true);
  });

  it.each([
    {
      type: 'candle',
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: { ...validOpenCandle, openTime: 1735689600001 },
      dataTime: 1735689600500,
    },
    {
      type: 'candle',
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: { ...validOpenCandle, high: 98, low: 99 },
      dataTime: 1735689600500,
    },
    {
      type: 'candle',
      pair: 'BTCUSDT',
      timeframe: '5m',
      candle: { ...validOpenCandle, volume: -1 },
      dataTime: 1735689600500,
    },
    {
      type: 'summary',
      summary: { pair: 'BTCUSDT', lastPrice: 0, change24hPercent: 0, dataTime: 1735689600500 },
    },
    {
      type: 'summary',
      summary: { pair: 'BTCUSDT', lastPrice: 618.125, change24hPercent: 0 },
    },
    { type: 'error', code: 'UNKNOWN_CODE', message: 'Error.' },
  ])('rejects invalid server frame %j', (frame) => {
    expect(serverSchema().safeParse(frame).success).toBe(false);
  });
});
