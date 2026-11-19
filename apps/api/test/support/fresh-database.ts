// A throwaway database built from the migrations only, for checks that need an untouched schema
// (TC-204). It is separate from `<POSTGRES_DB>_test`, which other test files fill with accounts.
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { getTestDatabaseUrl } from '../test-database';

export async function withFreshDatabase<T>(run: (client: pg.Client) => Promise<T>): Promise<T> {
  const { adminUrl, testUrl, name } = getTestDatabaseUrl();
  const freshName = `${name}_fresh`;
  const quoted = `"${freshName.replaceAll('"', '""')}"`;
  const freshUrl = new URL(testUrl);
  freshUrl.pathname = `/${freshName}`;

  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${quoted}`);
    const migratePool = new pg.Pool({ connectionString: freshUrl.toString() });
    try {
      await migrate(drizzle({ client: migratePool }), {
        migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
      });
    } finally {
      await migratePool.end();
    }
    const client = new pg.Client({ connectionString: freshUrl.toString() });
    await client.connect();
    try {
      return await run(client);
    } finally {
      await client.end();
    }
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
    await admin.end();
  }
}
