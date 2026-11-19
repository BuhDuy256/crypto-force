// Helpers for the auth specs: test accounts, the session of a browser, emails read from the E2E
// server console, links (also expired or changed ones), form locators, and the `test` fixture that
// gives each test its own client IP.
// Accounts and expired links are made through the API or the database, because only the step under
// test must go through the UI. Do not import app source code here: if a test needs a state that
// the app gives no way to reach, change the test environment in `e2e/environment.ts`.
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Locator,
  expect,
  type Page,
  request,
  test as base,
} from '@playwright/test';
import { createEmailVerificationToken } from 'better-auth/api';
import { APP_ORIGIN, authSecret, E2E_CONSOLE_LOG, query } from '../environment';

/** Passwords of the test accounts. None is on the common-password list. */
export const PASSWORD = 'Correct-Horse-91';
export const NEW_PASSWORD = 'New-Horse-92';
export const OTHER_PASSWORD = 'Other-Horse-93';
export const WRONG_PASSWORD = 'Wrong-Horse-00';

export const MESSAGES = {
  mismatch: 'That email and password don’t match.',
  emailRequired: 'Enter your email address.',
  emailFormat: 'That doesn’t look like an email address. Check for a missing @ or domain.',
  passwordRequired: 'Enter your password.',
  nameRequired: 'Enter your full name.',
  nameMax: 'Use 100 characters or fewer.',
  passwordMin: 'Use at least 8 characters.',
  passwordMax: 'Use 128 characters or fewer.',
  confirm: 'Please confirm to create your account.',
  fillBoth: 'Fill in both fields.',
  noMatch: 'The two passwords don’t match.',
} as const;

let ipCounter = 0;

/** A client IP of its own for every browser context and API context. */
export function freshIp() {
  ipCounter += 1;
  const worker = Number(process.env.TEST_WORKER_INDEX ?? 0);
  return `10.${String(100 + worker)}.${String(ipCounter >> 8)}.${String(ipCounter & 255)}`;
}

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export function newUser(label = 'e2e'): TestUser {
  return { name: 'E2E User', email: `${label}-${randomUUID()}@example.com`, password: PASSWORD };
}

/** An API client with its own IP, so setup requests never count against the test's IP. */
export async function apiClient(ip = freshIp()) {
  return request.newContext({
    baseURL: APP_ORIGIN,
    extraHTTPHeaders: { Origin: APP_ORIGIN, 'x-forwarded-for': ip },
  });
}

async function post(api: APIRequestContext, path: string, data: object) {
  const response = await api.post(path, { data });
  expect(response.status(), `${path} → ${String(response.status())}`).toBe(200);
  return response;
}

/** An account whose email is not verified; its link is in the console. */
export async function createUnverifiedUser(label = 'unverified', callbackURL = '/sign-in') {
  const user = newUser(label);
  const api = await apiClient();
  await post(api, '/api/auth/sign-up/email', { ...user, callbackURL });
  await api.dispose();
  return user;
}

/** A verified email/password account. */
export async function createVerifiedUser(label = 'verified') {
  const user = await createUnverifiedUser(label);
  await query('UPDATE "user" SET email_verified = true WHERE email = $1', [user.email]);
  return user;
}

/** Signs `user` in through the API and gives the session cookie to the browser context. */
export async function signInAs(context: BrowserContext, user: TestUser, remember = true) {
  const api = await apiClient();
  await post(api, '/api/auth/sign-in/email', {
    email: user.email,
    password: user.password,
    rememberMe: remember,
  });
  const { cookies } = await api.storageState();
  await api.dispose();
  await context.addCookies(cookies);
}

export async function sessionEmail(api: APIRequestContext) {
  const response = await api.get('/api/auth/get-session');
  const body = (await response.json()) as { user: { email: string } } | null;
  return body?.user.email ?? null;
}

/** Asks the server for the session of a session cookie value: its email when the server accepts it, null when not. */
export async function sessionAcceptedFor(cookieValue: string) {
  const api = await request.newContext({
    baseURL: APP_ORIGIN,
    extraHTTPHeaders: { cookie: `better-auth.session_token=${cookieValue}`, Origin: APP_ORIGIN },
  });
  const email = await sessionEmail(api);
  await api.dispose();
  return email;
}

export async function sessionCookie(context: BrowserContext) {
  const cookies = await context.cookies();
  return cookies.find((cookie) => cookie.name.endsWith('session_token'));
}

export async function passwordWorks(email: string, password: string) {
  const api = await apiClient();
  const response = await api.post('/api/auth/sign-in/email', { data: { email, password } });
  await api.dispose();
  return response.status() === 200;
}

interface ConsoleEmail {
  to: string;
  subject: string;
  text: string;
}

/** Terminal color codes that pnpm may add to the console lines. */
const ANSI_COLOR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/** Emails printed by the API console mailer, oldest first. The E2E server has no Resend key, so it prints emails. */
export function consoleEmails(): ConsoleEmail[] {
  const raw = readFileSync(E2E_CONSOLE_LOG, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(ANSI_COLOR, '').replace(/^\S+ dev: /, ''))
    .join('\n');
  return raw
    .split('--- Email (not sent) ---')
    .slice(1)
    .map((block) => {
      const body = block.split('------------------------')[0] ?? '';
      const to = /^To: (.+)$/m.exec(body)?.[1]?.trim() ?? '';
      const subject = /^Subject: (.+)$/m.exec(body)?.[1]?.trim() ?? '';
      return { to, subject, text: body };
    });
}

export function emailsTo(address: string) {
  return consoleEmails().filter((email) => email.to.toLowerCase() === address.toLowerCase());
}

export async function waitForEmail(to: string, subject: string, count = 1) {
  let found: ConsoleEmail | undefined;
  await expect
    .poll(
      () => {
        found = emailsTo(to).filter((email) => email.subject.includes(subject))[count - 1];
        return found !== undefined;
      },
      { message: `email "${subject}" #${String(count)} to ${to}`, timeout: 15_000 },
    )
    .toBe(true);
  return found as ConsoleEmail;
}

export function linkIn(email: ConsoleEmail) {
  const match = /https?:\/\/\S+/.exec(email.text);
  if (!match) throw new Error(`Email "${email.subject}" has no link`);
  return match[0];
}

export async function verificationLink(email: string, count = 1) {
  return linkIn(await waitForEmail(email, 'Confirm', count));
}

/** Sends a reset link through the API and returns it. */
export async function resetLink(email: string, count = 1) {
  const api = await apiClient();
  await post(api, '/api/auth/request-password-reset', { email, redirectTo: '/reset-password' });
  await api.dispose();
  return linkIn(await waitForEmail(email, 'Reset', count));
}

export function resetTokenOf(link: string) {
  return new URL(link).pathname.split('/').pop() ?? '';
}

/**
 * Moves the expiry of the reset link to the past in the database, as if the link were opened
 * 1 hour + 1 minute after sending. The browser cannot move the server clock.
 */
export async function expireResetLink(link: string) {
  await query(
    `UPDATE verification SET expires_at = now() - interval '1 minute' WHERE identifier = $1`,
    [`reset-password:${resetTokenOf(link)}`],
  );
}

/**
 * The same verification link signed with an expiry 1 minute in the past, as if opened
 * 1 hour + 1 minute after sending. The token format is Better Auth's (`createEmailVerificationToken`).
 */
export async function expiredVerificationLink(link: string) {
  const url = new URL(link);
  const token = url.searchParams.get('token') ?? '';
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'),
  ) as { email: string };
  url.searchParams.set(
    'token',
    await createEmailVerificationToken(authSecret(), payload.email, undefined, -60),
  );
  return url.toString();
}

export function tamperToken(link: string, where: 'query' | 'path') {
  const url = new URL(link);
  const flip = (value: string) => value.slice(0, -1) + (value.endsWith('A') ? 'B' : 'A');
  if (where === 'query') {
    url.searchParams.set('token', flip(url.searchParams.get('token') ?? ''));
  } else {
    const parts = url.pathname.split('/');
    parts[parts.length - 1] = flip(parts[parts.length - 1] ?? '');
    url.pathname = parts.join('/');
  }
  return url.toString();
}

export async function isEmailVerified(email: string) {
  const rows = await query<{ email_verified: boolean }>(
    'SELECT email_verified FROM "user" WHERE email = $1',
    [email],
  );
  return rows[0]?.email_verified;
}

export async function countUsers(email: string) {
  const rows = await query<{ count: string }>(
    'SELECT count(*) FROM "user" WHERE lower(email) = lower($1)',
    [email],
  );
  return Number(rows[0]?.count ?? 0);
}

/** Form helpers, by the labels on the Auth screens. */
export const authForm = (page: Page) => ({
  name: page.getByLabel('Full name'),
  email: page.getByLabel('Email', { exact: true }),
  password: page.getByLabel('Password', { exact: true }),
  newPassword: page.getByLabel('New password', { exact: true }),
  confirmPassword: page.getByLabel('Confirm new password'),
  remember: page.getByRole('checkbox', { name: 'Keep me signed in on this device' }),
  terms: page.getByRole('checkbox', { name: /I understand Crypto Force/ }),
  signIn: page.getByRole('button', { name: 'Sign in', exact: true }),
  createAccount: page.getByRole('button', { name: 'Create account', exact: true }),
  sendReset: page.getByRole('button', { name: 'Send reset link' }),
  saveNewPassword: page.getByRole('button', { name: 'Save new password' }),
});

export async function fillSignIn(page: Page, email: string, password: string, remember = true) {
  const form = authForm(page);
  await form.email.fill(email);
  await form.password.fill(password);
  if (!remember) await form.remember.uncheck();
  await form.signIn.click();
}

export async function fillSignUp(page: Page, user: TestUser) {
  const form = authForm(page);
  await form.name.fill(user.name);
  await form.email.fill(user.email);
  await form.password.fill(user.password);
  await form.terms.check();
  await form.createAccount.click();
}

export async function signOutFromMenu(page: Page, email: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: new RegExp(email) }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
}

export const realtimeHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Realtime', level: 1, exact: true });
export const backtestHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Backtest', level: 1, exact: true });
export const gateHeading = (page: Page, screen: string) =>
  page.getByRole('heading', { name: new RegExp(`^Sign in to open ${screen}`) });

/**
 * `test` with one client IP per test, sent on every request of the browser context.
 * A test case that needs an address from the documentation ranges sets `clientIp`.
 */
export const test = base.extend<{ clientIp: string }>({
  clientIp: ['', { option: true }],
  extraHTTPHeaders: async ({ clientIp }, provide) =>
    provide({ 'x-forwarded-for': clientIp || freshIp() }),
});

export { expect };

/** An account that signs in only with Google, inserted directly (no password). */
export async function createGoogleOnlyUser() {
  const id = randomUUID();
  const email = `g1-${id}@example.test`;
  await query(
    `INSERT INTO "user" (id, name, email, email_verified) VALUES ($1, 'Google User', $2, true)`,
    [id, email],
  );
  await query(
    `INSERT INTO account (id, account_id, provider_id, user_id) VALUES ($1, $2, 'google', $3)`,
    [randomUUID(), `google-sub-${id}`, id],
  );
  return email;
}

/** A browser context whose requests come from `ip`. */
export function contextWithIp(browser: Browser, ip = freshIp()) {
  return browser.newContext({ extraHTTPHeaders: { 'x-forwarded-for': ip } });
}

/** The visible message of a field, linked by aria-describedby. */
export async function fieldMessage(page: Page, field: Locator) {
  const id = await field.getAttribute('aria-describedby');
  if (!id) return null;
  const text = await page.locator(`#${id}`).textContent();
  return text?.trim() ?? null;
}

/** Origin header for direct API calls from a browser context (Better Auth origin check). */
export const APP_ORIGIN_HEADERS = { Origin: APP_ORIGIN };
