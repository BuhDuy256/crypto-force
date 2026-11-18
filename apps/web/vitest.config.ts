import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Component tests of pure helpers in app/. The React Router Vite plugin is left out on purpose.
export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) } },
  test: { include: ['app/**/*.test.ts'] },
});
