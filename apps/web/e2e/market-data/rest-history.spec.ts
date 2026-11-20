// Checks the browser -> real API -> adapter -> HTTP fake flow. MSW and response routing are disabled.
// Run: pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-rest.config.ts.
// Auth uses the dedicated _market_data_rest_test DB. Expected: docs/testing/test-scopes/TS-002-market-data/rest-verification.md fixtures and UI rules.
// Missing adapter code prevents startup. Fake/driver sensitivity and canvas/screen-reader checks remain unverified.
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const control = 'http://127.0.0.1:3016';
async function selectTimeframe(page: Page, chart: number, value: string) {
  await page.getByRole('combobox', { name: `Timeframe for chart ${chart}` }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

test.beforeEach(async ({ page, request }) => {
  expect((await request.post(`${control}/__rest/reset/full`)).status()).toBe(200);
  const email = `rest-${randomUUID()}@example.test`;
  const signup = await page.request.post('/api/auth/sign-up/email', {
    data: { name: 'Market Reader', email, password: 'Correct-Horse-91', callbackURL: '/realtime' },
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
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.5');
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
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.5');
  const before = (await (await request.get(`${control}/__rest/ledger`)).json()) as {
    ledger: string[];
  };
  await selectTimeframe(page, 1, '1d');
  await expect(page.getByRole('combobox', { name: 'Timeframe for chart 1' })).toHaveText('1d');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.5');
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
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('118');
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
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('718');
  await expect(page.getByLabel('Last price', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Pair', exact: true })).toHaveText('ETHUSDT');
  expect((await request.post(`${control}/__rest/release`)).status()).toBe(200);
});

test('isolates a chart error and recovers through its retry control', async ({ page, request }) => {
  expect((await request.post(`${control}/__rest/reset/chart-error`)).status()).toBe(200);
  await page.goto('/realtime');
  await expect(page.getByRole('button', { name: 'Retry chart 1', exact: true })).toBeVisible();
  await expect(page.getByLabel('Chart 2 values', { exact: true })).toContainText('608.5');
  await expect(page.getByLabel('Last price', { exact: true })).toBeVisible();
  await expect(page.getByText('Private upstream sentinel.', { exact: true })).toHaveCount(0);
  expect((await request.post(`${control}/__rest/reset/full`)).status()).toBe(200);
  await page.getByRole('button', { name: 'Retry chart 1', exact: true }).click();
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('608.5');
});

test('removes MA and volume from the summary sidebar', async ({ page }) => {
  await page.goto('/realtime');
  await expect(page.getByLabel('Last price', { exact: true })).toBeVisible();
  const sidebar = page.getByRole('region', { name: 'Market summary', exact: true });
  await expect(sidebar.getByText(/MA\(20\)|Volume/)).toHaveCount(0);
});
