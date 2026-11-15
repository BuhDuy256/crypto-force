// Zero-dependency static server for the Crypto Force design prototype.
// Usage: node docs/design/prototype/serve.mjs   (PORT and HOST env vars are optional)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || '127.0.0.1';
const notFoundScreen = join(root, 'screens', 'NotFound.dc.html');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function send(res, status, body, type) {
  // no-cache: edits to screens show up on a plain reload.
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

const server = createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    send(res, 400, 'Bad request', 'text/plain; charset=utf-8');
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/favicon.ico') {
    send(res, 204, '', 'text/plain; charset=utf-8');
    return;
  }

  const file = resolve(root, '.' + pathname);
  if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }

  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
    send(res, 200, await readFile(file), contentTypes[extname(file).toLowerCase()] || 'application/octet-stream');
  } catch {
    // An unknown screen URL renders the prototype's own 404 screen.
    if (pathname.startsWith('/screens/') && pathname.endsWith('.html')) {
      send(res, 404, await readFile(notFoundScreen), contentTypes['.html']);
    } else {
      send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    }
  }
});

server.listen(port, host, () => {
  console.log(`Crypto Force prototype: http://${host}:${port}/`);
});
