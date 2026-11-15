import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: { tsconfigPaths: true },
  server: {
    port: 5173,
    // The browser only talks to our backend; it never calls Binance directly.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true, ws: true },
    },
  },
});
