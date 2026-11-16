// Helpers shared by E2E specs. They reach into the dev database because a browser test cannot open
// an inbox, and because every test needs its own session without tripping the sign-in rate limit.
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import pg from 'pg';

const envFile = new URL('../../../.env', import.meta.url);
const origin = 'http://localhost:5173';

async function query(sql: string, params: unknown[] = []) {
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql, params);
  } finally {
    await client.end();
  }
}

export function markEmailVerified(email: string) {
  return query('UPDATE "user" SET email_verified = true WHERE email = $1', [email]);
}

/** Sign-in is limited per IP (23-security.md); tests all come from 127.0.0.1. */
export function resetRateLimits() {
  return query('DELETE FROM rate_limit');
}

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export function newTestUser(): TestUser {
  return {
    name: 'E2E User',
    email: `e2e-${randomUUID()}@example.com`,
    password: 'e2e-password-123',
  };
}

async function post(request: APIRequestContext, path: string, data: object) {
  const response = await request.post(path, { data, headers: { Origin: origin } });
  expect(response.ok(), `${path} → ${response.status()}`).toBe(true);
}

/** Creates a verified account and signs it in for the page's browser context. */
export async function signInNewUser(page: Page): Promise<TestUser> {
  const user = newTestUser();
  await resetRateLimits();
  await post(page.request, '/api/auth/sign-up/email', user);
  await markEmailVerified(user.email);
  await post(page.request, '/api/auth/sign-in/email', {
    email: user.email,
    password: user.password,
    rememberMe: true,
  });
  return user;
}

/** Sign-in form submit for tests that go through the UI. */
export async function submitSignIn(page: Page, user: TestUser) {
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
