// Checks core WebSocket E2E flows through real API, Better Auth and _market_data_ws_test DB:
// live candle/summary updates with zero extra API REST calls, timeframe and pair isolation,
// pause/resume (0 WS while paused, REST-only switches), upstream unavailable and partial backfill
// recovery, multi-tab independence with 4-tab limit (4429) and sign-out revocation (4401), plus
// invalid tick rejection, focus retention, live region quietness and absence of ms latency badge.
// Stale/reset (15s/30s), 120s retry cap and multi-disconnect OHLCV reconciliation are expanded in
// the build step once the UI transport is wired. Only upstream Binance HTTP/WS are faked.
// Run: pnpm --filter @crypto-force/web exec playwright test --config playwright.market-data-ws.config.ts --workers=1.
// Expected values: docs/testing/test-scopes/TS-002-market-data/websocket-verification.md.
// Pre-build red state: API test server cannot start yet because WebSocket modules are not built.
// Fault checks (gate for build step): omitting live updates, reporting live before backfill finishes,
// leaking upstream sentinel text or allowing tab 5 must fail these assertions.
import { randomInt, randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const control = 'http://127.0.0.1:3018';
const password = 'Correct-Horse-91';
// Matches REPLAY_NOW in market-data-ws-server.ts: openTime of the 519th 5m candle.
const OPEN_5M_TIME = 1735845000000;
const OPEN_15M_TIME = 1735844400000;

test.beforeEach(async ({ page, request }) => {
  expect((await request.post(`${control}/__ws/reset`)).status()).toBe(200);
  const email = `ws-${randomUUID()}@example.test`;
  const ip = `10.${String(randomInt(256))}.${String(randomInt(256))}.${String(randomInt(1, 255))}`;
  const signup = await page.request.post('/api/auth/sign-up/email', {
    headers: { 'x-forwarded-for': ip },
    data: { name: 'Live Reader', email, password, callbackURL: '/realtime' },
  });
  expect(signup.status()).toBe(200);
  let messages: string[] = [];
  await expect
    .poll(async () => {
      messages = (await (await request.get(`${control}/__ws/mail`)).json()) as string[];
      return messages.some((text) => text.includes('/verify-email?'));
    })
    .toBe(true);
  const link = messages.at(-1)?.match(/https?:\/\/[^\s]+\/verify-email\?[^\s]+/)?.[0];
  if (!link) throw new Error('The test server did not capture a verification link.');
  const verification = await page.request.get(link, { maxRedirects: 0 });
  expect(verification.status()).toBe(302);
});

test.afterEach(async ({ request }) => {
  const ledger = (await (await request.get(`${control}/__ws/ledger`)).json()) as {
    unexpected: string[];
  };
  expect(ledger.unexpected).toEqual([]);
});

async function emitUpstream(request: APIRequestContext, body: unknown) {
  expect((await request.post(`${control}/__ws/emit`, { data: body })).status()).toBe(200);
}

async function readLedger(request: APIRequestContext) {
  return (await (await request.get(`${control}/__ws/ledger`)).json()) as {
    apiRestRequests: string[];
    restLedger: string[];
    activeClientWs: number;
  };
}

async function selectTimeframe(page: Page, chart: number, value: string) {
  await page.getByRole('combobox', { name: `Timeframe for chart ${String(chart)}` }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

async function selectPair(page: Page, value: string) {
  await page.getByRole('combobox', { name: 'Pair' }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}

async function openRealtimeLive(page: Page) {
  await page.goto('/realtime');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('618.00');
  await expect(page.getByLabel('Last price', { exact: true })).toContainText('618.00');
  await expect(page.getByTestId('realtime-connection-status')).toContainText(
    /Live|Đang trực tiếp/i,
  );
}

test('updates open candle, sidebar ticker and closes a candle without extra API REST requests', async ({
  page,
  request,
}) => {
  await openRealtimeLive(page);
  const initialApiRestCount = (await readLedger(request)).apiRestRequests.length;

  await emitUpstream(request, {
    stream: 'btcusdt@kline_5m',
    data: {
      e: 'kline',
      E: OPEN_5M_TIME + 50_000,
      s: 'BTCUSDT',
      k: {
        t: OPEN_5M_TIME,
        i: '5m',
        o: '618.00',
        h: '625.50',
        l: '617.00',
        c: '624.25',
        v: '540.5',
        x: true,
      },
    },
  });
  await emitUpstream(request, {
    stream: 'btcusdt@ticker',
    data: { e: '24hrTicker', E: OPEN_5M_TIME + 50_100, s: 'BTCUSDT', c: '624.25', P: '1.50' },
  });

  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('624.25');
  await expect(page.getByLabel('Last price', { exact: true })).toContainText('624.25');
  expect((await readLedger(request)).apiRestRequests.length).toBe(initialApiRestCount);
});

test('switches one chart timeframe without interrupting other charts and discards stale pair ticks before applying new pair ticks', async ({
  page,
  request,
}) => {
  await openRealtimeLive(page);

  await selectTimeframe(page, 1, '1m');
  await emitUpstream(request, {
    stream: 'btcusdt@kline_15m',
    data: {
      e: 'kline',
      E: OPEN_5M_TIME + 60_000,
      s: 'BTCUSDT',
      k: {
        t: OPEN_15M_TIME,
        i: '15m',
        o: '618.00',
        h: '630.00',
        l: '617.00',
        c: '629.50',
        v: '541',
        x: false,
      },
    },
  });
  await expect(page.getByLabel('Chart 2 values', { exact: true })).toContainText('629.50');

  await selectPair(page, 'ETHUSDT');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('718.00');

  // Emit a stale BTCUSDT tick followed by a valid ETHUSDT tick to prove ordered delivery and rejection.
  await emitUpstream(request, {
    stream: 'btcusdt@kline_1m',
    data: {
      e: 'kline',
      E: OPEN_5M_TIME + 65_000,
      s: 'BTCUSDT',
      k: {
        t: OPEN_5M_TIME + 240_000,
        i: '1m',
        o: '618.00',
        h: '619.00',
        l: '617.00',
        c: '618.75',
        v: '528',
        x: false,
      },
    },
  });
  await emitUpstream(request, {
    stream: 'ethusdt@kline_1m',
    data: {
      e: 'kline',
      E: OPEN_5M_TIME + 65_100,
      s: 'ETHUSDT',
      k: {
        t: OPEN_5M_TIME + 240_000,
        i: '1m',
        o: '718.00',
        h: '726.00',
        l: '717.00',
        c: '725.50',
        v: '529',
        x: false,
      },
    },
  });
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('725.50');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).not.toContainText('618.75');
});

test('closes WebSocket on pause without disconnect alerts, uses REST only while paused, and starts sync on resume', async ({
  page,
  request,
}) => {
  await openRealtimeLive(page);
  await page.getByRole('button', { name: /Pause|Tạm dừng/i }).click();
  await expect(page.getByTestId('realtime-connection-status')).toContainText(/Paused|Đã tạm dừng/i);
  await expect.poll(async () => (await readLedger(request)).activeClientWs).toBe(0);

  // Upstream drop while paused must not show a disconnect warning.
  expect((await request.post(`${control}/__ws/upstream-drop`)).status()).toBe(200);
  await expect(page.getByTestId('realtime-connection-status')).toContainText(/Paused|Đã tạm dừng/i);

  // Switching timeframe while paused calls REST for 1m and opens 0 WebSocket connections.
  const restBeforeSwitch = (await readLedger(request)).apiRestRequests.length;
  await selectTimeframe(page, 1, '1m');
  await expect
    .poll(async () => {
      const ledger = await readLedger(request);
      return (
        ledger.activeClientWs === 0 &&
        ledger.apiRestRequests
          .slice(restBeforeSwitch)
          .some((url) => url.includes('/candles') && url.includes('timeframe=1m'))
      );
    })
    .toBe(true);
  await expect(page.getByTestId('realtime-connection-status')).toContainText(/Paused|Đã tạm dừng/i);

  // Resuming opens WebSocket and starts backfill within 1000 ms, then returns to live.
  const restBeforeResume = (await readLedger(request)).apiRestRequests.length;
  await page.getByRole('button', { name: /Resume|Tiếp tục/i }).click();
  await expect
    .poll(async () => (await readLedger(request)).apiRestRequests.length, { timeout: 1000 })
    .toBeGreaterThan(restBeforeResume);
  await expect(page.getByTestId('realtime-connection-status')).toContainText(
    /Live|Đang trực tiếp/i,
  );
});

test('shows unavailable on upstream drop without sentinel details, shows syncing while REST backfill is held, and recovers after partial backfill failure', async ({
  page,
  request,
}) => {
  await openRealtimeLive(page);

  // Clear cache and hold backfill so reconnect backfill hits the held REST gate deterministically.
  expect(
    (
      await request.post(`${control}/__ws/rest-control`, {
        data: { clearCache: true, holdBackfill: true },
      })
    ).status(),
  ).toBe(200);
  expect((await request.post(`${control}/__ws/upstream-drop`)).status()).toBe(200);

  // First: upstream unavailable must not leak sentinel text.
  await expect(page.getByTestId('realtime-connection-status')).not.toContainText(
    'Private upstream sentinel.',
  );
  // Once upstream reconnects while backfill is held, status must be strictly Syncing (not Live).
  await expect(page.getByTestId('realtime-connection-status')).toContainText(
    /Syncing|Đang đồng bộ/i,
  );
  await expect(page.getByTestId('realtime-connection-status')).not.toContainText(
    /Live|Đang trực tiếp/i,
  );

  // Fail 5m backfill to verify partial sync warning while retaining existing data.
  expect(
    (
      await request.post(`${control}/__ws/rest-control`, {
        data: { clearCache: true, failTimeframe: '5m', holdBackfill: false },
      })
    ).status(),
  ).toBe(200);
  await expect(page.getByTestId('realtime-connection-status')).toContainText(
    /Sync incomplete|Đồng bộ chưa xong/i,
  );
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('618.00');

  // Manual resync recovers once 5m succeeds again.
  expect(
    (
      await request.post(`${control}/__ws/rest-control`, {
        data: { clearCache: true, failTimeframe: null },
      })
    ).status(),
  ).toBe(200);
  await page.getByRole('button', { name: /Resync|Đồng bộ lại/i }).click();
  await expect(page.getByTestId('realtime-connection-status')).toContainText(
    /Live|Đang trực tiếp/i,
  );
});

test('keeps two tabs independent, warns on the 5th tab without disconnecting tabs 1 to 4, and blocks all tabs on sign-out', async ({
  context,
  page,
}) => {
  await openRealtimeLive(page);

  const tabs: Page[] = [page];
  for (let index = 0; index < 3; index += 1) {
    const extra = await context.newPage();
    await openRealtimeLive(extra);
    tabs.push(extra);
  }

  // Tab 2 switching pair must not change Tab 1.
  const secondTab = tabs[1];
  if (!secondTab) throw new Error('Expected a second Realtime tab.');
  await selectPair(secondTab, 'ETHUSDT');
  await expect(secondTab.getByLabel('Chart 1 values', { exact: true })).toContainText('718.00');
  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('618.00');

  // Tab 5 hits the 4-tab per-account limit without interrupting tabs 1-4.
  const fifth = await context.newPage();
  await fifth.goto('/realtime');
  await expect(fifth.getByTestId('realtime-connection-status')).toContainText(/limit|giới hạn/i);
  await expect(page.getByTestId('realtime-connection-status')).toContainText(
    /Live|Đang trực tiếp/i,
  );
  await fifth.close();

  // Signing out closes all remaining tabs within 5s and shows sign-in gate.
  const signOut = await page.request.post('/api/auth/sign-out', {
    headers: { origin: 'http://localhost:5186' },
    data: {},
  });
  expect(signOut.status()).toBe(200);
  for (const tab of tabs) {
    await expect(tab.getByRole('heading', { name: /Sign in/i })).toBeVisible({ timeout: 5000 });
  }
});

test('drops invalid candle and summary ticks before applying a valid tick, preserves focus, keeps status region quiet on ticks and hides ms latency', async ({
  page,
  request,
}) => {
  await openRealtimeLive(page);
  const pauseButton = page.getByRole('button', { name: /Pause|Tạm dừng/i });
  await pauseButton.focus();

  await page.evaluate(() => {
    const region = document.querySelector('[role="status"], [role="alert"]');
    (window as unknown as { __statusChanges?: number }).__statusChanges = 0;
    if (region) {
      new MutationObserver(() => {
        (window as unknown as { __statusChanges: number }).__statusChanges += 1;
      }).observe(region, { childList: true, characterData: true, subtree: true });
    }
  });

  // Invalid candle (high < low) and invalid summary (lastPrice = 0), followed by a valid 5m tick.
  await emitUpstream(request, {
    stream: 'btcusdt@kline_5m',
    data: {
      e: 'kline',
      E: OPEN_5M_TIME + 70_000,
      s: 'BTCUSDT',
      k: {
        t: OPEN_5M_TIME,
        i: '5m',
        o: '620.00',
        h: '615.00',
        l: '621.00',
        c: '620.00',
        v: '10',
        x: false,
      },
    },
  });
  await emitUpstream(request, {
    stream: 'btcusdt@ticker',
    data: { e: '24hrTicker', E: OPEN_5M_TIME + 70_100, s: 'BTCUSDT', c: '0', P: '1.25' },
  });
  await emitUpstream(request, {
    stream: 'btcusdt@kline_5m',
    data: {
      e: 'kline',
      E: OPEN_5M_TIME + 70_200,
      s: 'BTCUSDT',
      k: {
        t: OPEN_5M_TIME,
        i: '5m',
        o: '618.00',
        h: '623.00',
        l: '617.00',
        c: '622.50',
        v: '535',
        x: false,
      },
    },
  });

  await expect(page.getByLabel('Chart 1 values', { exact: true })).toContainText('622.50');
  await expect(page.getByLabel('Last price', { exact: true })).toContainText('618.00');
  await expect(pauseButton).toBeFocused();
  await expect(page.getByTestId('realtime-connection-status')).not.toContainText(/\d+\s*ms/i);
  const statusMutations = await page.evaluate(
    () => (window as unknown as { __statusChanges?: number }).__statusChanges ?? -1,
  );
  expect(statusMutations).toBe(0);
});
