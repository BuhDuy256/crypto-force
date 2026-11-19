import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';
// E2E tests start a second copy of the app on another port (apps/web/e2e/environment.ts).
const port = Number(process.env.WEB_PORT ?? 5173);

export default defineConfig({
  // Each copy needs its own cache: when one copy optimizes dependencies, a shared cache makes the
  // other copy reload its open pages.
  ...(process.env.VITE_CACHE_DIR ? { cacheDir: process.env.VITE_CACHE_DIR } : {}),
  plugins: [tailwindcss(), reactRouter()],
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
