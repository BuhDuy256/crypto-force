import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import { mockWorker } from './mocks/vite.ts';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';
// E2E tests start a second copy of the app on another port (apps/web/e2e/environment.ts).
const port = Number(process.env.WEB_PORT ?? 5173);

export default defineConfig({
  // Each copy needs its own cache: when one copy optimizes dependencies, a shared cache makes the
  // other copy reload its open pages.
  ...(process.env.VITE_CACHE_DIR ? { cacheDir: process.env.VITE_CACHE_DIR } : {}),
  envDir: '../..',
  plugins: [
    tailwindcss(),
    reactRouter(),
    mockWorker(),
    {
      name: 'reject-production-mocks',
      apply: 'build',
      configResolved(config) {
        if (config.publicDir && existsSync(join(config.publicDir, 'mockServiceWorker.js'))) {
          throw new Error('Remove public/mockServiceWorker.js. Serve the MSW worker only in dev.');
        }
      },
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.fileName.endsWith('mockServiceWorker.js')) {
            this.error('Remove mockServiceWorker.js from production assets. Serve it only in dev.');
          }
          if (output.type !== 'chunk') continue;
          for (const id of Object.keys(output.modules)) {
            if (/[\\/]mocks[\\/]|[\\/]node_modules[\\/](?:\.pnpm[\\/])?msw(?:@|[\\/])/.test(id)) {
              this.error(
                `Remove mock code from production: ${id}. See docs/conventions/code.md#http-mocking.`,
              );
            }
          }
        }
      },
    },
  ],
  // Find every dependency at startup. Otherwise Vite finds some only when a page first uses them,
  // optimizes again and reloads every open page; E2E tests on an empty cache then see blank pages.
  optimizeDeps: { entries: ['app/**/*.{ts,tsx}', '!app/**/*.test.{ts,tsx}'] },
  resolve: { tsconfigPaths: true },
  server: {
    port,
    // Transform the screens at startup, so the first visit to a screen is not seconds slower.
    warmup: { clientFiles: ['./app/root.tsx', './app/routes/**/*.tsx'] },
    // Fail instead of moving to another port: Better Auth only trusts BETTER_AUTH_URL as origin,
    // so a second dev server on 5174 would reject sign-out and sign-in with 403.
    strictPort: true,
    // The browser only talks to our backend; it never calls Binance directly.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true, ws: true },
    },
  },
});
