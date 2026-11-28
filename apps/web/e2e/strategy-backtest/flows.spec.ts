import { expect, test, type BrowserContext, type Page } from '@playwright/test';

// Checks the Strategy Engine, Strategy Library, and Backtest screens through the development MSW
// worker, the same way apps/web/e2e/market-data/msw-smoke.spec.ts does. Only the auth session uses
// an HTTP double. Run with `playwright.strategy-backtest.config.ts` (`msw` project, port 5186).
// Expected values come from the Phase 1 task files in
// docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/.
// The assertions read the preview row headers, the library list and drawer, and the Backtest form,
// run card, results, and run detail that those handlers drive.

async function stubSession(context: BrowserContext): Promise<void> {
  await context.route('**/api/auth/get-session', (route) =>
    route.fulfill({
      json: {
        session: {
          id: 'strategy-session',
          userId: 'strategy-user',
          expiresAt: '2099-01-01T00:00:00Z',
          token: 'test',
        },
        user: {
          id: 'strategy-user',
          name: 'Strategy Reader',
          email: 'strategy@example.test',
          emailVerified: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
    }),
  );
}

async function openMocked(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

/**
 * The dev worker advances a running backtest by 35 points on every read of the run list, the
 * active run, and any run detail. Three reads finish a run before a person can see it. This gate
 * holds the watched-run detail and the later list and active polls, so the test can check the
 * running card and the AppHeader chip, and the conflict dialog can stay open until the cancel
 * request. The cancel response releases the held reads.
 */
async function holdNextRunDetail(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let armed = false;
    let newRunId: string | null = null;
    let holdPolls = false;
    let passReads = 0;
    let gate: Promise<void> | null = null;
    let releaseGate: (() => void) | null = null;
    const originalFetch = window.fetch.bind(window);

    function openGate(): void {
      gate = new Promise<void>((resolve) => {
        releaseGate = resolve;
      });
    }

    function release(): void {
      releaseGate?.();
      releaseGate = null;
      gate = null;
      holdPolls = false;
    }

    window.addEventListener('arm-run-detail-gate', () => {
      armed = true;
    });
    window.addEventListener('hold-run-polls', () => {
      if (gate === null) {
        holdPolls = true;
        openGate();
      }
    });
    window.addEventListener('release-run-detail-gate', release);

    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
      const path = new URL(url, window.location.origin).pathname;
      const readsDetail = method === 'GET' && /^\/api\/backtests\/R-\d+$/.test(path);
      const readsList = method === 'GET' && path === '/api/backtests';
      const readsActive = method === 'GET' && path === '/api/backtests/active';
      const holdsDetail = readsDetail && newRunId !== null && path === `/api/backtests/${newRunId}`;
      const holdsPoll = holdPolls && (readsList || readsActive);
      if (gate !== null && (holdsDetail || holdsPoll)) {
        await gate;
      }

      const response = await originalFetch(input, init);

      if (passReads > 0 && (readsList || readsActive)) {
        passReads -= 1;
        if (passReads === 0) holdPolls = true;
      }
      if (armed && method === 'POST' && path === '/api/backtests' && response.ok) {
        const body: unknown = await response.clone().json();
        if (
          typeof body === 'object' &&
          body !== null &&
          'id' in body &&
          typeof body.id === 'string'
        ) {
          newRunId = body.id;
          armed = false;
          passReads = 2;
          openGate();
        }
      }
      if (method === 'POST' && path.endsWith('/cancel') && response.ok) release();
      return response;
    };
  });
}

test('restores a draft, previews rules, and hands a saved strategy to Backtest', async ({
  page,
  context,
}) => {
  await stubSession(context);
  await openMocked(page, '/strategy');

  const prompt = page.getByLabel('Describe your trading strategy');
  await prompt.fill(
    'LONG when RSI(14) is below 30 and price closes under the lower Bollinger Band.',
  );

  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByText(/Restored your unsaved changes from/)).toBeVisible();
  await page.getByRole('button', { name: 'Discard draft' }).click();
  await expect(page.getByText(/Restored your unsaved changes from/)).toHaveCount(0);

  await prompt.fill(
    'LONG when RSI(14) is below 30 and price closes under the lower Bollinger Band.',
  );
  await page.getByRole('button', { name: 'Preview example rules' }).click();
  await expect(page.getByRole('rowheader', { name: 'Go long' })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Short condition (example)' })).toBeVisible();

  await page.getByRole('button', { name: 'Remove short example' }).click();
  await expect(page.getByRole('rowheader', { name: 'Short condition (example)' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('rowheader', { name: 'Short condition (example)' })).toBeVisible();

  await page.getByLabel('Name', { exact: true }).fill('E2E_RSI_Trend');
  await page.getByRole('button', { name: 'Save strategy' }).click();
  await page.getByRole('button', { name: 'Backtest it' }).click();

  await expect(page).toHaveURL(/\/backtest\?strategy=/);
  await expect(page.getByText(/Loaded E2E_RSI_Trend from Strategy Engine/)).toBeVisible();
});

test('filters, searches, renames, duplicates, deletes, and undoes a library item', async ({
  page,
  context,
}) => {
  await stubSession(context);
  await openMocked(page, '/library');

  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: 'Strategy Engine' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await page.getByRole('button', { name: /^Composites/ }).click();
  await expect(page.getByRole('button', { name: 'MA + RSI + S/R', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'RSI_BB_LB_LONG_SL2_TP4', exact: true }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: /^All/ }).click();
  await page.getByLabel('Search the library').fill('MACD');
  await expect(
    page.getByRole('button', { name: 'MACD_Cross_TrendFollow', exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Details for MACD_Cross_TrendFollow' }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('button', { name: 'Rename' }).click();
  await page.getByLabel('Name', { exact: true }).fill('MACD_Cross_V2');
  await page.getByLabel('Name', { exact: true }).press('Enter');
  await expect(drawer.getByRole('heading', { name: 'MACD_Cross_V2' })).toBeVisible();
  await expect(drawer.getByText('1.2.1', { exact: true })).toBeVisible();

  await drawer.getByRole('button', { name: 'Duplicate' }).click();
  await expect(drawer.getByRole('textbox')).toHaveValue('MACD_Cross_V2 (copy)');
  await expect(drawer.getByText('1.0.0', { exact: true })).toBeVisible();

  await drawer.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete “MACD_Cross_V2 (copy)”?' });
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Deleted MACD_Cross_V2 (copy).')).toBeVisible();
  await expect(page.getByRole('button', { name: 'MACD_Cross_V2 (copy)', exact: true })).toHaveCount(
    0,
  );

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(
    page.getByRole('button', { name: 'MACD_Cross_V2 (copy)', exact: true }),
  ).toBeVisible();
});

test('validates, handles an active-run conflict, pages trades, fails a short history, and shows drift', async ({
  page,
  context,
}) => {
  await stubSession(context);
  await holdNextRunDetail(page);
  await openMocked(page, '/backtest');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Backtest', exact: true }),
  ).toBeVisible();

  await page.getByLabel('To', { exact: true }).fill('2025-04-01');
  await page.getByLabel('Capital (USD)').fill('0');
  await page.getByRole('button', { name: 'Run backtest' }).click();
  await expect(page.getByText('Fix 2 field(s) above to run the backtest.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run backtest' })).toBeDisabled();

  await page.getByLabel('To', { exact: true }).fill('2025-05-15');
  await page.getByLabel('Capital (USD)').fill('100');
  await expect(page.getByRole('button', { name: 'Run backtest' })).toBeEnabled();

  await page.evaluate(() => {
    window.dispatchEvent(new Event('arm-run-detail-gate'));
  });
  await page.getByRole('button', { name: 'Run backtest' }).click();

  await expect(page.getByText('Running', { exact: true })).toBeVisible();
  const runningChip = page.getByRole('link', { name: /Open running backtest/ });
  await expect(runningChip).toContainText('Backtest');

  await page.evaluate(() => {
    window.dispatchEvent(new Event('release-run-detail-gate'));
  });
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();

  // A run started from the form is finished by the reads that follow it, so this test starts the
  // run that the conflict dialog reports through the same API the form uses.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('hold-run-polls'));
  });
  const hiddenStatus = await page.evaluate(async () => {
    const response = await fetch('/api/backtests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pair: 'BTCUSDT',
        timeframe: '5m',
        from: '2025-05-01',
        to: '2025-05-15',
        capitalUsd: 100,
        strategyName: 'MA Crossover',
        strategyId: null,
        feePercent: 0.08,
        slippageBps: 5,
      }),
    });
    return response.status;
  });
  expect(hiddenStatus).toBe(201);

  await page.getByRole('button', { name: 'Run backtest' }).click();
  await expect(page.getByRole('dialog', { name: 'A backtest is already running' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel it and run the new one' }).click();

  await expect(page.getByText(/Backtest R-\d+ started/)).toBeVisible();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();

  await expect(page.locator('.tv-lightweight-charts').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /TradingView/ }).first()).toBeVisible();
  await expect(page.getByText('Showing 1–10 of 30')).toBeVisible();
  await page.getByLabel('Rows per page').selectOption('25');
  await expect(page.getByText('Showing 1–25 of 30')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();

  await page.getByRole('tab', { name: /^Runs/ }).click();
  const runs = page.getByRole('region', { name: 'Runs' });
  await expect(
    runs.getByRole('listitem').filter({ hasText: 'MA Crossover' }).filter({ hasText: 'Cancelled' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Set up & run' }).click();

  await page.getByLabel('Pair', { exact: true }).selectOption('SOLUSDT');
  await page.getByLabel('From', { exact: true }).fill('2019-06-01');
  await page.getByRole('button', { name: 'Run backtest' }).click();
  await expect(page.getByText('Failed', { exact: true })).toBeVisible();
  await expect(page.getByText(/11 Aug 2020/)).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Strategy Engine' })
    .click();
  await page.getByRole('link', { name: /Strategy library/ }).click();
  await page.getByRole('button', { name: 'Details for RSI_BB_LB_LONG_SL2_TP4' }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete “RSI_BB_LB_LONG_SL2_TP4”?' });
  await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('button', { name: 'RSI_BB_LB_LONG_SL2_TP4' })).toHaveCount(0);

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Backtest' })
    .click();
  await page.getByRole('tab', { name: /^Runs/ }).click();
  const failedRun = page
    .getByRole('region', { name: 'Runs' })
    .getByRole('listitem')
    .filter({ hasText: 'RSI_BB_LB_LONG_SL2_TP4' })
    .filter({ hasText: 'Failed' });
  await failedRun.getByRole('button', { name: /^Open run/ }).click();

  await expect(page).toHaveURL(/[?&]run=/);
  await expect(page.getByText(/is no longer in your library/)).toBeVisible();
  await expect(
    page.getByText(
      'LONG when RSI(14) is below 30 and the close is under the lower Bollinger Band (20, 2)',
    ),
  ).toBeVisible();
});
