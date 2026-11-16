import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    // Integration tests share one database; run files one after another.
    fileParallelism: false,
    env: { NODE_ENV: 'test' },
  },
});
