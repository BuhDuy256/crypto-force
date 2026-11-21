import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Checks the chart through controlled HTTP responses, without a backend or service worker.
// Run with playwright.market-data.config.ts. Values come from the Step 2 sample case.
// Removing the chart made the render test fail. Disabling timeframe changes broke the cache test.
// Removing the grid or fixing chart width broke the resize test.
// Removing pair from the summary key broke the pair test. Keeping old candles broke the response-gate test.
// Returning empty success on HTTP failure broke the three error tests.
// The Retry button contrast defect made the accessibility test fail.
function requestGate() {
  let release: (() => void) | undefined;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    promise,
    resolve() {
      if (!release) throw new Error('The request gate is not ready.');
      release();
    },
  };
}
function candleResponse(url: string) {
  const params = new URL(url).searchParams;
  const pair = params.get('pair');
  const timeframe = params.get('timeframe');
  const base = pair === 'BTCUSDT' ? 100 : pair === 'ETHUSDT' ? 200 : 300;
  const interval =
    timeframe === '1m'
      ? 60_000
      : timeframe === '5m'
        ? 300_000
        : timeframe === '15m'
          ? 900_000
          : timeframe === '1h'
            ? 3_600_000
            : 14_400_000;
  const volumeStep = timeframe === '5m' ? 60 : 30;
  return {
    pair,
    timeframe,
    candles: Array.from({ length: 20 }, (_, index) => ({
      openTime: 1799971200000 + index * interval,
      open: base + index,
      high: base + index + 2,
      low: base + index - 1,
      close: base + index + 1,
      volume: (index + 1) * volumeStep,
    })),
    ma20: [{ openTime: 1799971200000 + 19 * interval, value: base + 10.5 }],
  };
}
test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/get-session', (route) =>
    route.fulfill({
      json: {
        session: {
          id: 'mock-session',
          userId: 'mock-user',
          expiresAt: '2099-01-01T00:00:00Z',
          token: 'test',
        },
        user: {
          id: 'mock-user',
          name: 'Market Reader',
          email: 'reader@example.test',
          emailVerified: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
    }),
  );
  await page.route('**/api/market-data/candles?*', (route) =>
    route.fulfill({ json: candleResponse(route.request().url()) }),
  );
  await page.route('**/api/market-data/summary?*', (route) => {
    const pair = new URL(route.request().url()).searchParams.get('pair');
    return route.fulfill({
      json: {
        pair,
        lastPrice: pair === 'BTCUSDT' ? 123 : pair === 'ETHUSDT' ? 234 : 345,
        change24hPercent: pair === 'ETHUSDT' ? -1.25 : 2.4,
      },
    });
  });
});

test('renders the chart and TradingView attribution', async ({ page }) => {
  await page.goto('/realtime');
  await expect(page.getByLabel('BTCUSDT 1m candlesticks, volume and MA(20)')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /TradingView/ }).first()).toBeVisible();
});

async function selectTimeframe(page: Page, chart: number, value: string) {
  await page.getByRole('combobox', { name: `Timeframe for chart ${chart}` }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

test('keeps hidden timeframes and shares a request for matching selections', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/market-data/candles?')) requests.push(request.url());
  });
  await page.goto('/realtime');
  await expect(page.getByRole('region', { name: /^Chart \d$/ })).toHaveCount(4);
  await expect(page.getByLabel('BTCUSDT 1h candlesticks, volume and MA(20)')).toBeVisible();
  const chart1 = await page
    .getByRole('region', { name: 'Chart 1', exact: true })
    .locator('.tv-lightweight-charts')
    .elementHandle();
  const cdp = await page.context().newCDPSession(page);
  async function listenerCounts() {
    const result = await cdp.send('Runtime.evaluate', {
      expression:
        'JSON.stringify([window, document].map(target => Object.fromEntries(Object.entries(getEventListeners(target)).map(([name, listeners]) => [name, listeners.length]))))',
      includeCommandLineAPI: true,
      returnByValue: true,
    });
    return result.result.value as unknown;
  }
  const listenersBefore = await listenerCounts();
  requests.length = 0;
  await selectTimeframe(page, 2, '4h');
  await expect(page.getByLabel('BTCUSDT 4h candlesticks, volume and MA(20)')).toBeVisible();
  expect(requests.map((url) => new URL(url).searchParams.get('timeframe'))).toEqual(['4h']);
  expect(await chart1.evaluate((node) => node.isConnected)).toBe(true);
  await selectTimeframe(page, 3, '4h');
  await expect(page.getByLabel('BTCUSDT 4h candlesticks, volume and MA(20)')).toHaveCount(2);
  expect(requests).toHaveLength(1);
  await page.getByRole('radio', { name: '1 chart', exact: true }).click();
  await expect(page.getByRole('region', { name: /^Chart \d$/ })).toHaveCount(1);
  await page.getByRole('radio', { name: '4 charts', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Timeframe for chart 2' })).toHaveText('4h');
  await expect(page.getByRole('combobox', { name: 'Timeframe for chart 3' })).toHaveText('4h');
  expect(requests).toHaveLength(1);
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(4);
  expect(await listenerCounts()).toEqual(listenersBefore);
  await cdp.detach();
});

test('resizes the grid and supports keyboard timeframe selection on mobile', async ({ page }) => {
  await page.goto('/realtime');
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(4);
  const chart = page
    .getByRole('region', { name: 'Chart 1', exact: true })
    .locator('.tv-lightweight-charts');
  const chartBefore = await chart.boundingBox();
  const before = await page.getByRole('region', { name: 'Chart 1', exact: true }).boundingBox();
  await page.getByRole('radio', { name: '1 chart', exact: true }).click();
  const single = await page.getByRole('region', { name: 'Chart 1', exact: true }).boundingBox();
  expect(single?.width).toBeGreaterThan(before?.width ?? 0);
  await expect
    .poll(async () => (await chart.boundingBox())?.width ?? 0)
    .toBeGreaterThan(chartBefore?.width ?? 0);
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('radio', { name: '4 charts', exact: true }).click();
  const first = await page.getByRole('region', { name: 'Chart 1', exact: true }).boundingBox();
  const second = await page.getByRole('region', { name: 'Chart 2', exact: true }).boundingBox();
  expect(second?.y).toBeGreaterThan(first?.y ?? 0);
  expect(second?.x).toBe(first?.x);
  await expect
    .poll(async () => (await chart.boundingBox())?.width ?? Infinity)
    .toBeLessThanOrEqual(first?.width ?? 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const selector = page.getByRole('combobox', { name: 'Timeframe for chart 1' });
  await selector.focus();
  await expect(selector).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('option', { name: '1m', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.getByRole('option', { name: '4h', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(selector).toHaveText('4h');
  await expect(page.getByLabel('BTCUSDT 4h candlesticks, volume and MA(20)')).toBeVisible();
});

async function selectPair(page: Page, pair: string) {
  await page.getByRole('combobox', { name: 'Pair', exact: true }).click();
  await page.getByRole('option', { name: pair, exact: true }).click();
}

test('updates all charts and keeps summary independent of the first timeframe', async ({
  page,
}) => {
  const summaryRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/market-data/summary?')) summaryRequests.push(request.url());
  });
  await page.goto('/realtime');
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('123.00 USDT');
  summaryRequests.length = 0;
  await selectPair(page, 'ETHUSDT');
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('234.00 USDT');
  await expect(page.getByLabel('Change 24h', { exact: true })).toHaveText('-1.25%');
  for (const timeframe of ['1m', '5m', '15m', '1h']) {
    await expect(
      page.getByLabel(`ETHUSDT ${timeframe} candlesticks, volume and MA(20)`),
    ).toBeVisible();
  }
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 220.00 · Volume 600 · MA(20) 210.50',
  );
  await expect(page.getByLabel('Summary MA20', { exact: true })).toHaveText('210.5');
  await selectTimeframe(page, 1, '5m');
  await expect(page.getByLabel('Summary volume', { exact: true })).toHaveText('1,200');
  await expect(page.getByRole('heading', { name: 'Chart 1 · 5m', exact: true })).toBeVisible();
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('234.00 USDT');
  await expect(page.getByLabel('Change 24h', { exact: true })).toHaveText('-1.25%');
  expect(summaryRequests).toHaveLength(1);
});

test('keeps the new pair when an older response is released last', async ({ page }) => {
  const gate = requestGate();
  const received = requestGate();
  const released = requestGate();
  await page.route('**/api/market-data/candles?*', async (route) => {
    const pair = new URL(route.request().url()).searchParams.get('pair');
    if (pair === 'ETHUSDT') {
      received.resolve();
      await gate.promise;
    }
    await route.fulfill({ json: candleResponse(route.request().url()) });
    if (pair === 'ETHUSDT') released.resolve();
  });
  await page.goto('/realtime');
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('123.00 USDT');
  await selectPair(page, 'ETHUSDT');
  await received.promise;
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('234.00 USDT');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveCount(0);
  await selectPair(page, 'SOLUSDT');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 320.00 · Volume 600 · MA(20) 310.50',
  );
  gate.resolve();
  await released.promise;
  await expect(page.getByLabel('SOLUSDT 1m candlesticks, volume and MA(20)')).toBeVisible();
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('345.00 USDT');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 320.00 · Volume 600 · MA(20) 310.50',
  );
});

test('isolates slow, empty, invalid and failed candle responses and retries one key', async ({
  page,
}) => {
  const gate = requestGate();
  let recover = false;
  const requests: string[] = [];
  await page.route('**/api/market-data/candles?*', async (route) => {
    const timeframe = new URL(route.request().url()).searchParams.get('timeframe');
    requests.push(timeframe ?? '');
    if (timeframe === '1m') await gate.promise;
    if (timeframe === '5m')
      return route.fulfill({ json: { pair: 'BTCUSDT', timeframe: '5m', candles: [], ma20: [] } });
    if (timeframe === '15m') return route.fulfill({ json: { invalid: 'internal payload' } });
    if (timeframe === '1h' && !recover)
      return route.fulfill({ status: 503, json: { stack: 'internal stack' } });
    return route.fulfill({ json: candleResponse(route.request().url()) });
  });
  await page.goto('/realtime');
  const first = page.getByRole('region', { name: 'Chart 1', exact: true });
  await expect(first.getByText('Loading candles…', { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Chart 2', exact: true })
      .getByText('No candle history for this selection.', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Chart 3', exact: true })
      .getByText('Cannot load candle history.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry chart 4', exact: true })).toBeVisible();
  await expect(page.getByText(/internal payload|internal stack/)).toHaveCount(0);
  gate.resolve();
  await expect(page.getByLabel('BTCUSDT 1m candlesticks, volume and MA(20)')).toBeVisible();
  recover = true;
  requests.length = 0;
  await page.getByRole('button', { name: 'Retry chart 4', exact: true }).click();
  await expect(page.getByLabel('BTCUSDT 1h candlesticks, volume and MA(20)')).toBeVisible();
  expect(requests).toEqual(['1h']);
  await expect(first.getByText('Data loaded · 1m', { exact: true })).toBeVisible();
});

test('keeps candles after a failed refresh and handles missing MA and summary errors', async ({
  page,
}) => {
  let failRefresh = false;
  const requests: string[] = [];
  await page.route('**/api/market-data/candles?*', (route) => {
    const timeframe = new URL(route.request().url()).searchParams.get('timeframe');
    requests.push(timeframe ?? '');
    if (timeframe === '1m' && failRefresh)
      return route.fulfill({ status: 500, json: { message: 'internal payload' } });
    const data = candleResponse(route.request().url());
    return route.fulfill({ json: { ...data, candles: data.candles.slice(0, 3), ma20: [] } });
  });
  await page.route('**/api/market-data/summary?*', (route) =>
    route.fulfill({ status: 503, json: { stack: 'internal stack' } }),
  );
  await page.goto('/realtime');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 103.00 · Volume 90 · MA(20) Not enough data',
  );
  await expect(page.getByLabel('Summary MA20', { exact: true })).toHaveText('Not enough data');
  await expect(page.getByLabel('Summary volume', { exact: true })).toHaveText('90');
  await expect(page.getByText('Cannot load the market summary.', { exact: true })).toBeVisible();
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(4);
  failRefresh = true;
  requests.length = 0;
  await page.getByRole('button', { name: 'Load history for chart 1', exact: true }).click();
  await expect(
    page.getByText('Could not refresh candles. Previous data remains visible.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toHaveText(
    'Close 103.00 · Volume 90 · MA(20) Not enough data',
  );
  await expect(
    page.getByText('Chart information refresh failed. Previous values remain visible.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(requests).toEqual(['1m']);
  await page.route('**/api/market-data/summary?*', (route) =>
    route.fulfill({ json: { pair: 'BTCUSDT', lastPrice: 123, change24hPercent: 2.4 } }),
  );
  await page.getByRole('button', { name: 'Retry summary', exact: true }).click();
  await expect(page.getByLabel('Last price', { exact: true })).toHaveText('123.00 USDT');
  expect(requests).toEqual(['1m']);
});

test('has no serious accessibility violations at desktop, tablet, mobile or error state', async ({
  page,
}) => {
  await page.goto('/realtime');
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(4);
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical',
      ),
    ).toEqual([]);
  }
  await page.route('**/api/market-data/candles?*', (route) =>
    route.fulfill({ status: 500, json: {} }),
  );
  await page.getByRole('button', { name: 'Load history for chart 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry chart 1', exact: true })).toBeVisible();
  const errors = await new AxeBuilder({ page }).analyze();
  expect(
    errors.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    ),
  ).toEqual([]);
});

test('shows the upstream failure without fixtures when the mock flag is off', async ({ page }) => {
  await page.unroute('**/api/market-data/candles?*');
  await page.unroute('**/api/market-data/summary?*');
  const response = page.waitForResponse((response) =>
    response.url().includes('/api/market-data/candles?'),
  );
  await page.goto('/realtime');
  expect((await response).status()).toBe(502);
  await expect(
    page
      .getByRole('region', { name: 'Chart 1', exact: true })
      .getByText('Cannot load candle history.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tv-lightweight-charts')).toHaveCount(0);
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
});
