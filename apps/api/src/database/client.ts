import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index';

export function createDatabase(connectionString: string, options?: { max?: number }) {
  const pool = new pg.Pool({
    connectionString,
    ...(options?.max !== undefined ? { max: options.max } : {}),
  });
  const db = drizzle({ client: pool, schema, casing: 'snake_case' });
  return { db, pool };
}

export type Database = ReturnType<typeof createDatabase>['db'];
