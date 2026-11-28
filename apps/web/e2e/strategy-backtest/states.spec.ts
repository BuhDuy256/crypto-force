import { expect, test, type BrowserContext } from '@playwright/test';

// Checks the loading, empty, error, and retry states of the Strategy Engine, Strategy Library, and
// Backtest screens through controlled HTTP responses. These tests run without a backend and
// without the MSW worker (`ui` project, port 5185, service workers blocked), so each request the
// screen needs is answered here. Run with `playwright.strategy-backtest.config.ts`.
// Expected text comes from the Phase 1 task files in
// docs/build/01-prototype-to-implementation/strategy-backtest/implementation/plan/.
// The delayed list responses produce the skeleton states; the 500 responses produce the alerts.
// The preview double returns a suggested name, and the preview test checks that the Name field
// shows it. A mutant run on 2026-11-28 that leaves the Name field empty made that test fail.

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

const serverError = {
  status: 500,
  json: { error: { code: 'INTERNAL_ERROR', message: 'The service is unavailable.' } },
};

const strategyItem = {
  id: 'st-e2e-contrast',
  kind: 'strategy',
  name: 'E2E_Contrast',
  source: 'Written by you',
  inputMode: 'prompt',
  prompt: 'Buy when RSI(14) is below 30.',
  url: null,
  tags: ['RSI'],
  version: '1.0.0',
  createdAt: '2025-05-20T10:42:00.000Z',
  updatedAt: '2025-05-20T10:42:00.000Z',
  rules: ['LONG when RSI(14) is below 30'],
  blocks: null,
  voteMethod: null,
  weights: null,
  lastRunSummary: null,
};

const completedRun = {
  id: 'e2e-run-2001',
  status: 'completed',
  progressPercent: 100,
  strategyId: null,
  strategyName: 'MA Crossover',
  strategyVersion: 'built-in',
  strategyKind: 'builtin',
  rules: ['LONG when MA(20) crosses above MA(50)'],
  pair: 'BTCUSDT',
  timeframe: '5m',
  from: '2025-05-01',
  to: '2025-05-15',
  capitalUsd: 100,
  feePercent: 0.08,
  slippageBps: 5,
  startedAt: '2025-05-20T10:42:00.000Z',
  endedAt: '2025-05-20T10:42:12.000Z',
  resultLabel: '+8.42% · max DD −3.03%',
  failureReason: null,
};

const preview = {
  inputMode: 'prompt',
  source: 'Written by you',
  rules: ['LONG when RSI(14) is below 30', 'Stop loss 2% below entry'],
  hasShortExample: false,
  shortRuleText: 'No SHORT rule in this example.',
  riskSummary: 'Stop loss 2%',
  assumedTimeframe: '1h',
  assumedPairs: 'All USDT pairs, spot',
  assumptions: ['No timeframe given, so we used 1h.'],
  definitionJson: '{"name":"E2E_Contrast","version":"1.0.0"}',
  checks: [{ title: 'Required fields', detail: 'None missing', passed: true }],
  suggestedName: 'E2E_Contrast',
  suggestedTags: ['RSI'],
};

async function stubSession(context: BrowserContext): Promise<void> {
  await context.route('**/api/auth/get-session', (route) =>
    route.fulfill({
      json: {
        session: {
          id: 'states-session',
          userId: 'states-user',
          expiresAt: '2099-01-01T00:00:00Z',
          token: 'test',
        },
        user: {
          id: 'states-user',
          name: 'States Reader',
          email: 'states@example.test',
          emailVerified: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
    }),
  );
}

test('shows the library loading, empty, error, and retry states', async ({ page, context }) => {
  await stubSession(context);
  await page.route('**/api/backtests/active', (route) => route.fulfill({ json: { run: null } }));
  let mode: 'gate' | 'empty' | 'error' | 'ok' = 'gate';
  const gate = requestGate();
  await page.route('**/api/strategies', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    if (mode === 'gate') await gate.promise;
    if (mode === 'error') return route.fulfill(serverError);
    if (mode === 'ok') return route.fulfill({ json: { items: [strategyItem], totalCount: 1 } });
    return route.fulfill({ json: { items: [], totalCount: 0 } });
  });

  await page.goto('/library');
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  mode = 'empty';
  gate.resolve();
  await expect(page.getByText('Your library is empty')).toBeVisible();

  mode = 'error';
  await page.reload();
  await expect(page.getByText('Could not load your library')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Retry' });
  await expect(retry).toBeVisible();
  mode = 'ok';
  await retry.click();
  await expect(page.getByRole('button', { name: 'E2E_Contrast', exact: true })).toBeVisible();
});

test('shows the backtest runs loading, empty, error, and retry states', async ({
  page,
  context,
}) => {
  await stubSession(context);
  await page.route('**/api/strategies', (route) =>
    route.fulfill({ json: { items: [], totalCount: 0 } }),
  );
  await page.route('**/api/backtests/active', (route) => route.fulfill({ json: { run: null } }));
  let mode: 'gate' | 'empty' | 'error' | 'ok' = 'gate';
  const gate = requestGate();
  await page.route('**/api/backtests', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    if (mode === 'gate') await gate.promise;
    if (mode === 'error') return route.fulfill(serverError);
    if (mode === 'ok') return route.fulfill({ json: { runs: [completedRun] } });
    return route.fulfill({ json: { runs: [] } });
  });

  await page.goto('/backtest');
  await page.getByRole('tab', { name: /^Runs/ }).click();
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  mode = 'empty';
  gate.resolve();
  await expect(page.getByText('No runs yet')).toBeVisible();

  mode = 'error';
  await page.reload();
  await page.getByRole('tab', { name: /^Runs/ }).click();
  await expect(page.getByText('Could not load your backtest runs')).toBeVisible();
  mode = 'ok';
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('button', { name: 'Open run e2e-run-2001' })).toBeVisible();
});

test('shows a preview error and retries the preview', async ({ page, context }) => {
  await stubSession(context);
  await page.route('**/api/strategies', (route) =>
    route.fulfill({ json: { items: [], totalCount: 0 } }),
  );
  await page.route('**/api/backtests/active', (route) => route.fulfill({ json: { run: null } }));
  let mode: 'error' | 'ok' = 'error';
  await page.route('**/api/strategies/preview', (route) => {
    if (mode === 'error') return route.fulfill(serverError);
    return route.fulfill({ json: preview });
  });

  await page.goto('/strategy');
  await page.getByLabel('Describe your trading strategy').fill('LONG when RSI(14) is below 30.');
  await page.getByRole('button', { name: 'Preview example rules' }).click();
  await expect(page.getByText('Preview failed')).toBeVisible();

  mode = 'ok';
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('rowheader', { name: 'Go long' })).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('E2E_Contrast');
});
