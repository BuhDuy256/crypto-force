import { expect, test } from '@playwright/test';

// Checks the actual development worker and handlers. Only the auth session uses an HTTP double.
// Run with playwright.market-data.config.ts. Expected MA values come from the hand-calculated fixture case.
// Removing the registered handlers made this test fail.
test('loads the workspace and candle response through the development worker', async ({
  page,
  context,
}) => {
  await context.route('**/api/auth/get-session', (route) =>
    route.fulfill({
      json: {
        session: {
          id: 'smoke-session',
          userId: 'smoke-user',
          expiresAt: '2099-01-01T00:00:00Z',
          token: 'test',
        },
        user: {
          id: 'smoke-user',
          name: 'Market Reader',
          email: 'reader@example.test',
          emailVerified: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
    }),
  );
  await page.goto('/realtime');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(
    page.getByText('Development preview · Mock market data', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(4);
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('68,608.00 USDT');
  // MA and volume are shown on each chart, not in the sidebar (MK-29, MK-60).
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 68,608.00 · Volume 2,400 · MA(20) 67,971.50',
  );
  const result = await page.evaluate(async () => {
    const response = await fetch('/api/market-data/candles?pair=BTCUSDT&timeframe=1m');
    return { status: response.status, body: (await response.json()) as unknown };
  });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({
    pair: 'BTCUSDT',
    timeframe: '1m',
    warmupCount: 0,
    dataTime: 1799972640000,
  });
  await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
  await page.getByRole('option', { name: 'SOLUSDT', exact: true }).click();
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('153.60 USDT');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 153.60 · Volume 2,400 · MA(20) 152.18',
  );
  const invalid = await page.evaluate(async () => {
    const response = await fetch('/api/market-data/candles?pair=INVALID&timeframe=1m');
    return { status: response.status, body: (await response.json()) as unknown };
  });
  expect(invalid).toEqual({ status: 400, body: { message: 'Invalid market selection.' } });
});
