// Checks pure WebSocket candle merge and snapshot-buffer reconciliation in Node (no DOM/I/O).
// Run: pnpm --filter @crypto-force/web exec vitest run app/utils/market-candle-merge.test.ts.
// Expected values: docs/testing/test-scopes/TS-002-market-data/websocket-verification.md (seam S7,
// merge decision table M1-M7 and 50-event buffer overflow boundary).
// Pre-build red state: apps/web/app/utils/market-candle-merge.ts does not exist yet.
// Fault checks (gate for build step): duplicating openTime, regressing dataTime, skipping closed
// boundary detection or filling real market gaps must fail these assertions.
import type { CandleHistory } from '@crypto-force/shared';
import { describe, expect, it } from 'vitest';
import { mergeCandleEvent, reconcileSnapshotWithBuffer } from './market-candle-merge';

function historyFixture(count: number, lastClosed: boolean, dataTime: number): CandleHistory {
  return {
    pair: 'BTCUSDT',
    timeframe: '1m',
    candles: Array.from({ length: count }, (_, index) => ({
      openTime: 1735689600000 + index * 60000,
      open: 100 + index,
      high: 101 + index,
      low: 99 + index,
      close: 100 + index,
      volume: 10 + index,
      isClosed: index < count - 1 ? true : lastClosed,
    })),
    warmupCount: Math.max(0, count - 500),
    dataTime,
  };
}

describe('mergeCandleEvent decision table (M1-M7)', () => {
  it('ignores events for a different pair or timeframe and events with older dataTime (M1, M2)', () => {
    const base = historyFixture(20, false, 1735690790000);
    const original = structuredClone(base);

    expect(
      mergeCandleEvent(base, {
        pair: 'ETHUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735690740000,
          open: 200,
          high: 201,
          low: 199,
          close: 200,
          volume: 50,
          isClosed: false,
        },
        dataTime: 1735690795000,
      }),
    ).toEqual({ kind: 'ignored', history: original });

    expect(
      mergeCandleEvent(base, {
        pair: 'BTCUSDT',
        timeframe: '5m',
        candle: {
          openTime: 1735690800000,
          open: 200,
          high: 201,
          low: 199,
          close: 200,
          volume: 50,
          isClosed: false,
        },
        dataTime: 1735690795000,
      }),
    ).toEqual({ kind: 'ignored', history: original });

    expect(
      mergeCandleEvent(base, {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735690740000,
          open: 119,
          high: 125,
          low: 118,
          close: 124,
          volume: 99,
          isClosed: false,
        },
        dataTime: 1735690789999,
      }),
    ).toEqual({ kind: 'ignored', history: original });
    expect(base).toEqual(original);
  });

  it('ignores candles older than the last candle and duplicates of an already closed candle (M3, M4)', () => {
    const base = historyFixture(20, true, 1735690800000);
    const original = structuredClone(base);

    expect(
      mergeCandleEvent(base, {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735690680000,
          open: 118,
          high: 130,
          low: 117,
          close: 129,
          volume: 88,
          isClosed: true,
        },
        dataTime: 1735690805000,
      }),
    ).toEqual({ kind: 'ignored', history: original });

    expect(
      mergeCandleEvent(base, {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735690740000,
          open: 119,
          high: 140,
          low: 118,
          close: 139,
          volume: 77,
          isClosed: true,
        },
        dataTime: 1735690805000,
      }),
    ).toEqual({ kind: 'ignored', history: original });
  });

  it('updates an open candle in place and closes it without duplicating openTime (M5)', () => {
    const base = historyFixture(20, false, 1735690790000);
    const expectedCandles = [
      ...base.candles.slice(0, 19),
      {
        openTime: 1735690740000,
        open: 119,
        high: 123.5,
        low: 118.25,
        close: 122.75,
        volume: 42.5,
        isClosed: true,
      },
    ];

    expect(
      mergeCandleEvent(base, {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735690740000,
          open: 119,
          high: 123.5,
          low: 118.25,
          close: 122.75,
          volume: 42.5,
          isClosed: true,
        },
        dataTime: 1735690800100,
      }),
    ).toEqual({
      kind: 'applied',
      history: {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candles: expectedCandles,
        warmupCount: 0,
        dataTime: 1735690800100,
      },
    });
  });

  it('appends a newer candle after a closed candle, trims to 519 (500 visible + 19 warmup) and preserves real gaps (M6)', () => {
    const full = historyFixture(519, true, 1735720740000);
    const appendedCandle = {
      openTime: 1735720800000,
      open: 620,
      high: 622,
      low: 619,
      close: 621,
      volume: 530,
      isClosed: false,
    };
    // Jump by 2 intervals (120000 ms) to represent a real 1m market gap: must not synthesize a gap candle.
    const expectedCandles = [...full.candles.slice(1), appendedCandle];

    expect(
      mergeCandleEvent(full, {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: appendedCandle,
        dataTime: 1735720805000,
      }),
    ).toEqual({
      kind: 'applied',
      history: {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candles: expectedCandles,
        warmupCount: 19,
        dataTime: 1735720805000,
      },
    });
    expect(expectedCandles).toHaveLength(519);
    expect(expectedCandles[0]?.openTime).toBe(1735689660000);
    expect(expectedCandles.at(-2)?.openTime).toBe(1735720680000);
    expect(expectedCandles.some((item) => item.openTime === 1735720740000)).toBe(false);
  });

  it('requests backfill when an incoming openTime skips past an unclosed last candle (M7)', () => {
    const base = historyFixture(20, false, 1735690790000);

    expect(
      mergeCandleEvent(base, {
        pair: 'BTCUSDT',
        timeframe: '1m',
        candle: {
          openTime: 1735690800000,
          open: 120,
          high: 121,
          low: 119,
          close: 120.5,
          volume: 30,
          isClosed: false,
        },
        dataTime: 1735690801000,
      }),
    ).toMatchObject({ kind: 'resync-required' });
  });
});

describe('reconcileSnapshotWithBuffer overflow and boundary checks', () => {
  it.each([
    { bufferedCount: 49, expectedKind: 'ready' as const },
    { bufferedCount: 50, expectedKind: 'ready' as const },
    { bufferedCount: 51, expectedKind: 'resync-required' as const },
  ])(
    'treats $bufferedCount buffered events as $expectedKind around the 50-event cap',
    ({ bufferedCount, expectedKind }) => {
      const snapshot = historyFixture(20, false, 1735690790000);
      const events = Array.from({ length: bufferedCount }, (_, index) => ({
        pair: 'BTCUSDT' as const,
        timeframe: '1m' as const,
        candle: {
          openTime: 1735690740000,
          open: 119,
          high: 120 + index * 0.125,
          low: 118,
          close: 119 + index * 0.125,
          volume: 29 + index,
          isClosed: false,
        },
        dataTime: 1735690790100 + index * 10,
      }));

      if (expectedKind === 'ready') {
        const lastIndex = bufferedCount - 1;
        expect(reconcileSnapshotWithBuffer(snapshot, events)).toEqual({
          kind: 'ready',
          history: {
            pair: 'BTCUSDT',
            timeframe: '1m',
            candles: [
              ...snapshot.candles.slice(0, 19),
              {
                openTime: 1735690740000,
                open: 119,
                high: 120 + lastIndex * 0.125,
                low: 118,
                close: 119 + lastIndex * 0.125,
                volume: 29 + lastIndex,
                isClosed: false,
              },
            ],
            warmupCount: 0,
            dataTime: 1735690790100 + lastIndex * 10,
          },
        });
      } else {
        expect(reconcileSnapshotWithBuffer(snapshot, events)).toMatchObject({
          kind: 'resync-required',
        });
      }
    },
  );
});
