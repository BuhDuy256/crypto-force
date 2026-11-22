// Checks polling through real HTTP, Auth and the dedicated _market_data_rest_test DB.
// Only upstream HTTP is replaced. The control clock sets replay data and cache age.
// Run with playwright.market-data-polling.config.ts, one worker, no other REST suite.
// Expected: docs/testing/test-scopes/TS-002-market-data/rest-polling-verification.md.
// Faults: hidden polling, missing resume refresh, hidden error data and repeated fitContent fail assertions.
import { randomInt, randomUUID } from 'node:crypto';
import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
  type Request,
} from '@playwright/test';

const control = 'http://127.0.0.1:3016';
const password = 'Correct-Horse-91';
let email = '';
test.beforeEach(async ({ page, request }) => {
  expect((await request.post(`${control}/__rest/reset/polling`)).status()).toBe(200);
  email = `rest-${randomUUID()}@example.test`;
  // Auth limits sign-up per client IP. Each test sends its own private address so earlier tests
  // do not use up the limit of later tests.
  const ip = `10.${String(randomInt(256))}.${String(randomInt(256))}.${String(randomInt(1, 255))}`;
  const signup = await page.request.post('/api/auth/sign-up/email', {
    headers: { 'x-forwarded-for': ip },
    data: { name: 'Market Reader', email, password, callbackURL: '/realtime' },
  });
  expect(signup.status()).toBe(200);
  let messages: string[] = [];
  await expect
    .poll(async () => {
      messages = (await (await request.get(`${control}/__rest/mail`)).json()) as string[];
      return messages.some((text) => text.includes('/verify-email?'));
    })
    .toBe(true);
  // Each test gets a new account. Select the last verification email from this sequential server.
  const link = messages.at(-1)?.match(/https?:\/\/[^\s]+\/verify-email\?[^\s]+/)?.[0];
  if (!link) throw new Error('The test server did not capture a verification link.');
  const verification = await page.request.get(link, { maxRedirects: 0 });
  expect(verification.status()).toBe(302);
});

test.afterEach(async ({ request }) => {
  const state = (await (await request.get(`${control}/__rest/ledger`)).json()) as {
    unexpected: string[];
  };
  expect(state.unexpected).toEqual([]);
});

async function state(request: APIRequestContext) {
  return (await (await request.get(`${control}/__rest/ledger`)).json()) as {
    pollingRequests: string[];
    ledger: string[];
  };
}
async function setSource(request: APIRequestContext, elapsed: number, extra = {}) {
  expect(
    (await request.post(`${control}/__rest/polling`, { data: { elapsed, ...extra } })).status(),
  ).toBe(200);
}
async function open(page: Page, beforeNavigate?: () => Promise<unknown>) {
  await page.clock.install({ time: new Date(1800000000000) });
  await page.clock.pauseAt(new Date(1800000001000));
  await beforeNavigate?.();
  await page.goto('/realtime');
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return Promise.all([
        ...[1, 2, 3, 4].map((chart) =>
          page.getByLabel(`Chart ${chart} values`, { exact: true }).allTextContents(),
        ),
        page.getByLabel('Last price', { exact: true }).allTextContents(),
      ]);
    })
    .toEqual(Array.from({ length: 5 }, () => [expect.stringContaining('618.00')]));
}
function observeRequestStarts(page: Page) {
  const times: number[] = [];
  page.on('console', (message) => {
    if (message.text().startsWith('polling-request:')) times.push(Number(message.text().slice(16)));
  });
  return {
    times,
    install: () =>
      page.addInitScript(() => {
        const nativeFetch = globalThis.fetch;
        globalThis.fetch = (...args) => {
          const url = args[0] instanceof Request ? args[0].url : String(args[0]);
          if (url.includes('/api/market-data/'))
            console.debug(`polling-request:${String(Date.now())}`);
          return nativeFetch(...args);
        };
      }),
  };
}
async function cycle(page: Page, request: APIRequestContext, elapsed = 5000, extra = {}) {
  await setSource(request, elapsed, extra);
  await page.clock.runFor(5000);
}
async function expectClockText(page: Page, locator: Locator, value: string) {
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return locator.allTextContents();
    })
    .toEqual([expect.stringContaining(value)]);
}
async function expectClose(page: Page, value: string) {
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      const values = page.getByLabel('Chart 1 values', { exact: true });
      return (await values.count()) ? values.textContent() : null;
    })
    .toContain(value);
}

// The replay must first work without polling. These checks keep a driver defect out of red evidence.
test('replays an open candle, source errors and recovery through the real API', async ({
  page,
  request,
}) => {
  const first = await page.request.get('/api/market-data/candles?pair=BTCUSDT&timeframe=5m');
  expect(first.status()).toBe(200);
  const body = (await first.json()) as {
    dataTime: number;
    candles: { close: number; isClosed: boolean }[];
  };
  expect(body.dataTime).toBe(1800000000000);
  expect(body.candles.at(-1)).toMatchObject({ close: 618, isClosed: false });
  await setSource(request, 5000);
  const changed = await page.request.get('/api/market-data/candles?pair=BTCUSDT&timeframe=5m');
  expect(changed.status()).toBe(200);
  expect(((await changed.json()) as { candles: { close: number }[] }).candles.at(-1)?.close).toBe(
    628,
  );
  const daily = await page.request.get('/api/market-data/candles?pair=BTCUSDT&timeframe=1d');
  expect(daily.status()).toBe(200);
  expect(((await daily.json()) as { candles: { close: number }[] }).candles.at(-1)?.close).toBe(
    728,
  );
  await setSource(request, 10000, { failure: true });
  const failed = await page.request.get('/api/market-data/candles?pair=BTCUSDT&timeframe=5m');
  expect(failed.status()).toBe(503);
  expect(await failed.json()).toEqual({
    error: { code: 'MARKET_DATA_UNAVAILABLE', message: 'The market data is unavailable.' },
  });
  await setSource(request, 15000, { failure: false });
  const recovered = await page.request.get('/api/market-data/candles?pair=BTCUSDT&timeframe=5m');
  expect(recovered.status()).toBe(200);
  expect(((await recovered.json()) as { candles: { close: number }[] }).candles.at(-1)?.close).toBe(
    648,
  );
});

test('refreshes all visible charts and summary after five seconds', async ({ page, request }) => {
  await open(page);
  const before = (await state(request)).pollingRequests.length;
  const times = await page
    .getByRole('region', { name: 'Chart 1', exact: true })
    .getByText(/^Data time/)
    .textContent();
  await cycle(page, request);
  await expectClose(page, '628.00');
  for (const chart of [1, 2, 3, 4])
    await expectClockText(
      page,
      page.getByLabel(`Chart ${chart} values`, { exact: true }),
      '628.00',
    );
  await expectClockText(page, page.getByLabel('Last price', { exact: true }), '628.00');
  await expect(
    page.getByRole('region', { name: 'Chart 1', exact: true }).getByText(/^Data time/),
  ).not.toHaveText(times ?? '');
  expect((await state(request)).pollingRequests).toHaveLength(before + 5);
});

test('pauses every query and refreshes immediately on resume', async ({ page, request }) => {
  const starts = observeRequestStarts(page);
  await open(page, starts.install);
  const toggle = page.getByRole('switch', { name: /Live updates/i });
  await expect(toggle).toBeChecked();
  await toggle.click();
  await expect(page.getByText(/Paused at/)).toBeVisible();
  const before = (await state(request)).pollingRequests.length;
  await cycle(page, request);
  expect((await state(request)).pollingRequests).toHaveLength(before);
  const offset = starts.times.length;
  const resumedAt = await page.evaluate(() => Date.now());
  await toggle.click();
  await page.clock.runFor(999);
  await expectClose(page, '628.00');
  expect((await state(request)).pollingRequests).toHaveLength(before + 5);
  expect(starts.times.slice(offset)).toHaveLength(5);
  expect(starts.times.slice(offset).every((at) => at >= resumedAt && at - resumedAt < 1000)).toBe(
    true,
  );
});

test('retains data and data time on an error, then removes the error after recovery', async ({
  page,
  request,
}) => {
  await open(page);
  const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
  const time = await chart.getByText(/^Data time/).textContent();
  await cycle(page, request, 5000, { failure: true });
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return chart.getByRole('status').textContent();
    })
    .toBe('Cannot load candle history.');
  await expectClose(page, '618.00');
  await expect(chart.getByText(/^Data time/)).toHaveText(time ?? '');
  await expect(page.getByLabel('Last price', { exact: true })).toContainText('618.00');
  await expect(page.getByRole('region', { name: 'Market summary' }).getByRole('status')).toHaveText(
    'Cannot load the market summary.',
  );
  await cycle(page, request, 10000, { failure: false });
  await expectClose(page, '638.00');
  await expect(chart.getByRole('status')).toHaveText('');
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return page.getByRole('region', { name: 'Market summary' }).getByRole('status').textContent();
    })
    .toBe('');
});

test('keeps initial chart errors stable until a manual retry', async ({ page, request }) => {
  await setSource(request, 0, { failure: true });
  await page.clock.install({ time: new Date(1800000000000) });
  await page.clock.pauseAt(new Date(1800000001000));
  await page.goto('/realtime');
  const retry = page.getByRole('button', { name: 'Retry chart 1', exact: true });
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return retry.count();
    })
    .toBe(1);
  await retry.focus();
  const before = (await state(request)).pollingRequests.filter((url) =>
    url.includes('/candles'),
  ).length;
  await cycle(page, request, 5000, { failure: false });
  expect(
    (await state(request)).pollingRequests.filter((url) => url.includes('/candles')),
  ).toHaveLength(before);
  await expect(retry).toBeFocused();
  await retry.click();
  await expectClose(page, '628.00');
});

test('keeps keyboard focus, selected candle and silent success status during refresh', async ({
  page,
  request,
}) => {
  await open(page);
  const statusChanges: string[] = [];
  page.on('console', (message) => {
    if (message.text().startsWith('polling-status:')) statusChanges.push(message.text());
  });
  await page.evaluate(() => {
    const observer = new MutationObserver((entries) => {
      console.debug(
        'polling-status:' + JSON.stringify(entries.map((entry) => entry.target.textContent)),
      );
    });
    document.querySelectorAll('[role="status"]').forEach((status) => {
      observer.observe(status, { childList: true, characterData: true, subtree: true });
    });
  });
  const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
  const canvas = chart.getByRole('group', { name: /candlesticks/ });
  await canvas.focus();
  await canvas.press('End');
  await expect(chart.getByLabel('Selected candle', { exact: true })).toContainText('618.00');
  await cycle(page, request);
  await expectClose(page, '628.00');
  await expect(canvas).toBeFocused();
  await expect(chart.getByLabel('Selected candle', { exact: true })).toContainText('628.00');
  await expect(chart.getByRole('status')).toHaveText('');
  expect(statusChanges).toEqual([]);
});

test('stops refreshes after a session expires', async ({ page, request, playwright }) => {
  await open(page);
  const cookie = (await page.context().cookies())
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  const other = await playwright.request.newContext({ baseURL: 'http://localhost:5185' });
  expect(
    (
      await other.post('/api/auth/sign-out', {
        headers: { cookie, origin: 'http://localhost:5185' },
      })
    ).status(),
  ).toBe(200);
  await other.dispose();
  await cycle(page, request);
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return page.getByRole('heading', { name: 'Sign in to open Realtime' }).count();
    })
    .toBe(1);
  const before = (await state(request)).pollingRequests.length;
  await page.clock.runFor(10000);
  expect((await state(request)).pollingRequests).toHaveLength(before);
});

// A visibility event drives the same browser boundary as a hidden tab. It does not freeze timers.
async function visibility(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: value ? 'hidden' : 'visible',
    });
    Object.defineProperty(document, 'hidden', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
  }, hidden);
}

test('sends no requests while hidden and refreshes on visibility return', async ({
  page,
  request,
}) => {
  const starts = observeRequestStarts(page);
  await open(page, starts.install);
  const before = (await state(request)).pollingRequests.length;
  await visibility(page, true);
  await cycle(page, request);
  expect((await state(request)).pollingRequests).toHaveLength(before);
  const offset = starts.times.length;
  const visibleAt = await page.evaluate(() => Date.now());
  await visibility(page, false);
  await page.clock.runFor(999);
  await expectClose(page, '628.00');
  expect((await state(request)).pollingRequests).toHaveLength(before + 5);
  expect(starts.times.slice(offset)).toHaveLength(5);
  expect(starts.times.slice(offset).every((at) => at >= visibleAt && at - visibleAt < 1000)).toBe(
    true,
  );
});

test('accepts an in-flight result after pause without starting another refresh', async ({
  page,
  request,
}) => {
  await open(page);
  const initial = (await state(request)).pollingRequests.filter((url) =>
    url.includes('timeframe=5m'),
  ).length;
  await cycle(page, request, 5000, { hold: true });
  await expect
    .poll(
      async () =>
        (await state(request)).pollingRequests.filter((url) => url.includes('timeframe=5m')).length,
    )
    .toBe(initial + 1);
  const toggle = page.getByRole('switch', { name: /Live updates/i });
  await expect(toggle).toBeChecked();
  await toggle.click();
  const before = (await state(request)).pollingRequests.length;
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
  await expectClose(page, '628.00');
  await page.clock.runFor(10000);
  expect((await state(request)).pollingRequests).toHaveLength(before);
  await expect(toggle).not.toBeChecked();
});

function observeOldRefresh(page: Page) {
  let oldRequest: Request | undefined;
  const settled = new Set<Request>();
  page.on('request', (candidate) => {
    if (candidate.url().includes('/api/market-data/candles?pair=BTCUSDT&timeframe=5m'))
      oldRequest = candidate;
  });
  page.on('requestfinished', (candidate) => settled.add(candidate));
  page.on('requestfailed', (candidate) => settled.add(candidate));
  return async function expectSettled() {
    await expect
      .poll(async () => {
        await page.clock.runFor(1);
        return oldRequest !== undefined && settled.has(oldRequest);
      })
      .toBe(true);
  };
}

test('keeps the new timeframe data after the old refresh finishes or is cancelled', async ({
  page,
  request,
}) => {
  await open(page);
  const expectOldSettled = observeOldRefresh(page);
  const initial = (await state(request)).pollingRequests.filter((url) =>
    url.includes('timeframe=5m'),
  ).length;
  await cycle(page, request, 5000, { hold: true });
  await expect
    .poll(
      async () =>
        (await state(request)).pollingRequests.filter((url) => url.includes('timeframe=5m')).length,
    )
    .toBe(initial + 1);
  await page.getByRole('combobox', { name: 'Timeframe for chart 1' }).click();
  await page.getByRole('option', { name: '1d', exact: true }).click();
  await expectClose(page, '728.00');
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
  await expectOldSettled();
  await expectClose(page, '728.00');
  await expect(page.getByRole('combobox', { name: 'Timeframe for chart 1' })).toHaveText('1d');
  const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
  await expect(
    chart.getByRole('group', { name: 'BTCUSDT 1d candlesticks, volume and MA(20)', exact: true }),
  ).toBeVisible();
  await chart.getByRole('group', { name: /candlesticks/ }).press('End');
  await expect(chart.getByLabel('Selected candle', { exact: true })).toContainText('728.00');
});

test('does not overlap a held refresh and keeps old data at the chart deadline', async ({
  page,
  request,
}) => {
  await open(page);
  const initial = (await state(request)).pollingRequests.filter((url) =>
    url.includes('timeframe=5m'),
  ).length;
  await cycle(page, request, 5000, { hold: true });
  await expect
    .poll(
      async () =>
        (await state(request)).pollingRequests.filter((url) => url.includes('timeframe=5m')).length,
    )
    .toBe(initial + 1);
  await page.clock.runFor(9999);
  expect(
    (await state(request)).pollingRequests.filter((url) => url.includes('timeframe=5m')),
  ).toHaveLength(initial + 1);
  await page.clock.runFor(1);
  const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return chart.getByRole('status').textContent();
    })
    .toBe('Cannot load candle history.');
  await expectClose(page, '618.00');
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
});

test('reloads with live updates enabled after a keyboard pause', async ({ page, request }) => {
  await open(page);
  const toggle = page.getByRole('switch', { name: 'Live updates' });
  await toggle.focus();
  const pausedAt = await page.evaluate(() => Date.now());
  await toggle.press('Space');
  await expect(toggle).not.toBeChecked();
  const paused = await page.getByText(/^Paused at/).textContent();
  expect(paused).toContain(
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short',
      timeZone: await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    }).format(pausedAt),
  );
  await page.reload();
  await expect(toggle).toBeChecked();
  await cycle(page, request);
  await expectClose(page, '628.00');
});

test('keeps the new pair after an old polling response settles', async ({ page, request }) => {
  await open(page);
  const expectOldSettled = observeOldRefresh(page);
  const initial = (await state(request)).pollingRequests.filter((url) =>
    url.includes('pair=BTCUSDT&timeframe=5m'),
  ).length;
  await cycle(page, request, 5000, { hold: true });
  await expect
    .poll(
      async () =>
        (await state(request)).pollingRequests.filter((url) =>
          url.includes('pair=BTCUSDT&timeframe=5m'),
        ).length,
    )
    .toBe(initial + 1);
  await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
  await page.getByRole('option', { name: 'ETHUSDT', exact: true }).click();
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
  await expectOldSettled();
  await expectClose(page, '728.00');
  await expect(
    page
      .getByRole('region', { name: 'Chart 1', exact: true })
      .getByRole('group', { name: /ETHUSDT 5m candlesticks/ }),
  ).toBeVisible();
  await cycle(page, request, 10000);
  await expectClose(page, '738.00');
});

test('keeps a zoomed historical time axis across a candle rollover', async ({
  page,
  request,
}, info) => {
  const applies: { timeframe: string; candles: { time: number }[] }[] = [];
  page.on('console', (message) => {
    if (message.text().startsWith('polling-apply:'))
      applies.push(
        JSON.parse(message.text().slice('polling-apply:'.length)) as (typeof applies)[number],
      );
  });
  await open(page, () =>
    page.addInitScript(() => {
      const mark = performance.mark.bind(performance);
      performance.mark = (name, options) => {
        if (name === 'market-data:apply')
          console.debug('polling-apply:' + JSON.stringify(options?.detail));
        return mark(name, options);
      };
    }),
  );
  const canvas = page
    .getByRole('region', { name: 'Chart 1', exact: true })
    .getByRole('group', { name: /candlesticks/ });
  await canvas.focus();
  await canvas.press('+');
  await canvas.press('+');
  await page.mouse.move(0, 0);
  await page.clock.runFor(100);
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The chart bounds are missing.');
  const clip = {
    x: bounds.x,
    y: bounds.y + bounds.height - 26,
    width: bounds.width - 70,
    height: 26,
  };
  const before = await page.screenshot({
    clip,
    path: info.outputPath('historical-axis-before.png'),
  });
  const first = applies.find((entry) => entry.timeframe === '5m');
  expect(first?.candles).toHaveLength(500);
  await cycle(page, request, 300000);
  await expectClose(page, '1,218.00');
  await page.clock.runFor(100);
  const after = await page.screenshot({ clip, path: info.outputPath('historical-axis-after.png') });
  expect(after.equals(before)).toBe(true);
  const last = applies.filter((entry) => entry.timeframe === '5m').at(-1);
  expect(last?.candles).toHaveLength(500);
  expect(last?.candles[0]?.time).toBe((first?.candles[0]?.time ?? 0) + 300);
  expect(last?.candles.at(-1)?.time).toBe((first?.candles.at(-1)?.time ?? 0) + 300);
  await canvas.press('End');
  await expect(
    page
      .getByRole('region', { name: 'Chart 1', exact: true })
      .getByLabel('Selected candle', { exact: true }),
  ).toContainText('1,218.00');
  await canvas.screenshot({ path: info.outputPath('rollover-canvas.png') });
});

test('keeps the new rollover candle in view while following the tail', async ({
  page,
  request,
}, info) => {
  await open(page);
  const canvas = page
    .getByRole('region', { name: 'Chart 1', exact: true })
    .getByRole('group', { name: /candlesticks/ });
  await page.clock.runFor(100);
  await canvas.focus();
  await canvas.press('+');
  await page.clock.runFor(20);
  await canvas.press('+');
  await page.clock.runFor(20);
  await canvas.press('End');
  await page.clock.runFor(100);
  await cycle(page, request, 300000);
  await expectClose(page, '1,218.00');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The chart bounds are missing.');
  const clip = {
    x: bounds.x,
    y: bounds.y + bounds.height - 26,
    width: bounds.width - 70,
    height: 26,
  };
  async function clearPointer() {
    await canvas.hover({ position: { x: 10, y: 10 } });
    await page.mouse.move(0, 0);
    await page.clock.runFor(100);
  }
  await clearPointer();
  const before = await page.screenshot({ clip, path: info.outputPath('tail-before-end.png') });
  await canvas.press('End');
  await clearPointer();
  const after = await page.screenshot({ clip, path: info.outputPath('tail-after-end.png') });
  expect(after.equals(before)).toBe(true);
});
