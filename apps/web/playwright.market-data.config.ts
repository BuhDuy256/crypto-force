import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/market-data',
  outputDir: 'test-results/market-data',
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'ui',
      testMatch: 'realtime.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5183',
        serviceWorkers: 'block',
      },
    },
    {
      name: 'msw',
      testMatch: 'msw-smoke.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5184',
        serviceWorkers: 'allow',
      },
    },
  ],
  webServer: [5183, 5184].map((port) => ({
    command: 'pnpm dev',
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      WEB_PORT: String(port),
      API_PROXY_TARGET: 'http://127.0.0.1:1',
      VITE_API_MOCKING: port === 5184 ? 'true' : 'false',
      VITE_CACHE_DIR: `node_modules/.vite-market-data-${port}`,
    },
  })),
});
