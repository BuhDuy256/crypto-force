import { existsSync } from 'node:fs';

const envFile = new URL('../../../.env', import.meta.url);

/** URL of the throwaway integration-test database, derived from DATABASE_URL. */
export function getTestDatabaseUrl() {
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');

  const adminUrl = new URL(databaseUrl);
  const testUrl = new URL(databaseUrl);
  testUrl.pathname = `${adminUrl.pathname}_test`;
  return {
    adminUrl: adminUrl.toString(),
    testUrl: testUrl.toString(),
    name: testUrl.pathname.slice(1),
  };
}
