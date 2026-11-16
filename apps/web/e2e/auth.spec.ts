// End-to-end checks for the Auth flow (docs/design/prototype/docs/requirements/authentication.md).
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import pg from 'pg';

const envFile = new URL('../../../.env', import.meta.url);

/** E2E tests cannot open the inbox, so the test confirms the email directly in the database. */
async function markEmailVerified(email: string) {
  if (!process.env.DATABASE_URL && existsSync(envFile)) process.loadEnvFile(envFile);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('UPDATE "user" SET email_verified = true WHERE email = $1', [email]);
  } finally {
    await client.end();
  }
}

test('create an account, confirm the email, then sign in and land on the pending page', async ({
  page,
}) => {
  const email = `e2e-${randomUUID()}@example.com`;
  const password = 'e2e-password-123';

  await page.goto('/sign-up?next=%2Frealtime');
  await page.getByLabel('Full name').fill('E2E User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('checkbox', { name: /I understand Crypto Force/ }).check();
  await page.getByRole('button', { name: 'Create account', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await markEmailVerified(email);

  // No session in this browser yet, so "continue" opens Sign in with the email filled in.
  await page.getByRole('button', { name: /I’ve confirmed, continue to Realtime/ }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Frealtime$/);
  await expect(page.getByLabel('Email')).toHaveValue(email);

  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page).toHaveURL(/\/realtime$/);
  await expect(page.getByText('Signed in as')).toContainText('E2E User');

  // Signed-in users skip Auth, and an outside `next` is ignored.
  await page.goto('/sign-in?next=https%3A%2F%2Fevil.example');
  await expect(page).toHaveURL(/\/realtime$/);
});

test('submitting an empty form lists the errors and focuses the first invalid field', async ({
  page,
}) => {
  await page.goto('/sign-in');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Fix 2 fields' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeFocused();
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');

  await page.getByRole('button', { name: /^Password:/ }).click();
  await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
});

test('arrow keys switch between the Sign in and Create account tabs and keep the email', async ({
  page,
}) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('keep@example.com');
  await page.getByRole('tab', { name: 'Sign in' }).focus();
  await page.keyboard.press('ArrowRight');

  await expect(page).toHaveURL(/\/sign-up$/);
  await expect(page.getByRole('tab', { name: 'Create account' })).toBeFocused();
  await expect(page.getByLabel('Email')).toHaveValue('keep@example.com');

  await page.keyboard.press('Home');
  await expect(page.getByRole('tab', { name: 'Sign in' })).toBeFocused();
});
