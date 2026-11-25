import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/market-data',
  testMatch: 'websocket-live.spec.ts',
  outputDir: 'test-results/market-data-ws',
  workers: 1,
  retries: 0,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5186',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter @crypto-force/api exec tsx test/support/market-data-ws-server.ts',
      cwd: '../..',
      url: 'http://127.0.0.1:3017/api/health',
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:5186',
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        WEB_PORT: '5186',
        API_PROXY_TARGET: 'http://127.0.0.1:3017',
        VITE_API_MOCKING: 'false',
        VITE_CACHE_DIR: 'node_modules/.vite-market-data-ws',
      },
    },
  ],
});
