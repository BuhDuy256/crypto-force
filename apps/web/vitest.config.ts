import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Component tests of pure helpers and development fixtures. The React Router Vite plugin is left out on purpose.
export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) } },
  // A test without an assertion cannot fail; Vitest fails it.
  test: {
    include: ['app/**/*.test.ts', 'mocks/**/*.test.ts'],
    expect: { requireAssertions: true },
  },
});
