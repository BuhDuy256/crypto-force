// Checks the benchmark replay and byte classification with an injected source clock.
// Run node --test apps/api/perf/market-data/polling.test.mjs. No DB is required.
// Oracle: polling-config.json and the fixed replay fixture. Removing summary percent validation
// or classifying every completed request as initial must fail these tests.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pollingReplay } from './polling-replay.mjs';
import { pollingTransfers } from './polling-transfers.mjs';
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/replay.json', import.meta.url), 'utf8'),
);

test('rejects a summary with a missing or incorrect 24 hour change', () => {
  const replay = pollingReplay(fixture, { now: () => 0 });
  assert.equal(
    replay.validate(
      'summary:BTCUSDT',
      { pair: 'BTCUSDT', lastPrice: 20000, change24hPercent: -1.25 },
      200,
    ),
    true,
  );
  assert.equal(
    replay.validate('summary:BTCUSDT', { pair: 'BTCUSDT', lastPrice: 20000 }, 200),
    false,
  );
  assert.equal(
    replay.validate(
      'summary:BTCUSDT',
      { pair: 'BTCUSDT', lastPrice: 20000, change24hPercent: 0 },
      200,
    ),
    false,
  );
});

test('keeps the source timeline when the failure state changes', () => {
  let now = 0;
  const replay = pollingReplay(fixture, { now: () => now, wallNow: () => 1800000000000 });
  replay.begin(false, true);
  now = 1378;
  assert.equal(replay.read('BTCUSDT:5m').raw[518][4], '20000');
  now = 1379;
  assert.equal(replay.read('BTCUSDT:5m').raw[518][4], '20001');
  now = 8379;
  assert.equal(replay.read('BTCUSDT:5m').raw[518][4], '20002');
  replay.begin(true, false);
  assert.equal(replay.state().version, 2);
  assert.equal(
    replay.validate('BTCUSDT:5m', { error: { code: 'MARKET_DATA_UNAVAILABLE' } }, 503),
    true,
  );
});

test('counts only the first transfer of each URL as initial for each client', () => {
  const first = pollingTransfers();
  const second = pollingTransfers();
  const candles = 'http://localhost/api/market-data/candles?pair=BTCUSDT&timeframe=5m';
  first.start('a', candles);
  first.start('b', candles);
  second.start('c', candles);
  first.start('d', 'http://localhost/api/market-data/summary?pair=BTCUSDT');
  first.start('e', 'http://localhost/assets/root.js');
  assert.deepEqual(first.finish('b'), { phase: 'polling', url: candles });
  assert.deepEqual(first.finish('a'), { phase: 'initial', url: candles });
  assert.deepEqual(second.finish('c'), { phase: 'initial', url: candles });
  assert.equal(first.finish('d').phase, 'initial');
  assert.equal(first.finish('e'), undefined);
  assert.equal(first.finish('a'), undefined);
});
