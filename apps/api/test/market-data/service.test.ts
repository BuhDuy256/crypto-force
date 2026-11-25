// Checks the approved service boundary in Node. The API Vitest setup requires the _test DB.
// Run: pnpm --filter @crypto-force/api exec vitest run test/market-data/service.test.ts.
// Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md, fixture/window and domain invariants. No production module mocks.
// The service output mutation fails golden and gap assertions. The fake close mutation fails the golden assertion.
// Missing diagnostics fail five regression tests.
import { expect, it, vi } from 'vitest';
import { createMarketDataService } from '../../src/services/market-data.service';
import { candles, capturingLogger } from './fixtures';
import closedCandles from './closed-candles.json';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider';

it.each([
  [0, 0],
  [1, 0],
  [19, 0],
  [20, 0],
  [21, 0],
  [499, 0],
  [500, 0],
  [501, 1],
  [518, 18],
  [519, 19],
])('keeps %i real candles with warmup %i', async (count, warmupCount) => {
  const getCandles = vi
    .fn()
    .mockResolvedValue({ candles: candles(count), dataTime: 1735720739999 });
  const provider = { getCandles, getSummary: vi.fn() };
  const service = createMarketDataService({ provider, logger: capturingLogger().logger });
  await service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' }).then((result) => {
    expect(getCandles).toHaveBeenCalledExactlyOnceWith({
      pair: 'BTCUSDT',
      timeframe: '1m',
      limit: 519,
    });
    expect(result).toMatchObject({
      pair: 'BTCUSDT',
      timeframe: '1m',
      warmupCount,
      dataTime: 1735720739999,
    });
    expect(result.candles).toHaveLength(count);
    expect(result).not.toHaveProperty('ma20');
  });
});

it('preserves different provider values and records the request context once', async () => {
  const { logger, records } = capturingLogger();
  const service = createMarketDataService({
    provider: {
      getCandles: vi.fn().mockResolvedValue({
        candles: [
          {
            openTime: 1735689600000,
            open: 218.125,
            high: 219.875,
            low: 217.0625,
            close: 218.375,
            volume: 0.625,
            isClosed: false,
          },
        ],
        dataTime: 1735689600123,
      }),
      getSummary: vi.fn().mockResolvedValue({
        pair: 'ETHUSDT',
        lastPrice: 218.375,
        change24hPercent: -2.75,
        dataTime: 1735689600123,
      }),
    },
    logger,
  });
  expect(await service.getCandleHistory({ pair: 'ETHUSDT', timeframe: '1d' })).toEqual({
    pair: 'ETHUSDT',
    timeframe: '1d',
    warmupCount: 0,
    dataTime: 1735689600123,
    candles: [
      {
        openTime: 1735689600000,
        open: 218.125,
        high: 219.875,
        low: 217.0625,
        close: 218.375,
        volume: 0.625,
        isClosed: false,
      },
    ],
  });
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    pair: 'ETHUSDT',
    timeframe: '1d',
    requestedCount: 519,
    receivedCount: 1,
    outcome: 'success',
  });
  expect(records[0]).toHaveProperty('durationMs', expect.any(Number));
  expect(records[0]).toHaveProperty('providerDurationMs', expect.any(Number));
  expect(await service.getMarketSummary('ETHUSDT')).toEqual({
    pair: 'ETHUSDT',
    lastPrice: 218.375,
    change24hPercent: -2.75,
    dataTime: 1735689600123,
  });
});

it.each([
  [
    new Response('Provider sentinel.', { status: 503 }),
    503,
    'MARKET_DATA_UNAVAILABLE',
    'unavailable',
    40,
  ],
  [new Response('{broken'), 502, 'MARKET_DATA_INVALID', 'invalid', 50],
  [
    Response.json([[1735689600000, '2', '1', '1', '2', '0', 1735689659999, '0', 0, '0', '0', '0']]),
    502,
    'MARKET_DATA_INVALID',
    'invalid',
    50,
  ],
] as const)(
  'classifies provider failures and records safe context %#',
  async (response, statusCode, code, kind, level) => {
    const { logger, records } = capturingLogger();
    const provider = createBinanceMarketDataProvider({
      fetch: vi.fn<typeof globalThis.fetch>().mockResolvedValue(response.clone()),
      now: () => 1735689659999,
      timeoutMs: 5000,
      logger,
    });
    const service = createMarketDataService({ provider, logger });
    await expect(
      service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' }),
    ).rejects.toMatchObject({ statusCode, code });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      pair: 'BTCUSDT',
      timeframe: '1m',
      kind,
      level,
      outcome: 'error',
    });
    expect(records[0]).toHaveProperty('durationMs', expect.any(Number));
    expect(records[0]).toHaveProperty('providerDurationMs', expect.any(Number));
    expect(JSON.stringify(records)).not.toContain('Provider sentinel.');
  },
);

it('keeps unexpected provider errors unchanged', async () => {
  const fault = new Error('Unexpected provider failure.');
  const service = createMarketDataService({
    provider: { getCandles: vi.fn().mockRejectedValue(fault), getSummary: vi.fn() },
    logger: capturingLogger().logger,
  });
  await expect(service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' })).rejects.toBe(fault);
});

it.each([
  { pair: 'BTCUSDT', lastPrice: 10, change24hPercent: 0 },
  { pair: 'ETHUSDT', lastPrice: 0, change24hPercent: 0 },
  { pair: 'ETHUSDT', lastPrice: 10, change24hPercent: Infinity },
])('rejects invalid summary data %j', async (summary) => {
  const service = createMarketDataService({
    provider: { getCandles: vi.fn(), getSummary: vi.fn().mockResolvedValue(summary) },
    logger: capturingLogger().logger,
  });
  await expect(service.getMarketSummary('ETHUSDT')).rejects.toMatchObject({
    statusCode: 502,
    code: 'MARKET_DATA_INVALID',
  });
});

it.each([
  [[{ ...candles(1)[0], volume: -1 }], 1735689600000],
  [[{ ...candles(1)[0], openTime: 1735689600001 }], 1735689600001],
  [[...candles(1), ...candles(1)], 1735689600000],
  [[{ ...candles(2)[0], isClosed: false }, ...candles(2).slice(1)], 1735689600000],
])('records the violation and candle time for invalid history %#', async (input, openTime) => {
  const { logger, records } = capturingLogger();
  const service = createMarketDataService({
    provider: {
      getCandles: vi.fn().mockResolvedValue({ candles: input, dataTime: 1735689659999 }),
      getSummary: vi.fn(),
    },
    logger,
  });
  await expect(
    service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' }),
  ).rejects.toMatchObject({ statusCode: 502, code: 'MARKET_DATA_INVALID' });
  expect(records).toHaveLength(1);
  expect(records[0]).toHaveProperty('violations.0.openTime', openTime);
  expect(records[0]).toHaveProperty('violations.0.rule', expect.any(String));
  expect(records[0]).toHaveProperty('violations.0.path', expect.any(String));
});

it('records the network error name and code without its message', async () => {
  const { logger, records } = capturingLogger();
  const failure = new TypeError('Network secret sentinel.', {
    cause: Object.assign(new Error('Socket secret sentinel.'), { code: 'ENOTFOUND' }),
  });
  const provider = createBinanceMarketDataProvider({
    fetch: vi.fn<typeof globalThis.fetch>().mockRejectedValue(failure),
    now: () => 1735689659999,
    timeoutMs: 5000,
    logger,
  });
  await expect(
    createMarketDataService({ provider, logger }).getMarketSummary('BTCUSDT'),
  ).rejects.toMatchObject({ statusCode: 503, code: 'MARKET_DATA_UNAVAILABLE' });
  expect(records).toHaveLength(1);
  expect(records[0]).toHaveProperty('networkError.name', 'TypeError');
  expect(records[0]).toHaveProperty('networkError.code', 'ENOTFOUND');
  expect(JSON.stringify(records)).not.toContain('secret sentinel.');
});

it('preserves every closed candle against the literal reference', async () => {
  const service = createMarketDataService({
    provider: {
      getCandles: vi.fn().mockResolvedValue({ candles: candles(), dataTime: 1735720739999 }),
      getSummary: vi.fn(),
    },
    logger: capturingLogger().logger,
  });
  await service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' }).then((result) => {
    expect(result.candles.filter((item: { isClosed: boolean }) => item.isClosed)).toEqual(
      closedCandles,
    );
  });
});

it('keeps gaps without manufacturing candles', async () => {
  const input = candles(21).filter((_, i) => i !== 10);
  const service = createMarketDataService({
    provider: {
      getCandles: vi.fn().mockResolvedValue({ candles: input, dataTime: 1735690859999 }),
      getSummary: vi.fn(),
    },
    logger: capturingLogger().logger,
  });
  await service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' }).then((result) => {
    expect(result.candles).toEqual(input);
    expect(result.candles).toHaveLength(20);
    expect(result.candles).not.toContainEqual(expect.objectContaining({ openTime: 1735690200000 }));
  });
});

it.each([{ high: 0 }, { volume: -1 }, { openTime: 1735689600001 }, { isClosed: 'false' }])(
  'rejects invalid domain data %j',
  async (change) => {
    const service = createMarketDataService({
      provider: {
        getCandles: vi.fn().mockResolvedValue({
          candles: [{ ...candles(1)[0], ...change }],
          dataTime: 1735689659999,
        }),
        getSummary: vi.fn(),
      },
      logger: capturingLogger().logger,
    });
    await expect(service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' })).rejects.toThrow();
  },
);

it('rejects 520 candles when the provider limit is 519', async () => {
  const getCandles = vi.fn().mockResolvedValue({ candles: candles(520), dataTime: 1735720799999 });
  const service = createMarketDataService({
    provider: { getCandles, getSummary: vi.fn() },
    logger: capturingLogger().logger,
  });
  await expect(service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '1m' })).rejects.toThrow();
  expect(getCandles).toHaveBeenCalledExactlyOnceWith({
    pair: 'BTCUSDT',
    timeframe: '1m',
    limit: 519,
  });
});
