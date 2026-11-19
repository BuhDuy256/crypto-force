import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

export function mockWorker(): Plugin {
  return {
    name: 'development-mock-worker',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/mockServiceWorker.js', (_request, response) => {
        response.setHeader('Content-Type', 'text/javascript');
        response.setHeader('Cache-Control', 'no-store');
        response.end(readFileSync(require.resolve('msw/mockServiceWorker.js')));
      });
    },
  };
}
