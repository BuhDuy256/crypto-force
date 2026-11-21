import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { prepareCharts } from './prepare-charts.mjs';

// Uses real Auth, real rate limiting, a production browser, and real apply marks.
// The no-pause mutant must fail. No latency samples are retained.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const require = createRequire(new URL('../../../web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const user = JSON.parse(
  readFileSync(`${root}/node_modules/.cache/market-data-perf/credentials.json`, 'utf8'),
)[0];
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:5195',
    extraHTTPHeaders: { 'x-forwarded-for': '10.94.0.1' },
    serviceWorkers: 'block',
  });
  const login = await context.request.post('/api/auth/sign-in/email', {
    headers: { Origin: 'http://127.0.0.1:5195' },
    data: user,
  });
  assert.equal(login.status(), 200);
  let blocked = false;
  for (let index = 0; index < 101; index++) {
    const response = await context.request.get('/api/auth/get-session');
    if (response.status() === 429) {
      blocked = true;
      break;
    }
    assert.equal(response.status(), 200);
  }
  assert.equal(blocked, true);
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__marketPerf = { apply: [], authRateLimit: null };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (entry.name === 'market-data:apply') window.__marketPerf.apply.push(entry.detail);
    }).observe({ type: 'mark' });
    const nativeFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await nativeFetch(...args);
      if (response.status === 429 && response.url.includes('/api/auth/'))
        window.__marketPerf.authRateLimit = {
          status: 429,
          retryAfter: response.headers.get('x-retry-after'),
        };
      return response;
    };
  });
  await page.goto('/realtime');
  const records = [];
  await assert.doesNotReject(() => prepareCharts(page, (record) => records.push(record)));
  assert.equal(records.length, 1);
  assert.equal(records[0].status, 429);
  const frames = await page.evaluate(() =>
    window.__marketPerf.apply.map((entry) => entry.timeframe).sort(),
  );
  assert.deepEqual(frames, ['15m', '1h', '4h', '5m']);
  console.log('The Auth setup preflight passed: a real 429, one retry, and four applied charts.');
} finally {
  await browser.close();
}
