import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

// Checks apply instrumentation in a production browser. It does not retain latency samples.
// The replay OHLCV fault and the product MA-from-high mutant must make this check fail.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const require = createRequire(new URL('../../../web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const user = JSON.parse(
  readFileSync(`${root}/node_modules/.cache/market-data-perf/credentials.json`, 'utf8'),
)[0];
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/replay.json', import.meta.url), 'utf8'),
);
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:5195',
    serviceWorkers: 'block',
  });
  const login = await context.request.post('/api/auth/sign-in/email', {
    headers: { Origin: 'http://127.0.0.1:5195', 'x-forwarded-for': '10.89.0.1' },
    data: user,
  });
  assert.equal(login.status(), 200);
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.applied = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (entry.name === 'market-data:apply') window.applied.push(entry.detail);
    }).observe({ type: 'mark' });
  });
  await page.goto('/realtime');
  await page.waitForFunction(() => window.applied.length === 4);
  const applied = await page.evaluate(() => window.applied);
  for (const series of applied) {
    assert.equal(series.pair, 'BTCUSDT');
    const expected = fixture.keys[`BTCUSDT:${series.timeframe}`];
    assert.deepEqual(
      series.candles,
      expected.candles.slice(19).map(({ openTime, open, high, low, close }) => ({
        time: openTime / 1000,
        open,
        high,
        low,
        close,
      })),
    );
    assert.deepEqual(
      series.volume,
      expected.candles
        .slice(19)
        .map(({ openTime, volume }) => ({ time: openTime / 1000, value: volume })),
    );
    assert.deepEqual(series.ma20, expected.ma20);
  }
  if (process.argv.includes('--single-flight')) {
    await delay(6000);
    const before = await (await fetch('http://127.0.0.1:3025/state')).json();
    await fetch('http://127.0.0.1:3025/barrier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waiters: 9 }),
    });
    try {
      const responses = await Promise.all(
        Array.from({ length: 10 }, () =>
          context.request.get('/api/market-data/candles?pair=BTCUSDT&timeframe=5m'),
        ),
      );
      for (const response of responses) assert.equal(response.status(), 200);
      const snapshots = await Promise.all(responses.map((response) => response.json()));
      assert.equal(new Set(snapshots.map((snapshot) => JSON.stringify(snapshot))).size, 1);
      const after = await (await fetch('http://127.0.0.1:3025/state')).json();
      assert.equal(after.upstream.length - before.upstream.length, 1);
      assert.equal(
        after.cacheEvents
          .slice(before.cacheEvents.length)
          .filter((event) => event.cacheState === 'join').length,
        9,
      );
    } finally {
      await fetch('http://127.0.0.1:3025/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
    }
  }
  console.log('The browser preflight passed. No latency samples were retained.');
} finally {
  await browser.close();
}
