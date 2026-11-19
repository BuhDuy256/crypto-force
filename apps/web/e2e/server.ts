// Starts one E2E server: `node --import tsx e2e/server.ts <main|withoutGoogle>`.
// Playwright runs this from `playwright.config.ts`; you do not run it by hand.
//
// Steps:
// 1. Drop and create the database of this server, then apply the migrations, so every run starts
//    with no accounts.
// 2. Start `pnpm dev` (web, API, worker) with the ports and settings of `E2E_SERVERS` in
//    `environment.ts`. Resend is turned off, so the API prints each email to its console.
// 3. Copy the console to the `consoleLog` file of the server. Specs read links from that file.
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { E2E_SERVERS, type E2eServer, e2eDatabase, originOf } from './environment';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const shell = process.platform === 'win32';

const name = process.argv[2] ?? 'main';
if (!(name in E2E_SERVERS)) {
  throw new Error(
    `Unknown E2E server "${name}". Use one of: ${Object.keys(E2E_SERVERS).join(', ')}.`,
  );
}
const server: E2eServer = E2E_SERVERS[name as keyof typeof E2E_SERVERS];

async function recreateDatabase() {
  const { adminUrl, url, name: database } = e2eDatabase(server);
  const quoted = `"${database.replaceAll('"', '""')}"`;
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${quoted}`);
  } finally {
    await admin.end();
  }
  const migration = spawnSync('pnpm', ['db:migrate'], {
    cwd: root,
    shell,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
  if (migration.status !== 0) throw new Error(`Migration of the database ${database} failed.`);
  return url;
}

const databaseUrl = await recreateDatabase();
mkdirSync(dirname(server.consoleLog), { recursive: true });
const consoleLog = createWriteStream(server.consoleLog, { flags: 'w' });

const apiOrigin = `http://localhost:${String(server.apiPort)}`;
const child = spawn('pnpm', ['dev'], {
  cwd: root,
  shell,
  // A variable set here wins over the same variable in .env, also when the value is empty.
  env: {
    ...process.env,
    NODE_ENV: 'development',
    DATABASE_URL: databaseUrl,
    WEB_PORT: String(server.webPort),
    VITE_CACHE_DIR: `node_modules/.vite-e2e-${name}`,
    API_PORT: String(server.apiPort),
    API_PROXY_TARGET: apiOrigin,
    BETTER_AUTH_URL: originOf(server),
    GOOGLE_CLIENT_ID: server.google ? 'e2e-google-client-id' : '',
    GOOGLE_CLIENT_SECRET: server.google ? 'e2e-google-client-secret' : '',
    RESEND_API_KEY: '',
    EMAIL_FROM: '',
  },
});

for (const stream of [child.stdout, child.stderr]) {
  stream.on('data', (chunk: Buffer) => {
    consoleLog.write(chunk);
    process.stdout.write(chunk);
  });
}

const stop = () => {
  child.kill();
  consoleLog.end();
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
child.on('exit', (code) => {
  consoleLog.end();
  process.exit(code ?? 0);
});
