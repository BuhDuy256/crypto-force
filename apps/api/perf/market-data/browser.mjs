import { createRequire } from 'node:module';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { percentiles } from './aggregate.mjs';

const require = createRequire(new URL('../../../web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
export async function browserRun(directory, manifest, credentials) {
  const oracle = JSON.parse(
    readFileSync(new URL('./fixtures/replay.json', import.meta.url), 'utf8'),
  );
  const browser = await chromium.launch();
  const auth = await browser.newContext({ baseURL: manifest.origin });
  const login = await auth.request.post('/api/auth/sign-in/email', {
    headers: { 'x-forwarded-for': '10.82.0.1', Origin: manifest.origin },
    data: credentials[0],
  });
  if (login.status() !== 200) throw new Error('The browser benchmark sign-in failed.');
  const storageState = await auth.storageState();
  await auth.close();
  writeFileSync(
    resolve(directory, 'browser.json'),
    JSON.stringify(
      {
        version: browser.version(),
        headless: true,
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
        draw: 'Inconclusive. No public chart callback confirms completion of this selection paint.',
      },
      null,
      2,
    ),
  );
  const samples = [];
  let previousEnd = 0;
  try {
    for (let index = -5; index < manifest.actions; index++) {
      if (manifest.action === 'open')
        await delay(Math.max(0, 6000 - (performance.now() - previousEnd)));
      const context = await browser.newContext({
        baseURL: manifest.origin,
        storageState,
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: manifest.assetCache === 'cold' });
      await page.addInitScript(() => {
        window.__marketPerf = { apply: [], bodies: [] };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'market-data:apply')
              window.__marketPerf.apply.push({ time: entry.startTime, ...entry.detail });
          }
        }).observe({ type: 'mark', buffered: true });
        const nativeFetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await nativeFetch(...args);
          const original = response.json.bind(response);
          response.json = async () => {
            const body = await original();
            if (response.url.includes('/api/market-data/'))
              window.__marketPerf.bodies.push({
                time: performance.now(),
                url: response.url,
                status: response.status,
                body,
              });
            return body;
          };
          return response;
        };
      });
      if (manifest.assetCache === 'hot') {
        await page.goto('/');
        await page.goto('/realtime');
        await page.waitForFunction(() => window.__marketPerf.apply.length === 4);
      }
      let selection;
      let start;
      if (manifest.action !== 'open') {
        await page.goto('/realtime');
        await page.waitForFunction(() => window.__marketPerf.apply.length === 4);
        const step = (index + 5) % 6;
        if (manifest.action === 'timeframe' && step % 2 === 1) {
          await page.getByRole('combobox', { name: 'Timeframe for chart 1', exact: true }).click();
          await page.getByRole('option', { name: '1m', exact: true }).click();
          await page.waitForFunction(() =>
            window.__marketPerf.apply.some((entry) => entry.timeframe === '1m'),
          );
        }
        if (manifest.action === 'pair' && step % 3 !== 0) {
          await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
          await page
            .getByRole('option', { name: step % 3 === 1 ? 'ETHUSDT' : 'SOLUSDT', exact: true })
            .click();
          await page.waitForFunction(
            (pair) => window.__marketPerf.apply.filter((entry) => entry.pair === pair).length === 4,
            step % 3 === 1 ? 'ETHUSDT' : 'SOLUSDT',
          );
        }
        // Each sample has a new QueryClient. The selected target has never been requested.
        await delay(6000);
        await page.evaluate(() => {
          window.__marketPerf.apply = [];
          window.__marketPerf.bodies = [];
        });
        if (manifest.action === 'timeframe') {
          selection = { pair: 'BTCUSDT', timeframe: step % 2 === 0 ? '1m' : '5m' };
          await page.evaluate((timeframe) => {
            const element = document.querySelector('h1');
            let fiber =
              element[Object.keys(element).find((key) => key.startsWith('__reactFiber$'))];
            while (fiber) {
              const client = fiber.memoizedProps?.client;
              if (
                typeof client?.removeQueries === 'function' &&
                typeof client?.getQueryCache === 'function'
              ) {
                client.removeQueries({
                  queryKey: ['market-data', 'candles', 'BTCUSDT', timeframe],
                  exact: true,
                  type: 'inactive',
                });
                return;
              }
              fiber = fiber.return;
            }
            throw new Error('The benchmark cannot locate the QueryClient.');
          }, selection.timeframe);
          await page.getByRole('combobox', { name: 'Timeframe for chart 1', exact: true }).click();
          start = await page.evaluate(() => performance.now());
          await page.getByRole('option', { name: selection.timeframe, exact: true }).click();
        } else {
          selection = { pair: ['ETHUSDT', 'SOLUSDT', 'BTCUSDT'][step % 3] };
          if (selection.pair === 'BTCUSDT')
            await page.evaluate(() => {
              const element = document.querySelector('h1');
              let fiber =
                element[Object.keys(element).find((key) => key.startsWith('__reactFiber$'))];
              while (fiber) {
                const client = fiber.memoizedProps?.client;
                if (
                  typeof client?.removeQueries === 'function' &&
                  typeof client?.getQueryCache === 'function'
                ) {
                  client.removeQueries({
                    queryKey: ['market-data', 'candles', 'BTCUSDT'],
                    type: 'inactive',
                  });
                  client.removeQueries({
                    queryKey: ['market-data', 'summary', 'BTCUSDT'],
                    type: 'inactive',
                  });
                  return;
                }
                fiber = fiber.return;
              }
              throw new Error('The benchmark cannot locate the QueryClient.');
            });
          await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
          start = await page.evaluate(() => performance.now());
          await page.getByRole('option', { name: selection.pair, exact: true }).click();
        }
      } else {
        selection = { pair: 'BTCUSDT' };
        await page.goto('/realtime');
        // NavigationStart is in the new document clock and precedes all route work.
        start = 0;
      }
      let error;
      try {
        await page.waitForFunction(
          (count) => window.__marketPerf.apply.length === count,
          manifest.action === 'timeframe' ? 1 : 4,
          { timeout: 15000 },
        );
      } catch {
        error = 'apply-timeout';
      }
      const data = await page.evaluate(() => ({
        ...window.__marketPerf,
        resources: performance
          .getEntriesByType('resource')
          .filter((entry) => entry.name.includes('/api/market-data/'))
          .map((entry) => ({ url: entry.name, body: entry.responseEnd, duration: entry.duration })),
        end: performance.now(),
        worker: Boolean(navigator.serviceWorker.controller),
      }));
      let valid = !error && !data.worker;
      const differences = [];
      for (const applied of data.apply) {
        const key = `${applied.pair}:${applied.timeframe}`;
        const expected = oracle.keys[key];
        const expectedCandles = expected?.candles
          .slice(19)
          .map(({ openTime, open, high, low, close }) => ({
            time: openTime / 1000,
            open,
            high,
            low,
            close,
          }));
        const expectedVolume = expected?.candles
          .slice(19)
          .map(({ openTime, volume }) => ({ time: openTime / 1000, value: volume }));
        const match =
          applied.pair === selection.pair &&
          (!selection.timeframe || applied.timeframe === selection.timeframe) &&
          JSON.stringify(applied.candles) === JSON.stringify(expectedCandles) &&
          JSON.stringify(applied.volume) === JSON.stringify(expectedVolume) &&
          JSON.stringify(applied.ma20) === JSON.stringify(expected?.ma20);
        if (!match) {
          valid = false;
          differences.push(key);
        }
      }
      for (const body of data.bodies) {
        const url = new URL(body.url);
        const key = url.pathname.endsWith('/candles')
          ? `${url.searchParams.get('pair')}:${url.searchParams.get('timeframe')}`
          : `summary:${url.searchParams.get('pair')}`;
        const expected = oracle.keys[key];
        if (
          body.status !== 200 ||
          (key.startsWith('summary:')
            ? JSON.stringify(body.body) !== JSON.stringify(expected?.expected)
            : JSON.stringify(body.body.candles) !== JSON.stringify(expected?.candles))
        ) {
          valid = false;
          differences.push(`body:${key}`);
        }
      }
      const sample = {
        id: index,
        warmup: index < 0,
        selection,
        start,
        end: data.end,
        apply: data.apply.map(({ time, pair, timeframe }) => ({ time, pair, timeframe })),
        body: data.bodies.map(({ time, url, status }) => ({ time, url, status })),
        httpBody: data.resources,
        firstApplyMs: Math.min(...data.apply.map((entry) => entry.time)) - start,
        allApplyMs: Math.max(...data.apply.map((entry) => entry.time)) - start,
        drawMs: null,
        drawOutcome: 'Inconclusive',
        valid,
        error,
        differences,
      };
      samples.push(sample);
      appendFileSync(resolve(directory, 'samples.jsonl'), `${JSON.stringify(sample)}\n`);
      if (!valid) appendFileSync(resolve(directory, 'errors.jsonl'), `${JSON.stringify(sample)}\n`);
      if (index === 0)
        await page.screenshot({ path: resolve(directory, 'chart.png'), fullPage: true });
      previousEnd = performance.now();
      await context.close();
      console.log(JSON.stringify({ run: manifest.run, action: index, valid }));
    }
  } finally {
    await browser.close();
  }
  const measured = samples.filter((sample) => !sample.warmup);
  const summary = {
    run: manifest.run,
    count: measured.length,
    errors: measured.filter((sample) => !sample.valid).length,
    firstApplyMs: percentiles(
      measured.filter((sample) => sample.valid).map((sample) => sample.firstApplyMs),
    ),
    allApplyMs: percentiles(
      measured.filter((sample) => sample.valid).map((sample) => sample.allApplyMs),
    ),
    display: 'Inconclusive. Apply does not prove canvas paint.',
    qa10: 'Inconclusive',
    qa11: 'Inconclusive',
  };
  writeFileSync(resolve(directory, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(
    resolve(directory, 'reconciliation.json'),
    JSON.stringify(
      { total: measured.length, invalid: summary.errors, perSample: 'samples.jsonl' },
      null,
      2,
    ),
  );
  return summary;
}
