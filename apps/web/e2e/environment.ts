// Where the E2E servers run and how a spec reaches their database.
//
// `playwright.config.ts` starts two copies of the app with `e2e/server.ts`. Each copy has its own
// ports and its own database, and prints emails to its console instead of sending them:
// - `main` has Google sign-in turned on. Almost every spec uses it.
// - `withoutGoogle` has Google sign-in turned off, for checks of the screens without Google.
// Both servers get every setting that a test depends on from this file, not from `.env`, so the
// result of a test does not change with the values in a developer's `.env`. `.env` gives only the
// PostgreSQL connection and the auth secret.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const envFile = new URL('../../../.env', import.meta.url);

export function loadEnv() {
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);
}

export interface E2eServer {
  webPort: number;
  apiPort: number;
  /** Turns Google sign-in on with fake client values. Tests never call the real Google. */
  google: boolean;
  /** Suffix added to POSTGRES_DB for the database of this server. */
  databaseSuffix: string;
  /** Copy of the server console. Specs read sign-up and reset links from it. */
  consoleLog: string;
}

const consoleLog = (name: string) =>
  fileURLToPath(new URL(`../.e2e-output/${name}`, import.meta.url));

export const E2E_SERVERS = {
  main: {
    webPort: 5173,
    apiPort: 3000,
    google: true,
    databaseSuffix: '_e2e',
    consoleLog: consoleLog('e2e-console.log'),
  },
  withoutGoogle: {
    webPort: 5174,
    apiPort: 3001,
    google: false,
    databaseSuffix: '_e2e_no_google',
    consoleLog: consoleLog('e2e-no-google-console.log'),
  },
} satisfies Record<string, E2eServer>;

export type E2eServerName = keyof typeof E2E_SERVERS;

export const originOf = (server: E2eServer) => `http://localhost:${String(server.webPort)}`;

export const APP_ORIGIN = originOf(E2E_SERVERS.main);
export const E2E_CONSOLE_LOG = E2E_SERVERS.main.consoleLog;

/** The database of one E2E server. It is never the dev database, so tests cannot change dev data. */
export function e2eDatabase(server: E2eServer = E2E_SERVERS.main) {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
  const adminUrl = new URL(databaseUrl);
  const url = new URL(databaseUrl);
  url.pathname = `${adminUrl.pathname}${server.databaseSuffix}`;
  return { adminUrl: adminUrl.toString(), url: url.toString(), name: url.pathname.slice(1) };
}

/** Runs SQL on the database of the main E2E server, to set up or read state a browser cannot. */
export async function query<Row extends pg.QueryResultRow>(sql: string, params: unknown[] = []) {
  const client = new pg.Client({ connectionString: e2eDatabase().url });
  await client.connect();
  try {
    return (await client.query<Row>(sql, params)).rows;
  } finally {
    await client.end();
  }
}

/** Secret the E2E server signs tokens with. Used only to build an expired verification link. */
export function authSecret() {
  loadEnv();
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set in .env.');
  return secret;
}
