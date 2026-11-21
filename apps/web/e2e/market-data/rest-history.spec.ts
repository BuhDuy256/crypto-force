// Checks the browser -> real API -> adapter -> HTTP fake flow. MSW and response routing are disabled.
// Run: pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts.
// Auth uses the dedicated _market_data_rest_test DB. Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md fixtures and UI rules.
// Canvas pixels and screen reader speech are not checked here. Browser screenshots:
// docs/testing/evidence/market-data/2026-11-21-rest-ui-browser/.
// Faults tried (each made the related tests fail, and they passed again after restore):
// driver: ETH rows without the +100 offset; 5m error sent for every interval; gap fixture keeps index 10.
// product: MA from high; deadline 9999, 10001 or 10002 ms; no sign-in gate on 401; status hidden when
// empty; status element replaced on each state; chart description not linked; warm-up candles drawn;
// no focus kept after a chart or sidebar retry; caller abort not forwarded to fetch.
import { randomInt, randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page, type Request } from '@playwright/test';

const control = 'http://127.0.0.1:3016';
const password = 'Correct-Horse-91';
// The account of the current test, created in beforeEach. Tests run one at a time (workers: 1).
let email = '';
async function selectTimeframe(page: Page, chart: number, value: string) {
  await page.getByRole('combobox', { name: `Timeframe for chart ${chart}` }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

test.beforeEach(async ({ page, request }) => {
  expect((await request.post(`${control}/__rest/reset/full`)).status()).toBe(200);
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

test('opens four default charts through the real API with no browser worker', async ({
  page,
  request,
}) => {
  await page.goto('/realtime');
  await expect(page.getByRole('region', { name: /^Chart \d$/ })).toHaveCount(4);
  for (const [index, timeframe] of ['5m', '15m', '1h', '4h'].entries()) {
    await expect(
      page.getByRole('combobox', { name: `Timeframe for chart ${index + 1}` }),
    ).toHaveText(timeframe);
  }
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
  await expect(page.getByRole('link', { name: /TradingView/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Load history/i })).toHaveCount(0);
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
  const state = (await (await request.get(`${control}/__rest/ledger`)).json()) as {
    ledger: string[];
  };
  expect(state.ledger.filter((url) => url.includes('/klines'))).toHaveLength(4);
  expect(state.ledger.filter((url) => url.includes('/ticker/24hr'))).toHaveLength(1);
});

test('changes one timeframe without requesting summary or the other charts again', async ({
  page,
  request,
}) => {
  await page.goto('/realtime');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
  const before = (await (await request.get(`${control}/__rest/ledger`)).json()) as {
    ledger: string[];
  };
  await selectTimeframe(page, 1, '1d');
  await expect(page.getByRole('combobox', { name: 'Timeframe for chart 1' })).toHaveText('1d');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
  const after = (await (await request.get(`${control}/__rest/ledger`)).json()) as {
    ledger: string[];
  };
  expect(after.ledger.slice(before.ledger.length)).toHaveLength(1);
  expect(new URL(after.ledger.at(-1) ?? '').searchParams.get('interval')).toBe('1d');
  for (const [chart, timeframe] of [
    [2, '15m'],
    [3, '1h'],
    [4, '4h'],
  ]) {
    await expect(page.getByRole('combobox', { name: `Timeframe for chart ${chart}` })).toHaveText(
      String(timeframe),
    );
  }
});

test('keeps the fourth timeframe while the chart is hidden', async ({ page }) => {
  await page.goto('/realtime');
  await selectTimeframe(page, 4, '1d');
  await page.getByRole('radio', { name: '1 chart', exact: true }).click();
  await expect(page.getByRole('region', { name: /^Chart \d$/ })).toHaveCount(1);
  await page.getByRole('radio', { name: '2 charts', exact: true }).click();
  await expect(page.getByRole('region', { name: /^Chart \d$/ })).toHaveCount(2);
  await page.getByRole('radio', { name: '4 charts', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Timeframe for chart 4' })).toHaveText('1d');
});

test('shows an empty result without MA or volume data', async ({ page, request }) => {
  expect((await request.post(`${control}/__rest/reset/empty`)).status()).toBe(200);
  await page.goto('/realtime');
  await expect(
    page.getByText('No candle history for this selection.', { exact: true }),
  ).toHaveCount(4);
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveCount(0);
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(0);
});

test('shows insufficient MA samples as text', async ({ page, request }) => {
  expect((await request.post(`${control}/__rest/reset/short`)).status()).toBe(200);
  await page.goto('/realtime');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('Not enough data');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('118.00');
});

test('reloads with the default pair and chart selection', async ({ page }) => {
  await page.goto('/realtime');
  await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
  await page.getByRole('option', { name: 'ETHUSDT', exact: true }).click();
  await selectTimeframe(page, 1, '1d');
  await page.getByRole('radio', { name: '1 chart', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Pair', exact: true })).toHaveText('BTCUSDT');
  await expect(page.getByRole('region', { name: /^Chart \d$/ })).toHaveCount(4);
  await expect(page.getByRole('combobox', { name: 'Timeframe for chart 1' })).toHaveText('5m');
});

test('keeps controls visible at 320 CSS pixels without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/realtime');
  await expect(page.getByRole('combobox', { name: 'Pair', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const first = await page.getByRole('region', { name: 'Chart 1', exact: true }).boundingBox();
  const second = await page.getByRole('region', { name: 'Chart 2', exact: true }).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect(second?.y).toBeGreaterThan((first?.y ?? 0) + (first?.height ?? 0) - 1);
});

test('shows the selected pair while an earlier upstream request is held', async ({
  page,
  request,
}) => {
  expect((await request.post(`${control}/__rest/reset/held`)).status()).toBe(200);
  await page.goto('/realtime');
  await expect
    .poll(async () => {
      const state = (await (await request.get(`${control}/__rest/ledger`)).json()) as {
        ledger: string[];
      };
      return state.ledger.some((url) => url.includes('interval=5m') && url.includes('BTCUSDT'));
    })
    .toBe(true);
  await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
  await page.getByRole('option', { name: 'ETHUSDT', exact: true }).click();
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('718.00');
  await expect(page.getByLabel('Last price', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Pair', exact: true })).toHaveText('ETHUSDT');
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
});

test('isolates a chart error and recovers through its retry control', async ({ page, request }) => {
  expect((await request.post(`${control}/__rest/reset/chart-error`)).status()).toBe(200);
  await page.goto('/realtime');
  await expect(page.getByRole('button', { name: 'Retry chart 1', exact: true })).toBeVisible();
  await expect(page.getByLabel('Chart 2 values', { exact: true })).toContainText('608.50');
  await expect(page.getByLabel('Last price', { exact: true })).toBeVisible();
  await expect(page.getByText('Private upstream sentinel.', { exact: true })).toHaveCount(0);
  expect((await request.post(`${control}/__rest/reset/full`)).status()).toBe(200);
  await page.getByRole('button', { name: 'Retry chart 1', exact: true }).click();
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
});

test('formats the last price half-up with exactly two decimals', async ({ page }) => {
  // The fake ticker returns 618.125 for BTCUSDT and 218.5 for ETHUSDT. Rule: ADR-005, approved 2026-11-21.
  await page.goto('/realtime');
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('618.13 USDT');
  await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
  await page.getByRole('option', { name: 'ETHUSDT', exact: true }).click();
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('218.50 USDT');
});

test('removes MA and volume from the summary sidebar', async ({ page }) => {
  await page.goto('/realtime');
  await expect(page.getByLabel('Last price', { exact: true })).toBeVisible();
  const sidebar = page.getByRole('region', { name: 'Market summary', exact: true });
  await expect(sidebar.getByText(/MA\(20\)|Volume/)).toHaveCount(0);
});

async function ledger(request: APIRequestContext) {
  return (await (await request.get(`${control}/__rest/ledger`)).json()) as {
    ledger: string[];
    webHeld: number;
  };
}

/**
 * Outcome of the latest browser request whose URL contains `urlPart`. The dev server renders in
 * React StrictMode, which mounts twice: the first request of a query is cancelled and a second
 * request replaces it, so only the latest request shows what the user sees.
 */
function latestRequest(page: Page, urlPart: string) {
  const requests: Request[] = [];
  const outcomes = new Map<Request, 'finished' | 'failed'>();
  page.on('request', (request) => {
    if (request.url().includes(urlPart)) requests.push(request);
  });
  page.on('requestfinished', (request) => outcomes.set(request, 'finished'));
  page.on('requestfailed', (request) => outcomes.set(request, 'failed'));
  // Without a timeout argument, the poll uses the expect timeout of the config (10000 ms).
  return async (timeout = 10000) => {
    let outcome: 'finished' | 'failed' | undefined;
    await expect
      .poll(
        () => {
          const last = requests.at(-1);
          outcome = last ? outcomes.get(last) : undefined;
          return outcome;
        },
        { timeout },
      )
      .toBeDefined();
    return outcome;
  };
}

test('cancels the earlier pair request so its released response cannot replace the new pair', async ({
  page,
  request,
}) => {
  // MK-14, MK-17: the earlier BTCUSDT/5m request is held upstream while ETHUSDT is selected.
  expect((await request.post(`${control}/__rest/reset/held`)).status()).toBe(200);
  const old = latestRequest(page, '/api/market-data/candles?pair=BTCUSDT&timeframe=5m');
  await page.goto('/realtime');
  await expect
    .poll(async () => (await ledger(request)).ledger.some((url) => url.includes('interval=5m')))
    .toBe(true);
  await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
  await page.getByRole('option', { name: 'ETHUSDT', exact: true }).click();
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('718.00');
  // The Web ends the earlier browser request when its selection is no longer shown, so the API
  // response that follows the release cannot reach the page. The request must end before the API
  // timeout of the test server (5000 ms) or the Web deadline (10 s) could end it.
  expect(await old(3000)).toBe('failed');
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
  // A later request orders the check after the API handled the released upstream response.
  await selectTimeframe(page, 2, '1d');
  await expect(page.getByLabel('Chart 2 values', { exact: true })).toContainText('718.00');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('718.00');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).not.toContainText('608.50');
  await expect(page.getByRole('heading', { name: /^ETHUSDT/ })).toHaveCount(4);
});

// MK-34: from the start of the chart request. The HTTP request waits before the API, so neither the
// API timeout (5000 ms) nor the upstream ends it. The page clock is paused before the request starts.
// A 0 ms timer created while the clock runs is due 1 ms later, so the checks after the deadline
// advance the clock by 1 ms to let React Query notify the chart.
for (const elapsed of [9999, 10000, 10001]) {
  test(`chart request after ${String(elapsed)} ms without a response`, async ({
    page,
    request,
  }) => {
    expect((await request.post(`${control}/__rest/reset/web-hold`)).status()).toBe(200);
    await page.clock.install({ time: new Date('2026-11-21T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-11-21T00:00:01Z'));
    const outcome = latestRequest(page, '/api/market-data/candles?pair=BTCUSDT&timeframe=5m');
    const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
    await page.goto('/realtime');
    await expect.poll(async () => (await ledger(request)).webHeld).toBeGreaterThan(0);
    await expect(chart.getByRole('status')).toHaveText('Loading candles…');
    await page.clock.runFor(elapsed);
    if (elapsed < 10000) {
      // Before the deadline the chart still loads, and the request stays open: with the clock
      // stopped at this time, the released response completes instead of being aborted.
      await expect(chart.getByRole('status')).toHaveText('Loading candles…');
      expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
      expect(await outcome()).toBe('finished');
      return;
    }
    expect(await outcome()).toBe('failed');
    await expect
      .poll(async () => {
        await page.clock.runFor(1);
        return chart.getByRole('status').textContent();
      })
      .toBe('Cannot load candle history.');
    await expect(chart.getByRole('button', { name: 'Retry chart 1', exact: true })).toBeVisible();
    // After the deadline the browser request is ended. The release lets the API finish; the chart
    // keeps the error and does not send a new request by itself.
    expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
    await expect
      .poll(async () => (await ledger(request)).ledger.some((url) => url.includes('interval=5m')))
      .toBe(true);
    await page.clock.runFor(1);
    await expect(chart.getByRole('status')).toHaveText('Cannot load candle history.');
    await expect(chart.getByLabel('Chart 1 values', { exact: true })).toHaveCount(0);
  });
}

test('shows the sign-in gate when the session ends and returns to Realtime', async ({
  page,
  playwright,
}) => {
  // MK-40: the server ends the session while the browser still sends the cookie.
  await page.goto('/realtime');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
  const cookie = (await page.context().cookies())
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  const other = await playwright.request.newContext({ baseURL: 'http://localhost:5185' });
  const signOut = await other.post('/api/auth/sign-out', {
    headers: { cookie, origin: 'http://localhost:5185' },
  });
  expect(signOut.status()).toBe(200);
  await other.dispose();
  const unauthorized = page.waitForResponse(
    (response) => response.url().includes('timeframe=1d') && response.status() === 401,
  );
  await selectTimeframe(page, 1, '1d');
  await unauthorized;
  await expect(page.getByRole('heading', { name: 'Sign in to open Realtime' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/realtime');
  await page.getByRole('link', { name: 'Sign in to continue' }).click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/realtime$/);
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
});

test.describe('in the Asia/Bangkok time zone', () => {
  test.use({ timezoneId: 'Asia/Bangkok' });

  test('labels the open candle and reads candles with the keyboard', async ({ page, request }) => {
    // MK-24, MK-26, MK-27, MK-28, MK-41, MK-43, MK-46. Fixture: 519 5m candles from
    // 2025-01-01 00:00 UTC; data time 2025-01-02 19:14:59.999 UTC, so only the last candle is open.
    expect((await request.post(`${control}/__rest/reset/open`)).status()).toBe(200);
    await page.goto('/realtime');
    const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
    await expect(page.getByText('Times in Asia/Bangkok', { exact: true })).toBeVisible();
    await expect(chart.getByLabel('Chart 1 values', { exact: true })).toHaveText(
      'Open candle · Close 618.00 · Volume 528 · MA(20) 608.50 (provisional)',
    );
    await expect(chart.getByText('Data time Jan 3, 2025, 02:14 GMT+7 · 5m')).toBeVisible();
    const canvas = chart.getByRole('group', { name: 'BTCUSDT 5m candlesticks, volume and MA(20)' });
    await canvas.focus();
    await page.keyboard.press('End');
    await expect(chart.getByLabel('Selected candle', { exact: true })).toHaveText(
      'Jan 3, 2025, 02:10 GMT+7 (open candle) · O 618.00 · H 619.00 · L 617.00 · C 618.00 · V 528 · MA(20) 608.50 (provisional)',
    );
    // The first selectable candle is index 19: the 19 warm-up candles are not drawn.
    await page.keyboard.press('Home');
    await expect(chart.getByLabel('Selected candle', { exact: true })).toHaveText(
      'Jan 1, 2025, 08:35 GMT+7 · O 119.00 · H 120.00 · L 118.00 · C 119.00 · V 29 · MA(20) 109.50',
    );
    await page.keyboard.press('ArrowRight');
    await expect(chart.getByLabel('Selected candle', { exact: true })).toContainText(
      '08:40 GMT+7 · O 120.00',
    );
    await expect(canvas).toBeFocused();
  });
});

test('announces a chart state change only in that chart, without moving focus', async ({
  page,
  request,
}) => {
  // MK-48: the status exists before the change and only its text changes.
  expect((await request.post(`${control}/__rest/reset/held`)).status()).toBe(200);
  await page.goto('/realtime');
  const status = page.getByRole('region', { name: 'Chart 1', exact: true }).getByRole('status');
  await expect(status).toHaveText('Loading candles…');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  for (const chart of [2, 3, 4]) {
    await expect(page.getByLabel(`Chart ${String(chart)} values`, { exact: true })).toBeVisible();
  }
  // Each status counts its content changes in data-changes; the observer does not watch attributes.
  const before = await status.evaluate((node) => {
    for (const live of document.querySelectorAll('[role="region"] [role="status"]')) {
      if (!(live instanceof HTMLElement)) continue;
      new MutationObserver(() => {
        live.dataset.changes = String(Number(live.dataset.changes ?? '0') + 1);
      }).observe(live, { childList: true, characterData: true, subtree: true });
    }
    node.setAttribute('data-before-change', 'true');
    return node.textContent;
  });
  expect(before).toBe('Loading candles…');
  const timeframe2 = page.getByRole('combobox', { name: 'Timeframe for chart 2' });
  await timeframe2.focus();
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
  await expect(status).toHaveText('');
  await expect(status).toHaveAttribute('data-before-change', 'true');
  await expect(timeframe2).toBeFocused();
  await expect(status).toHaveAttribute('data-changes', '1');
  for (const chart of [2, 3, 4]) {
    await expect(
      page.getByRole('region', { name: `Chart ${String(chart)}`, exact: true }).getByRole('status'),
    ).not.toHaveAttribute('data-changes');
  }
});

test('retries one chart by keyboard, once while it loads, and keeps focus in that chart', async ({
  page,
  request,
}) => {
  // MK-12, MK-38, MK-46, MK-48, MK-58. Only chart 1 (5m) fails.
  expect((await request.post(`${control}/__rest/reset/chart-error`)).status()).toBe(200);
  await page.goto('/realtime');
  const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
  const retry = chart.getByRole('button', { name: 'Retry chart 1', exact: true });
  await expect(chart.getByRole('status')).toHaveText('Cannot load candle history.');
  for (const other of [2, 3, 4]) {
    await expect(
      page.getByRole('region', { name: `Chart ${String(other)}`, exact: true }).getByRole('status'),
    ).toHaveText('');
  }
  // The retry waits upstream until release, so the second Enter happens while the chart loads.
  expect((await request.post(`${control}/__rest/reset/held`)).status()).toBe(200);
  const retries: string[] = [];
  page.on('request', (sent) => {
    if (sent.url().includes('/api/market-data/candles?pair=BTCUSDT&timeframe=5m')) {
      retries.push(sent.url());
    }
  });
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect(chart.getByRole('status')).toHaveText('Loading candles…');
  await expect(retry).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await expect(retry).toBeFocused();
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
  await expect(chart.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
  await expect(chart).toBeFocused();
  expect(retries).toHaveLength(1);
});

test('keeps the chart status element through a failed retry and other charts unchanged', async ({
  page,
  request,
}) => {
  // MK-12, MK-48: error -> loading -> error changes only the text of the existing chart 1 status.
  expect((await request.post(`${control}/__rest/reset/chart-error`)).status()).toBe(200);
  await page.goto('/realtime');
  const status = page.getByRole('region', { name: 'Chart 1', exact: true }).getByRole('status');
  await expect(status).toHaveText('Cannot load candle history.');
  for (const chart of [2, 3, 4]) {
    await expect(page.getByLabel(`Chart ${String(chart)} values`, { exact: true })).toBeVisible();
  }
  await status.evaluate((node) => {
    for (const live of document.querySelectorAll('[role="region"] [role="status"]')) {
      if (!(live instanceof HTMLElement)) continue;
      new MutationObserver(() => {
        live.dataset.changes = String(Number(live.dataset.changes ?? '0') + 1);
      }).observe(live, { childList: true, characterData: true, subtree: true });
    }
    node.setAttribute('data-before-change', 'true');
  });
  await page.getByRole('button', { name: 'Retry chart 1', exact: true }).click();
  await expect(status).toHaveAttribute('data-changes', '2');
  await expect(status).toHaveText('Cannot load candle history.');
  await expect(status).toHaveAttribute('data-before-change', 'true');
  for (const chart of [2, 3, 4]) {
    await expect(
      page.getByRole('region', { name: `Chart ${String(chart)}`, exact: true }).getByRole('status'),
    ).not.toHaveAttribute('data-changes');
  }
});

test('describes empty charts and charts without enough MA samples', async ({ page, request }) => {
  // MK-11, MK-15, MK-47, MK-48: the empty state is in each chart status; a short history has no MA.
  expect((await request.post(`${control}/__rest/reset/empty`)).status()).toBe(200);
  await page.goto('/realtime');
  for (const chart of [1, 2, 3, 4]) {
    await expect(
      page.getByRole('region', { name: `Chart ${String(chart)}`, exact: true }).getByRole('status'),
    ).toHaveText('No candle history for this selection.');
  }
  expect((await request.post(`${control}/__rest/reset/short`)).status()).toBe(200);
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Chart 1', exact: true })
      .getByRole('group', { name: 'BTCUSDT 5m candlesticks, volume and MA(20)' }),
  ).toHaveAccessibleDescription(
    'Close 118.00 · Volume 28 · MA(20) Not enough data Left and Right arrows select a candle. Plus and minus zoom.',
  );
});

test('matches Chromium accessibility tree for the chart description and status', async ({
  page,
}) => {
  // MK-47, MK-48: Playwright computes role and name itself; compare with Chromium through CDP.
  await page.goto('/realtime');
  const chart = page.getByRole('region', { name: 'Chart 1', exact: true });
  const canvas = chart.getByRole('group', { name: 'BTCUSDT 5m candlesticks, volume and MA(20)' });
  const description =
    'Close 618.00 · Volume 528 · MA(20) 608.50 Left and Right arrows select a candle. Plus and minus zoom.';
  await expect(canvas).toHaveAccessibleDescription(description);
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  async function axNode(selector: string) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
      nodeId,
      fetchRelatives: false,
    });
    const node = nodes[0];
    // CDP types AXValue.value as any; role, name, description and live are strings.
    const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
    return {
      role: text(node?.role?.value),
      name: text(node?.name?.value),
      description: text(node?.description?.value),
      live: text(node?.properties?.find((property) => property.name === 'live')?.value.value),
    };
  }
  expect(await axNode('[aria-label="Chart 1"] [role="group"]')).toMatchObject({
    role: 'group',
    name: 'BTCUSDT 5m candlesticks, volume and MA(20)',
    description,
  });
  expect(await axNode('[aria-label="Chart 1"] [role="status"]')).toMatchObject({
    role: 'status',
    live: 'polite',
  });
  await cdp.detach();
});

test('shows the values of the gap and rising and falling fixtures from real history', async ({
  page,
  request,
}) => {
  // MK-35, MK-36: gap fixture has 20 real candles; MA uses the 20 real closes (2200 / 20). The drawn
  // gap and the hollow rising and filled falling candles (MK-49) are in the browser screenshots.
  expect((await request.post(`${control}/__rest/reset/gap`)).status()).toBe(200);
  await page.goto('/realtime');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 120.00 · Volume 30 · MA(20) 110.00',
  );
  expect((await request.post(`${control}/__rest/reset/flat`)).status()).toBe(200);
  await page.reload();
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 100.00 · Volume 5 · MA(20) 100.05',
  );
});

test('retries the sidebar alone and keeps focus in the sidebar', async ({ page, request }) => {
  // MK-18, MK-46: only the 24h summary fails; the charts keep their data and are not reloaded.
  expect((await request.post(`${control}/__rest/reset/summary-error`)).status()).toBe(200);
  await page.goto('/realtime');
  const sidebar = page.getByRole('region', { name: 'Market summary', exact: true });
  await expect(sidebar.getByRole('status')).toHaveText('Cannot load the market summary.');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.50');
  expect((await request.post(`${control}/__rest/reset/full`)).status()).toBe(200);
  await sidebar.getByRole('button', { name: 'Retry summary', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('618.13 USDT');
  await expect(sidebar).toBeFocused();
  expect((await ledger(request)).ledger.filter((url) => url.includes('/klines'))).toHaveLength(0);
});
