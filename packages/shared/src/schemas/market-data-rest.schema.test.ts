// Checks the REST contract in Node without I/O. Run: pnpm --filter @crypto-force/shared test.
// Expected values: docs/testing/test-scopes/TS-002-market-data/rest-verification.md.
// The draft schema is the red target. The original mock contract test remains unchanged.
import { describe, expect, it } from 'vitest';
import {
  candleHistoryInputSchema,
  candleHistorySchema,
  marketSummarySchema,
} from '@crypto-force/shared';

const candle = {
  openTime: 1735689600000,
  open: 100.125,
  high: 102.875,
  low: 99.0625,
  close: 101.375,
  volume: 12.625,
  isClosed: false,
};
const history = {
  pair: 'BTCUSDT',
  timeframe: '1m',
  candles: [candle],
  warmupCount: 0,
  dataTime: 1735689659999,
};

describe('REST query', () => {
  it.each(['1m', '5m', '15m', '1h', '4h', '1d'])('accepts timeframe %s', (timeframe) => {
    expect(candleHistoryInputSchema.safeParse({ pair: 'BTCUSDT', timeframe }).success).toBe(true);
  });
  it.each(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'])('accepts pair %s', (pair) => {
    expect(candleHistoryInputSchema.safeParse({ pair, timeframe: '5m' }).success).toBe(true);
  });
  it.each([undefined, '', ' ', 'btcusdt', 'DOGEUSDT', null, 1, ['BTCUSDT'], {}])(
    'rejects pair %j',
    (pair) => {
      expect(candleHistoryInputSchema.safeParse({ pair, timeframe: '5m' }).success).toBe(false);
    },
  );
  it.each([undefined, '', ' ', '5M', '2m', null, 5, ['5m'], {}])(
    'rejects timeframe %j',
    (timeframe) => {
      expect(candleHistoryInputSchema.safeParse({ pair: 'BTCUSDT', timeframe }).success).toBe(
        false,
      );
    },
  );
  it.each(['limit', 'startTime', 'endTime', 'extra'])('rejects extra query %s', (key) => {
    expect(
      candleHistoryInputSchema.safeParse({ pair: 'BTCUSDT', timeframe: '5m', [key]: '1' }).success,
    ).toBe(false);
  });
});

describe('REST candle snapshot', () => {
  it('preserves decimal OHLCV and snapshot metadata without an API MA series', () => {
    expect(candleHistorySchema.parse(history)).toEqual(history);
  });
  it('accepts empty history and zero volume', () => {
    expect(candleHistorySchema.safeParse(history).success).toBe(true);
    expect(candleHistorySchema.safeParse({ ...history, candles: [] }).success).toBe(true);
    expect(candleHistorySchema.safeParse(history).success).toBe(true);
    expect(
      candleHistorySchema.safeParse({ ...history, candles: [{ ...candle, volume: 0 }] }).success,
    ).toBe(true);
  });
  for (const field of ['open', 'high', 'low', 'close']) {
    it.each([0, -1, NaN, Infinity, -Infinity, '100', null, undefined])(
      `rejects invalid ${field} %j`,
      (value) => {
        expect(candleHistorySchema.safeParse(history).success).toBe(true);
        expect(
          candleHistorySchema.safeParse({ ...history, candles: [{ ...candle, [field]: value }] })
            .success,
        ).toBe(false);
      },
    );
  }
  it.each([-1, NaN, Infinity, -Infinity, '1', null, undefined])('rejects volume %j', (volume) => {
    expect(candleHistorySchema.safeParse(history).success).toBe(true);
    expect(
      candleHistorySchema.safeParse({ ...history, candles: [{ ...candle, volume }] }).success,
    ).toBe(false);
  });
  it.each([
    { high: 98 },
    { high: 100 },
    { low: 102 },
    { openTime: 1735689600001 },
    { openTime: 1735689600000.5 },
    { isClosed: undefined },
    { isClosed: 'false' },
  ])('rejects candle violation %j', (change) => {
    expect(candleHistorySchema.safeParse(history).success).toBe(true);
    expect(
      candleHistorySchema.safeParse({ ...history, candles: [{ ...candle, ...change }] }).success,
    ).toBe(false);
  });
  it.each([-1, 0.5, 1, 20, '0', null, undefined])(
    'rejects warmupCount %j for one candle',
    (warmupCount) => {
      expect(candleHistorySchema.safeParse(history).success).toBe(true);
      expect(candleHistorySchema.safeParse({ ...history, warmupCount }).success).toBe(false);
    },
  );
  it.each([undefined, null, '1735689659999', 1735689659999.5])(
    'rejects dataTime %j',
    (dataTime) => {
      expect(candleHistorySchema.safeParse(history).success).toBe(true);
      expect(candleHistorySchema.safeParse({ ...history, dataTime }).success).toBe(false);
    },
  );
  it('rejects an open candle before the last candle and duplicate times', () => {
    expect(candleHistorySchema.safeParse(history).success).toBe(true);
    expect(
      candleHistorySchema.safeParse({
        ...history,
        candles: [candle, { ...candle, openTime: 1735689660000 }],
      }).success,
    ).toBe(false);
    expect(candleHistorySchema.safeParse(history).success).toBe(true);
    expect(
      candleHistorySchema.safeParse({
        ...history,
        candles: [{ ...candle, isClosed: true }, candle],
      }).success,
    ).toBe(false);
  });
  it.each([
    ['1m', 60000],
    ['5m', 300000],
    ['15m', 900000],
    ['1h', 3600000],
    ['4h', 14400000],
    ['1d', 86400000],
  ])('checks UTC alignment for %s', (timeframe, interval) => {
    const second = { ...candle, openTime: 1735689600000 + interval };
    const payload = { ...history, timeframe, candles: [{ ...candle, isClosed: true }, second] };
    expect(candleHistorySchema.safeParse(payload).success).toBe(true);
    expect(
      candleHistorySchema.safeParse({
        ...payload,
        candles: [
          { ...candle, isClosed: true },
          { ...second, openTime: second.openTime + 1 },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('REST summary', () => {
  it.each([-1.25, 0, 2.5, 150])(
    'accepts finite percentage %s without a cap',
    (change24hPercent) => {
      expect(
        marketSummarySchema.parse({
          pair: 'BTCUSDT',
          lastPrice: 618.125,
          change24hPercent,
          dataTime: 1735689600000,
        }),
      ).toEqual({
        pair: 'BTCUSDT',
        lastPrice: 618.125,
        change24hPercent,
        dataTime: 1735689600000,
      });
    },
  );
  it.each([0, -1, NaN, Infinity, '618', null, undefined])('rejects lastPrice %j', (lastPrice) => {
    expect(
      marketSummarySchema.safeParse({
        pair: 'BTCUSDT',
        lastPrice,
        change24hPercent: -1.25,
        dataTime: 1735689600000,
      }).success,
    ).toBe(false);
  });
});
