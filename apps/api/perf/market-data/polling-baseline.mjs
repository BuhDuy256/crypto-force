import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpus, freemem, platform, release, totalmem } from 'node:os';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { gzipSync } from 'node:zlib';
import { percentiles } from './aggregate.mjs';
import { pollingTransfers } from './polling-transfers.mjs';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const require = createRequire(new URL('../../../web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const origin = 'http://127.0.0.1:5195';
const control = 'http://127.0.0.1:3025';
const config = JSON.parse(readFileSync(new URL('./polling-config.json', import.meta.url), 'utf8'));
const credentials = JSON.parse(
  readFileSync(resolve(root, 'node_modules/.cache/market-data-perf/credentials.json'), 'utf8'),
);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const buildDirectory = resolve(root, 'apps/web/build/client');
const buildHash = hash(
  readdirSync(buildDirectory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const file = resolve(entry.parentPath, entry.name);
      return `${file.slice(buildDirectory.length)}:${hash(readFileSync(file))}`;
    })
    .sort()
    .join('\n'),
);
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
async function request(path, body) {
  const response = await fetch(
    `${control}${path}`,
    body === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) throw new Error('The polling control request failed.');
  return response.json();
}
const sessions = [];
const browser = await chromium.launch();
try {
  for (let index = 0; index < 50; index++) {
    const context = await browser.newContext({ baseURL: origin });
    const login = await context.request.post('/api/auth/sign-in/email', {
      headers: { Origin: origin, 'x-forwarded-for': `10.88.0.${index + 1}` },
      data: credentials[index] ?? credentials[0],
    });
    if (login.status() !== 200) throw new Error('The polling account sign-in failed.');
    sessions.push(await context.storageState());
    await context.close();
  }
  const selected = process.argv.includes('--smoke')
    ? [{ clients: 1, failure: false, repeat: 0 }]
    : config.clients.flatMap((clients) =>
        config.failures.flatMap((failure) =>
          config.repeats.map((repeat) => ({ clients, failure, repeat })),
        ),
      );
  for (const cohort of selected) {
    const prefix = process.argv.includes('--smoke') ? 'polling-preflight-v4' : 'polling-v2';
    const run = `${prefix}-${cohort.failure ? 'error' : 'success'}-${cohort.clients}-r${cohort.repeat}`;
    const directory = resolve(root, 'docs/testing/evidence/market-data', run);
    if (existsSync(resolve(directory, 'summary.json'))) continue;
    if (existsSync(directory))
      throw new Error('The polling evidence directory already exists without a summary.');
    mkdirSync(directory, { recursive: true });
    const manifest = {
      ...config,
      ...cohort,
      run,
      commit: git('rev-parse', 'HEAD'),
      dirtyFiles: git('status', '--short'),
      dirtyDiffHash: hash(git('diff', 'HEAD')),
      node: process.version,
      browser: browser.version(),
      os: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model,
      logicalCores: cpus().length,
      ram: totalmem(),
      freeRam: freemem(),
      environment: await request('/environment'),
      sourceHash: hash(readFileSync(new URL('./polling-replay.mjs', import.meta.url))),
      configHash: hash(JSON.stringify(config)),
      buildHash,
      lockfileHash: hash(readFileSync(resolve(root, 'pnpm-lock.yaml'))),
      startedUtc: new Date().toISOString(),
    };
    writeFileSync(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
    await request('/polling', { failure: false, resetCache: true });
    await request('/begin', { run });
    const contexts = [];
    const pages = [];
    const events = [];
    const bytes = [];
    const errors = [];
    const clock = [];
    try {
      for (let index = 0; index < cohort.clients; index++) {
        const context = await browser.newContext({
          baseURL: origin,
          storageState: sessions[index],
          viewport: { width: 1440, height: 1000 },
          serviceWorkers: 'block',
        });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        const transfers = pollingTransfers();
        cdp.on('Network.requestWillBeSent', (event) => {
          transfers.start(event.requestId, event.request.url);
        });
        cdp.on('Network.loadingFinished', (event) => {
          const request = transfers.finish(event.requestId);
          if (request)
            bytes.push({
              ...request,
              client: index,
              at: performance.now(),
              timestamp: event.timestamp,
              encodedDataLength: event.encodedDataLength,
            });
        });
        cdp.on('Network.loadingFailed', (event) => {
          if (transfers.finish(event.requestId))
            errors.push({ client: index, at: performance.now(), error: event.errorText });
        });
        page.on('console', (message) => {
          if (message.text().startsWith('polling-sample:'))
            events.push({
              client: index,
              receivedAt: performance.now(),
              ...JSON.parse(message.text().slice(15)),
            });
        });
        page.on('pageerror', (error) =>
          errors.push({ client: index, at: performance.now(), error: error.message }),
        );
        await page.addInitScript(() => {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name !== 'market-data:apply') continue;
              const data = entry.detail;
              console.debug(
                'polling-sample:' +
                  JSON.stringify({
                    at: entry.startTime,
                    timeOrigin: performance.timeOrigin,
                    pair: data.pair,
                    timeframe: data.timeframe,
                    count: data.candles.length,
                    first: data.candles[0],
                    last: data.candles.at(-1),
                    volume: data.volume.at(-1),
                    ma20: data.ma20.at(-1),
                    hidden: globalThis.document.hidden,
                  }),
              );
            }
          }).observe({ type: 'mark', buffered: true });
        });
        contexts.push(context);
        pages.push(page);
        await page.goto('/realtime');
      }
      for (const page of pages)
        await page.getByLabel('Chart 4 values', { exact: true }).waitFor({ timeout: 30000 });
      console.log(JSON.stringify({ run, stage: 'warmup', clients: cohort.clients }));
      await delay(config.warmupMs);
      for (const [index, page] of pages.entries()) {
        const before = performance.now();
        const browserNow = await page.evaluate(() => ({
          now: performance.now(),
          hidden: globalThis.document.hidden,
        }));
        clock.push({ client: index, before, after: performance.now(), browserNow });
      }
      const source = await request('/polling', { failure: cohort.failure });
      const start = performance.now();
      const sourceStart = source.now;
      const duration = cohort.repeat === 0 ? 15000 : config.durationMs;
      const deadline = start + duration;
      writeFileSync(
        resolve(directory, 'window.json'),
        JSON.stringify(
          {
            runnerStart: start,
            runnerEnd: deadline,
            runnerTimeOrigin: performance.timeOrigin,
            sourceStart,
            sourceEnd: sourceStart + duration,
            source,
          },
          null,
          2,
        ),
      );
      while (performance.now() < deadline) {
        await delay(Math.min(10000, deadline - performance.now()));
        console.log(
          JSON.stringify({
            run,
            stage: 'measure',
            elapsedMs: Math.round(performance.now() - start),
          }),
        );
      }
      const end = start + duration;
      await delay(config.tailMs);
      for (const [index, page] of pages.entries()) {
        const before = performance.now();
        const browserNow = await page.evaluate(() => ({
          now: performance.now(),
          hidden: globalThis.document.hidden,
        }));
        clock.push({ client: index, before, after: performance.now(), browserNow });
      }
      await pages[0].screenshot({ path: resolve(directory, 'canvas.png'), fullPage: true });
      const state = await request('/state');
      const completed = readFileSync(resolve(directory, 'reconciliation.jsonl'), 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      const sourceEvents = [];
      const intervals = { '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000 };
      for (
        let at = source.started + source.phaseMs, version = 1;
        at < sourceStart + duration;
        at += source.periodMs, version++
      ) {
        if (at < sourceStart) continue;
        for (const [timeframe, step] of Object.entries(intervals)) {
          sourceEvents.push({
            eventId: `${timeframe}:${version}`,
            version,
            pair: 'BTCUSDT',
            timeframe,
            openTime: Math.floor((source.wallStarted + at - source.started) / step) * step,
            sourceAvailableAt: at,
            runnerAt: start + at - sourceStart,
            open: 19999,
            high: 20001 + version,
            low: 19998,
            close: 20000 + version,
            volume: 519 + version,
          });
        }
      }
      const samples = [];
      for (const event of sourceEvents)
        for (let client = 0; client < cohort.clients; client++) {
          const timeframe = event.timeframe;
          const apply = events.find(
            (item) =>
              item.client === client &&
              item.timeframe === timeframe &&
              item.receivedAt >= start &&
              item.last.close >= event.close &&
              item.last.time * 1000 >= event.openTime,
          );
          samples.push({
            eventId: event.eventId,
            client,
            timeframe,
            applyReceivedDelayMs: apply ? apply.receivedAt - event.runnerAt : null,
            appliedVersion: apply ? apply.last.close - 20000 : null,
            drawAt: null,
            censored: !apply,
          });
        }
      const measurementEvents = events.filter(
        (item) => item.receivedAt >= start && item.receivedAt < end,
      );
      const invalidApplies = measurementEvents.filter(
        (item) =>
          item.count !== 500 ||
          item.hidden ||
          item.volume.value !== 519 + item.last.close - 20000 ||
          Math.abs(item.ma20.value - (15329.8 + (item.last.close - 20000) / 20)) > 1e-7,
      );
      const sourceOffset = start - sourceStart;
      const upstream = state.upstream.filter(
        (item) => item.start + sourceOffset >= start && item.start + sourceOffset < end,
      );
      let maxWeight = 0;
      const candidates = [
        sourceStart,
        ...upstream.map((item) => item.start),
        ...upstream.map((item) => item.start - 60000 + 0.000001),
      ];
      for (const from of candidates) {
        if (from < sourceStart || from + 60000 > sourceStart + duration) continue;
        maxWeight = Math.max(
          maxWeight,
          upstream
            .filter((item) => item.start >= from && item.start < from + 60000)
            .reduce((sum, item) => sum + item.weight, 0),
        );
      }
      const during = bytes.filter((item) => item.at >= start && item.at < end);
      const summary = {
        run,
        clients: cohort.clients,
        failure: cohort.failure,
        durationMs: duration,
        applyEvents: measurementEvents.length,
        invalidApplies: invalidApplies.length,
        responseReconciliations: completed.length,
        invalidResponses: completed.filter((item) => !item.valid).length,
        reconciliationCoverage: 'Every response in reconciliation.jsonl.',
        browserErrors: errors.length,
        upstreamRequests: upstream.length,
        maxSliding60sWeight: duration >= 60000 ? maxWeight : null,
        qa13:
          duration >= 60000 &&
          maxWeight <= 504 &&
          completed.every((item) => item.valid) &&
          state.unexpected.length === 0
            ? 'Passed'
            : duration >= 60000 && maxWeight > 504
              ? 'Failed'
              : 'Inconclusive',
        initialLoadEncodedBytes: bytes
          .filter((item) => item.phase === 'initial')
          .reduce((sum, item) => sum + item.encodedDataLength, 0),
        encodedBytes: during.reduce((sum, item) => sum + item.encodedDataLength, 0),
        bytesPerClientMinute:
          during.reduce((sum, item) => sum + item.encodedDataLength, 0) /
          ((cohort.clients * duration) / 60000),
        applyReceivedDelay: percentiles(
          samples.flatMap((item) =>
            item.applyReceivedDelayMs === null ? [] : [item.applyReceivedDelayMs],
          ),
        ),
        missingApplies: samples.filter((item) => item.censored).length,
        qa12: 'Inconclusive',
        freshnessP95Ms: null,
        staleTimeRatio: null,
        paint:
          'The apply mark does not prove a canvas paint. Screenshots are retained for visual inspection.',
        protocol:
          'CDP Network.loadingFinished.encodedDataLength includes the encoded response transfer. Loopback HTTP/1.1, no compression.',
        clock:
          'Clock exchanges retain round-trip bounds. Transport delay and clock uncertainty prevent a freshness conclusion.',
        sourceEvents: sourceEvents.length,
        unexpectedOutbound: state.unexpected,
      };
      for (const [name, value] of Object.entries({
        events,
        bytes,
        errors,
        clock,
        sourceEvents,
        samples,
        invalidApplies,
      }))
        writeFileSync(resolve(directory, `${name}.json.gz`), gzipSync(JSON.stringify(value)));
      writeFileSync(resolve(directory, 'summary.json'), JSON.stringify(summary, null, 2));
      appendFileSync(
        resolve(root, 'node_modules/.cache/market-data-perf/polling-runs.jsonl'),
        `${JSON.stringify(summary)}\n`,
      );
      console.log(JSON.stringify({ run, stage: 'complete', summary }));
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
      await request('/end', {});
    }
  }
} finally {
  await browser.close();
}
