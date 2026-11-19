// Harness for the auth API tests in `test/auth/`. `createHarness` builds the auth server with the
// same `createAuth` configuration as production, on the `<POSTGRES_DB>_test` database, and returns
// `call`, which sends one request to its handler as if it came from client IP `ip`.
// Also here: an in-memory mailer, a clock you can set (`controlClock`), test accounts, and helpers
// that read cookies, sessions, emails and links. Outbound HTTP calls go to `outbound.ts`.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pino, type Logger } from 'pino';
import { vi } from 'vitest';
import { createAuth, type Auth } from '../../src/configs/auth';
import { createDatabase } from '../../src/database/client';
import { createAuthEmails } from '../../src/services/auth-email.service';
import type { EmailMessage } from '../../src/services/mailer';
import { getTestDatabaseUrl } from '../test-database';
import { installFetchStub } from './outbound';

export const APP_URL = 'http://localhost:5173';
export const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';

/** Passwords of the test accounts. None is on the common-password list, so Create account accepts them. */
export const PASSWORD = 'Correct-Horse-91';
export const NEW_PASSWORD = 'New-Horse-92';
export const OTHER_PASSWORD = 'Other-Horse-93';
export const WRONG_PASSWORD = 'Wrong-Horse-00';

export const SESSION_COOKIE = 'better-auth.session_token';

const database = createDatabase(getTestDatabaseUrl().testUrl);
export const { db, pool } = database;

/** Mailer that keeps each email in memory instead of sending it. Set `failing` to make every send fail. */
export class MemoryMailer {
  readonly sent: EmailMessage[] = [];
  failing = false;

  send = (message: EmailMessage) => {
    if (this.failing) return Promise.reject(new Error('Mailer stub: send failed'));
    this.sent.push(message);
    return Promise.resolve();
  };

  to(address: string) {
    return this.sent.filter((item) => item.to.toLowerCase() === address.toLowerCase());
  }
}

export interface LogRecord {
  level: number;
  msg: string;
  [key: string]: unknown;
}

export const LOG_LEVEL = { warn: 40, error: 50 } as const;

function createCapturingLogger(): { logger: Logger; records: LogRecord[] } {
  const records: LogRecord[] = [];
  const logger = pino(
    { level: 'trace' },
    {
      write(line: string) {
        records.push(JSON.parse(line) as LogRecord);
      },
    },
  );
  return { logger, records };
}

export interface HarnessOptions {
  nodeEnv?: 'test' | 'production';
  google?: boolean;
}

export interface Harness {
  auth: Auth;
  mailer: MemoryMailer;
  logger: Logger;
  logs: LogRecord[];
  call: (path: string, options?: CallOptions) => Promise<Response>;
}

export interface CallOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  cookie?: string;
  ip?: string;
  headers?: Record<string, string>;
}

export const GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';

/** Builds one Better Auth instance with the product configuration (`createAuth`). */
export function createHarness(options: HarnessOptions = {}, mailer = new MemoryMailer()): Harness {
  installFetchStub();
  const { logger, records } = createCapturingLogger();
  const auth = createAuth({
    env: {
      NODE_ENV: options.nodeEnv ?? 'test',
      BETTER_AUTH_SECRET: TEST_SECRET,
      BETTER_AUTH_URL: APP_URL,
      GOOGLE_CLIENT_ID: options.google ? GOOGLE_CLIENT_ID : undefined,
      GOOGLE_CLIENT_SECRET: options.google ? 'test-client-secret' : undefined,
    },
    db,
    emails: createAuthEmails(mailer, APP_URL),
    logger,
  });

  const call = async (
    path: string,
    { method = 'POST', body, cookie, ip, headers }: CallOptions = {},
  ) => {
    const url = path.startsWith('http') ? path : `${APP_URL}/api/auth${path}`;
    const response = await auth.handler(
      new Request(url, {
        method,
        headers: {
          'content-type': 'application/json',
          origin: APP_URL,
          ...(ip ? { 'x-forwarded-for': ip } : {}),
          ...(cookie ? { cookie } : {}),
          ...headers,
        },
        body: body === undefined || method === 'GET' ? null : JSON.stringify(body),
        redirect: 'manual',
      }),
    );
    // get-session only re-sends the cookie of an existing session; every other path creates one.
    if (!url.includes('/get-session')) recordSessionTokens(response);
    return response;
  };

  return { auth, mailer, logger, logs: records, call };
}

/** TC-206: every session token issued during one `pnpm test` run, one per line. */
export const SESSION_TOKEN_LOG = fileURLToPath(
  new URL('../../test-results/session-tokens.log', import.meta.url),
);

function recordSessionTokens(response: Response) {
  for (const header of response.headers.getSetCookie()) {
    const match = /session_token=([^;]+)/.exec(header);
    const token = match?.[1] ? decodeURIComponent(match[1]).split('.')[0] : '';
    if (token) appendFileSync(SESSION_TOKEN_LOG, `${token}\n`);
  }
}

/** Turns Set-Cookie response headers into a Cookie request header. */
export function cookieFrom(response: Response, previous = '') {
  const jar = new Map<string, string>();
  for (const pair of previous.split('; ').filter(Boolean)) {
    const [name, ...rest] = pair.split('=');
    if (name) jar.set(name, rest.join('='));
  }
  for (const header of response.headers.getSetCookie()) {
    const [pair = ''] = header.split(';');
    const [name, ...rest] = pair.split('=');
    if (!name) continue;
    const value = rest.join('=');
    if (value === '' || /max-age=0/i.test(header)) jar.delete(name);
    else jar.set(name, value);
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}

/** Returns the raw Set-Cookie header of the session cookie, if the response sets one. */
export function sessionSetCookie(response: Response) {
  return response.headers
    .getSetCookie()
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`) || value.includes('.session_token='));
}

export function sessionToken(cookie: string) {
  const match = /session_token=([^;]+)/.exec(cookie);
  return match?.[1] ? decodeURIComponent(match[1]).split('.')[0] : undefined;
}

export interface SessionBody {
  session: { token: string; expiresAt: string; userId: string };
  user: { id: string; email: string; emailVerified: boolean };
}

/** Asks the server for the session of `cookie`: the body when the session is accepted, null when it is rejected. */
export async function getSession(h: Harness, cookie: string, ip?: string) {
  const response = await h.call('/get-session', { method: 'GET', cookie, ...(ip ? { ip } : {}) });
  return { response, body: (await response.json()) as SessionBody | null };
}

export async function waitForEmail(mailer: MemoryMailer, to: string, subject: string, count = 1) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const found = mailer.to(to).filter((item) => item.subject.includes(subject));
    if (found.length >= count) return found[count - 1] as EmailMessage;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Email "${subject}" #${String(count)} was not sent to ${to}`);
}

/** Waits long enough for a background send to finish, then returns what was sent. */
export async function settleEmails(mailer: MemoryMailer, to: string) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mailer.to(to);
}

export function linkIn(email: EmailMessage) {
  const match = /https?:\/\/\S+/.exec(email.text);
  if (!match) throw new Error('Email has no link');
  return match[0];
}

/** Token of a reset link: the auth server redirects the link to `/reset-password?token=`. */
export async function resetTokenFrom(h: Harness, link: string) {
  const response = await h.call(link, { method: 'GET' });
  const location = new URL(response.headers.get('location') ?? '', APP_URL);
  return location.searchParams.get('token');
}

export function uniqueEmail(label = 'user') {
  return `${label}-${crypto.randomUUID()}@example.com`;
}

/**
 * Client IP per test. Rate limits count requests per IP, so tests that share an IP change each
 * other's results. `rateLimitIps` gives addresses from the documentation ranges
 * 198.51.100.0/24 and 203.0.113.0/24 for the rate-limit test cases; `freshIp` gives private
 * addresses for every other request so they never share a rate-limit bucket.
 */
export function createIpPool(fileId: number) {
  let counter = 0;
  return () => {
    counter += 1;
    return `10.${String(fileId)}.${String(counter >> 8)}.${String(counter & 255)}`;
  };
}

export function rateLimitIps(range: '198.51.100' | '203.0.113', first = 1) {
  let next = first;
  return () => {
    if (next > 254) throw new Error(`IP range ${range}.0/24 is used up`);
    const ip = `${range}.${String(next)}`;
    next += 1;
    return ip;
  };
}

/**
 * Controls `Date`, so a test can move to the second just before or after a time limit (session
 * expiry, link expiry, rate-limit window). Timers stay real, so database calls still finish.
 */
export function controlClock(start = new Date('2026-11-20T00:00:00.000Z')) {
  vi.useFakeTimers({ toFake: ['Date'], now: start });
  const origin = start.getTime();
  return {
    origin,
    /** Sets the clock to `seconds` after the start of the test case (`t`). */
    at(seconds: number) {
      vi.setSystemTime(origin + seconds * 1000);
    },
    restore() {
      vi.useRealTimers();
    },
  };
}

export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export interface Account {
  email: string;
  password: string;
  cookie: string;
}

/** An email/password account whose email is not verified yet. */
export async function createUnverifiedAccount(
  h: Harness,
  ip: () => string,
  options: { email?: string; password?: string; callbackURL?: string } = {},
) {
  const email = options.email ?? uniqueEmail('unverified');
  const password = options.password ?? PASSWORD;
  const response = await h.call('/sign-up/email', {
    body: {
      name: 'Test User',
      email,
      password,
      callbackURL: options.callbackURL ?? '/sign-in',
    },
    ip: ip(),
  });
  if (response.status !== 200) {
    throw new Error(`Sign up for ${email} returned ${String(response.status)}`);
  }
  const verification = await waitForEmail(h.mailer, email, 'Confirm');
  return { email, password, link: linkIn(verification) };
}

/** A verified email/password account; `cookie` is the session from the verification link. */
export async function createVerifiedAccount(
  h: Harness,
  ip: () => string,
  options: { email?: string; password?: string } = {},
): Promise<Account> {
  const { email, password, link } = await createUnverifiedAccount(h, ip, options);
  const response = await h.call(link, { method: 'GET', ip: ip() });
  if (response.status !== 302) {
    throw new Error(`Verification link for ${email} returned ${String(response.status)}`);
  }
  return { email, password, cookie: cookieFrom(response) };
}

export async function signIn(
  h: Harness,
  email: string,
  password: string,
  ip: string,
  options: { rememberMe?: boolean; cookie?: string } = {},
) {
  const response = await h.call('/sign-in/email', {
    body: {
      email,
      password,
      ...(options.rememberMe === undefined ? {} : { rememberMe: options.rememberMe }),
    },
    ip,
    ...(options.cookie ? { cookie: options.cookie } : {}),
  });
  return { response, cookie: cookieFrom(response, options.cookie) };
}

export async function requestReset(h: Harness, email: string, ip: string) {
  return h.call('/request-password-reset', { body: { email, redirectTo: '/reset-password' }, ip });
}

/** Sends a reset link and returns its token. `count` is the n-th reset email to this address. */
export async function newResetToken(h: Harness, email: string, ip: string, count = 1) {
  const response = await requestReset(h, email, ip);
  if (response.status !== 200) {
    throw new Error(`Reset request for ${email} returned ${String(response.status)}`);
  }
  const link = linkIn(await waitForEmail(h.mailer, email, 'Reset', count));
  const token = await resetTokenFrom(h, link);
  if (!token) throw new Error('Reset link did not lead to a token');
  return token;
}

export function resetPassword(h: Harness, token: string, newPassword: string, ip: string) {
  return h.call('/reset-password', { body: { token, newPassword }, ip });
}

export async function countUsers(email: string) {
  const result = await pool.query<{ count: string }>(
    'SELECT count(*) FROM "user" WHERE lower(email) = lower($1)',
    [email],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function isEmailVerified(email: string) {
  const result = await pool.query<{ email_verified: boolean }>(
    'SELECT email_verified FROM "user" WHERE lower(email) = lower($1)',
    [email],
  );
  return result.rows[0]?.email_verified;
}

/** True when `password` signs `email` in (fresh IP, so the rate limit never interferes). */
export async function passwordWorks(h: Harness, email: string, password: string, ip: string) {
  const { response } = await signIn(h, email, password, ip);
  return response.status === 200;
}
