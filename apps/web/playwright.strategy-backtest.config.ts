import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/strategy-backtest',
  outputDir: 'test-results/strategy-backtest',
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'ui',
      testMatch: 'states.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5185',
        serviceWorkers: 'block',
      },
    },
    {
      name: 'msw',
      testMatch: 'flows.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5186',
        serviceWorkers: 'allow',
      },
    },
  ],
  webServer: [5185, 5186].map((port) => ({
    command: 'pnpm dev',
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      WEB_PORT: String(port),
      API_PROXY_TARGET: 'http://127.0.0.1:1',
      VITE_API_MOCKING: port === 5186 ? 'true' : 'false',
      VITE_CACHE_DIR: `node_modules/.vite-strategy-backtest-${port}`,
    },
  })),
});
