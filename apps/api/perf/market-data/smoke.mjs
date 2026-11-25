import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pino } from 'pino';
import { createBinanceMarketDataProvider } from '../../src/providers/market-data/binance.provider.ts';
import { createMarketDataService } from '../../src/services/market-data.service.ts';

// One request per endpoint. No retries or automatic reruns.
const directory = resolve(
  fileURLToPath(new URL('../../../../', import.meta.url)),
  'docs/testing/evidence/market-data/rest-v1-binance-smoke',
);
mkdirSync(directory, { recursive: false });
const records = [];
const provider = createBinanceMarketDataProvider({
  logger: pino({ level: 'silent' }),
  now: Date.now,
  timeoutMs: 5000,
  fetch: async (input, init) => {
    const url = new URL(String(input));
    if (
      url.origin !== 'https://api.binance.com' ||
      !['/api/v3/klines', '/api/v3/ticker/24hr'].includes(url.pathname) ||
      records.some((record) => record.endpoint === url.pathname)
    )
      throw new Error('The smoke request is outside the approved scope.');
    const record = {
      endpoint: url.pathname,
      query: Object.fromEntries(url.searchParams),
      startedUtc: new Date().toISOString(),
      start: performance.now(),
    };
    records.push(record);
    const response = await fetch(input, init);
    record.receivedUtc = new Date().toISOString();
    record.receivedAt = Date.now();
    record.status = response.status;
    record.headers = Object.fromEntries(
      [...response.headers].filter(([name]) =>
        /^(x-mbx-|retry-after$|date$|content-type$)/i.test(name),
      ),
    );
    record.bodyRead = response
      .clone()
      .json()
      .then((body) => {
        record.raw = body;
        record.durationMs = performance.now() - record.start;
      })
      .catch(() => {
        record.bodyError = 'The source body is not JSON.';
      });
    return response;
  },
});
const service = createMarketDataService({ provider, logger: pino({ level: 'silent' }) });
const results = {};
for (const endpoint of ['candles', 'summary']) {
  try {
    const actual =
      endpoint === 'candles'
        ? await service.getCandleHistory({ pair: 'BTCUSDT', timeframe: '5m' })
        : await service.getMarketSummary('BTCUSDT');
    const source = records.at(-1);
    await source.bodyRead;
    const expected =
      endpoint === 'candles'
        ? source.raw
            .filter((row) => row[6] < actual.dataTime)
            .map((row) => ({
              openTime: row[0],
              open: Number(row[1]),
              high: Number(row[2]),
              low: Number(row[3]),
              close: Number(row[4]),
              volume: Number(row[5]),
              isClosed: true,
            }))
        : {
            pair: 'BTCUSDT',
            lastPrice: Number(source.raw.lastPrice),
            change24hPercent: Number(source.raw.priceChangePercent),
          };
    const checked = endpoint === 'candles' ? actual.candles.filter((row) => row.isClosed) : actual;
    results[endpoint] = {
      valid: JSON.stringify(checked) === JSON.stringify(expected),
      closedCount: endpoint === 'candles' ? checked.length : undefined,
      actual,
      quotaHeaderPresent: source.headers['x-mbx-used-weight-1m'] !== undefined,
    };
  } catch (error) {
    results[endpoint] = {
      valid: false,
      error: error instanceof Error ? error.name : 'UnknownError',
      code: error?.code ?? null,
    };
  }
}
writeFileSync(
  resolve(directory, 'manifest.json'),
  JSON.stringify(
    {
      startedUtc: records[0]?.startedUtc,
      source: 'Binance live',
      client: 1,
      requests: records.length,
      repeats: 1,
      sourceDocumentation:
        'https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints',
      quotaMeaning: 'The observed header covers the IP. Process call count is not IP weight.',
      thresholds: null,
    },
    null,
    2,
  ),
);
writeFileSync(resolve(directory, 'upstream.json'), JSON.stringify(records, null, 2));
writeFileSync(resolve(directory, 'reconciliation.json'), JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(results).map(([key, value]) => [
        key,
        {
          valid: value.valid,
          closedCount: value.closedCount,
          quotaHeaderPresent: value.quotaHeaderPresent,
          error: value.error,
        },
      ]),
    ),
  ),
);
