import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { pino } from 'pino';
import { wsServerMessageSchema } from '@crypto-force/shared';
import { createBinanceStreamProvider } from '../../src/providers/market-data/binance-stream.provider.ts';

// 90-second live smoke against Binance Spot WebSocket Streams (W8).
// Single client, BTCUSDT@kline_1m + BTCUSDT@ticker, crosses at least one 1m candle close (isClosed: true).
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const outDir = resolve(root, 'docs/testing/evidence/market-data/ws-v1-binance-smoke');
mkdirSync(outDir, { recursive: true });

const startedUtc = new Date().toISOString();
const candleEvents = [];
const summaryEvents = [];
const statusEvents = [];
const logs = [];

const logger = pino(
  { level: 'info' },
  {
    write(chunk) {
      try {
        logs.push(JSON.parse(chunk.toString()));
      } catch {
        // ignore
      }
    },
  },
);

const provider = createBinanceStreamProvider({
  wsUrl: 'wss://stream.binance.com:9443/stream',
  now: Date.now,
  logger,
});

provider.onCandle((event) => {
  const validated = wsServerMessageSchema.safeParse({
    type: 'candle',
    ...event,
  });
  candleEvents.push({
    receivedUtc: new Date().toISOString(),
    valid: validated.success,
    event,
  });
});

provider.onSummary((event) => {
  const validated = wsServerMessageSchema.safeParse({
    type: 'summary',
    ...event,
  });
  summaryEvents.push({
    receivedUtc: new Date().toISOString(),
    valid: validated.success,
    event,
  });
});

provider.onStatus((status) => {
  statusEvents.push({
    receivedUtc: new Date().toISOString(),
    status,
  });
});

provider.subscribe({ kind: 'kline', pair: 'BTCUSDT', timeframe: '1m' });
provider.subscribe({ kind: 'summary', pair: 'BTCUSDT' });

await delay(90_000);
await provider.close();

const closedCandles = candleEvents.filter((item) => item.event.candle.isClosed);
const invalidCandles = candleEvents.filter((item) => !item.valid);
const invalidSummaries = summaryEvents.filter((item) => !item.valid);

const manifest = {
  startedUtc,
  completedUtc: new Date().toISOString(),
  source: 'wss://stream.binance.com:9443/stream',
  durationMs: 90_000,
  channels: ['btcusdt@kline_1m', 'btcusdt@ticker'],
  parameterRef: 'W8 (docs/testing/test-scopes/TS-002-market-data/websocket-verification.md)',
};

const reconciliation = {
  totalCandleFrames: candleEvents.length,
  closedCandleFrames: closedCandles.length,
  crossedAtLeastOneClosedCandle: closedCandles.length >= 1,
  invalidCandleFrames: invalidCandles.length,
  totalSummaryFrames: summaryEvents.length,
  invalidSummaryFrames: invalidSummaries.length,
  statusEvents,
  sampleClosedCandle: closedCandles[0]?.event ?? null,
  sampleOpenCandle: candleEvents[0]?.event ?? null,
  sampleSummary: summaryEvents[0]?.event ?? null,
  valid:
    candleEvents.length > 0 &&
    summaryEvents.length > 0 &&
    closedCandles.length >= 1 &&
    invalidCandles.length === 0 &&
    invalidSummaries.length === 0,
};

writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
writeFileSync(
  resolve(outDir, 'events.json'),
  JSON.stringify(
    {
      candleSampleCount: candleEvents.length,
      summarySampleCount: summaryEvents.length,
      closedCandles,
      firstTenCandles: candleEvents.slice(0, 10),
      lastTenCandles: candleEvents.slice(-10),
      firstFiveSummaries: summaryEvents.slice(0, 5),
      logs,
    },
    null,
    2,
  ),
  'utf8',
);
writeFileSync(
  resolve(outDir, 'reconciliation.json'),
  JSON.stringify(reconciliation, null, 2),
  'utf8',
);
console.log(JSON.stringify(reconciliation));
