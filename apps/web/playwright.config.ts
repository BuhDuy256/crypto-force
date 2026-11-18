import { defineConfig, devices } from '@playwright/test';
import { APP_ORIGIN, E2E_SERVERS, originOf } from './e2e/environment';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // No retry: a test that passes only on the second try hides a real problem.
  retries: 0,
  // Several workers share one dev server; screens can take longer than the 5 s default.
  expect: { timeout: 10_000 },
  timeout: 60_000,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: APP_ORIGIN,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Two copies of the app (see e2e/environment.ts), each on a fresh database and with emails
  // printed to the console instead of sent. PostgreSQL must already be running (`pnpm db:up`).
  // A server already on one of the ports is not reused: `pnpm dev` uses the dev database and may
  // send real emails.
  webServer: Object.entries(E2E_SERVERS).map(([name, server]) => ({
    command: `node --import tsx e2e/server.ts ${name}`,
    url: originOf(server),
    reuseExistingServer: false,
    timeout: 180_000,
  })),
});
