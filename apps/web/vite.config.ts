import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: { tsconfigPaths: true },
  server: {
    port: 5173,
    // Fail instead of moving to another port: Better Auth only trusts BETTER_AUTH_URL as origin,
    // so a second dev server on 5174 would reject sign-out and sign-in with 403.
    strictPort: true,
    // The browser only talks to our backend; it never calls Binance directly.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true, ws: true },
    },
  },
});
