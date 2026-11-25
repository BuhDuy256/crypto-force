// Checks adapter/cache substitution through the approved provider interface, with HTTP input only.
// Run API Vitest with test/market-data/provider-contract.test.ts. Global setup requires the _test DB.
// Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md cooldown/fresh-cache row. The fake returns both success and rate limits.
// Fault check: removing the adapter cooldown must fail the HTTP call count assertion.
import { expect, it, vi } from 'vitest';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider';
import { createCachedMarketDataProvider } from '../../src/providers/market-data/cached-market-data.provider';
import { capturingLogger, klines } from './fixtures';

it('serves a fresh snapshot while a different key is blocked by upstream cooldown', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(Response.json(klines(1)))
    .mockResolvedValueOnce(
      new Response('Rate limited.', { status: 429, headers: { 'Retry-After': '2' } }),
    );
  const logger = capturingLogger().logger;
  const adapter = createBinanceMarketDataProvider({
    fetch,
    now: () => 1735689659999,
    timeoutMs: 5000,
    logger,
  });
  const provider = createCachedMarketDataProvider({
    provider: adapter,
    now: () => 1735689659999,
    ttlMs: 5000,
    logger,
  });
  const request = { pair: 'BTCUSDT', timeframe: '1m', limit: 519 } as const;
  const snapshot = {
    candles: [
      {
        openTime: 1735689600000,
        open: 100,
        high: 101,
        low: 99,
        close: 100,
        volume: 10,
        isClosed: false,
      },
    ],
    dataTime: 1735689659999,
  };
  expect(await provider.getCandles(request)).toEqual(snapshot);
  await expect(provider.getCandles({ ...request, pair: 'ETHUSDT' })).rejects.toThrow();
  expect(await provider.getCandles(request)).toEqual(snapshot);
  await expect(provider.getSummary('SOLUSDT')).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(2);
});
