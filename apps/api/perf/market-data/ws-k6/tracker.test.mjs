import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createVuTracker, extractCookieHeader, WORKLOAD_CHANNELS } from './tracker.mjs';

describe('tracker helper', () => {
  it('extracts Secure session cookies from string and array Set-Cookie headers', () => {
    assert.equal(WORKLOAD_CHANNELS.length, 5);
    assert.equal(
      extractCookieHeader('__Secure-better-auth.session_token=abc.123; Path=/; HttpOnly; Secure'),
      '__Secure-better-auth.session_token=abc.123',
    );
    assert.equal(
      extractCookieHeader([
        '__Secure-better-auth.session_token=abc.123; Path=/; Secure',
        'other=val; Path=/',
      ]),
      '__Secure-better-auth.session_token=abc.123; other=val',
    );
    assert.equal(extractCookieHeader(undefined), null);
  });

  it('tracks steady sequences, ignores warmup seq 0, and detects duplicates, gaps, and invalid frames', () => {
    const tracker = createVuTracker(4);

    assert.equal(
      tracker.onMessage(JSON.stringify({ type: 'subscribed', channels: WORKLOAD_CHANNELS }), 1000)
        .kind,
      'subscribed',
    );

    const warmup = tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000,
          volume: 0,
          isClosed: false,
        },
        dataTime: 1000,
        sourceTime: 998,
      }),
      1005,
    );
    assert.equal(warmup.isSteady, false);

    const seq1 = tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000.01,
          volume: 1,
          isClosed: false,
        },
        dataTime: 2000,
        sourceTime: 1995,
      }),
      2012,
    );
    assert.equal(seq1.isSteady, true);
    assert.equal(seq1.backendToClientMs, 12);
    assert.equal(seq1.sourceToClientMs, 17);

    // Duplicate seq 1
    tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000.01,
          volume: 1,
          isClosed: false,
        },
        dataTime: 2020,
        sourceTime: 2015,
      }),
      2025,
    );

    // Skip seq 2, send seq 3
    tracker.onMessage(
      JSON.stringify({
        type: 'candle',
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735689600000,
          open: 50000,
          high: 50100,
          low: 49990,
          close: 50000.03,
          volume: 3,
          isClosed: false,
        },
        dataTime: 3000,
        sourceTime: 2995,
      }),
      3010,
    );

    // Summary seq 1
    const summary1 = tracker.onMessage(
      JSON.stringify({
        type: 'summary',
        summary: {
          pair: 'BTCUSDT',
          lastPrice: 60000.01,
          change24hPercent: 1.25,
          dataTime: 3000,
        },
        sourceTime: 2996,
      }),
      3008,
    );
    assert.equal(summary1.isSteady, true);
    assert.equal(summary1.seq, 1);

    // Invalid JSON and malformed candle
    assert.equal(tracker.onMessage('not-json', 3010).kind, 'invalid');
    assert.equal(
      tracker.onMessage(JSON.stringify({ type: 'candle', pair: 'BTCUSDT' }), 3011).kind,
      'invalid',
    );

    const report = tracker.snapshot(1000, '');
    assert.equal(report.vu, 4);
    assert.equal(report.subscribedAck, true);
    assert.equal(report.steadyMessages, 4);
    assert.equal(report.duplicateMessages, 1);
    assert.equal(report.invalidMessages, 2);
    assert.equal(report.channels['kline:BTCUSDT:1m'].uniqueCount, 2);
    assert.deepEqual(report.channels['kline:BTCUSDT:1m'].missingInternalSeqs, [2]);
    assert.equal(report.channels['summary:BTCUSDT'].uniqueCount, 1);
  });
});
