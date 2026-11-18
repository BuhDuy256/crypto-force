import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { getTestDatabaseUrl } from './test-database';

const sessionTokenLog = fileURLToPath(
  new URL('../test-results/session-tokens.log', import.meta.url),
);

/** Recreates the test database from the migrations so every run starts clean. */
export default async function setup() {
  // test/auth/token-entropy.test.ts reads every session token of this run from the log; start it empty.
  mkdirSync(dirname(sessionTokenLog), { recursive: true });
  writeFileSync(sessionTokenLog, '');

  const { adminUrl, testUrl, name } = getTestDatabaseUrl();
  const quotedName = `"${name.replaceAll('"', '""')}"`;

  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${quotedName} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${quotedName}`);
  } finally {
    await admin.end();
  }

  const pool = new pg.Pool({ connectionString: testUrl });
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
    });
  } finally {
    await pool.end();
  }
}
