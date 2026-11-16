// Integration tests for the auth rules in R-13 (docs/testing/test-strategy.md) and
// docs/design/prototype/docs/requirements/authentication.md, run against PostgreSQL.
import { randomUUID } from 'node:crypto';
import { pino } from 'pino';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createAuth, SIGN_IN_RATE_LIMIT } from '../src/configs/auth';
import { createDatabase } from '../src/database/client';
import { createAuthEmails } from '../src/services/auth-email.service';
import type { EmailMessage } from '../src/services/mailer';
import { getTestDatabaseUrl } from './test-database';

const APP_URL = 'http://localhost:5173';
const sentEmails: EmailMessage[] = [];
const { db, pool } = createDatabase(getTestDatabaseUrl().testUrl);
const logger = pino({ level: 'silent' });

function buildAuth(nodeEnv: 'test' | 'production' = 'test') {
  return createAuth({
    env: {
      NODE_ENV: nodeEnv,
      BETTER_AUTH_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      BETTER_AUTH_URL: APP_URL,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    },
    db,
    emails: createAuthEmails(
      {
        send: (message) => {
          sentEmails.push(message);
          return Promise.resolve();
        },
      },
      APP_URL,
    ),
    logger,
  });
}

const auth = buildAuth();

interface CallOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  cookie?: string;
  ip?: string;
}

function call(path: string, { method = 'POST', body, cookie, ip = '10.0.0.1' }: CallOptions = {}) {
  const url = path.startsWith('http') ? path : `${APP_URL}/api/auth${path}`;
  return auth.handler(
    new Request(url, {
      method,
      headers: {
        'content-type': 'application/json',
        origin: APP_URL,
        'x-forwarded-for': ip,
        ...(cookie ? { cookie } : {}),
      },
      body: body === undefined ? null : JSON.stringify(body),
    }),
  );
}

/** Turns Set-Cookie response headers into a Cookie request header. */
function cookieFrom(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

async function waitForEmail(to: string, subject: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const email = sentEmails.find((item) => item.to === to && item.subject.includes(subject));
    if (email) return email;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`No "${subject}" email was sent to ${to}`);
}

function linkIn(email: EmailMessage) {
  const match = /https?:\/\/\S+/.exec(email.text);
  if (!match) throw new Error('Email has no link');
  return match[0];
}

const uniqueEmail = () => `user-${randomUUID()}@example.com`;
const uniqueIp = () =>
  `10.${String(Math.floor(Math.random() * 255))}.${String(Math.floor(Math.random() * 255))}.${String(Math.floor(Math.random() * 254) + 1)}`;
const PASSWORD = 'correct-horse-battery';

async function signUp(email: string, ip = uniqueIp()) {
  return call('/sign-up/email', {
    body: {
      name: 'Test User',
      email,
      password: PASSWORD,
      callbackURL: '/sign-in?next=%2Frealtime',
    },
    ip,
  });
}

/** Creates an account and confirms its email, returning the session cookie from the link. */
async function createVerifiedUser() {
  const email = uniqueEmail();
  await signUp(email);
  const link = linkIn(await waitForEmail(email, 'Confirm'));
  const response = await call(link, { method: 'GET' });
  return { email, cookie: cookieFrom(response), response };
}

beforeEach(() => {
  sentEmails.length = 0;
});

afterAll(async () => {
  await pool.end();
});

describe('Create account and Verify email', () => {
  it('sends a verification email and blocks sign-in until the email is confirmed', async () => {
    const email = uniqueEmail();
    const response = await signUp(email);
    expect(response.status).toBe(200);
    await waitForEmail(email, 'Confirm');

    const signIn = await call('/sign-in/email', {
      body: { email, password: PASSWORD },
      ip: uniqueIp(),
    });
    expect(signIn.status).toBe(403);
    expect(await signIn.json()).toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
  });

  it('signs the user in from the verification link and redirects to the callback URL', async () => {
    const { response, cookie } = await createVerifiedUser();
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/sign-in?next=%2Frealtime');

    const session = await call('/get-session', { method: 'GET', cookie });
    const body = (await session.json()) as { user: { emailVerified: boolean } } | null;
    expect(body?.user.emailVerified).toBe(true);
  });

  it('answers a sign-up for an existing email exactly like a new one and notifies the owner', async () => {
    const { email } = await createVerifiedUser();
    sentEmails.length = 0;

    const duplicate = await signUp(email);
    const fresh = await signUp(uniqueEmail());
    expect(duplicate.status).toBe(fresh.status);
    const duplicateBody = (await duplicate.json()) as { token: unknown; user: object };
    const freshBody = (await fresh.json()) as { token: unknown; user: object };
    expect(duplicateBody.token).toBeNull();
    expect(Object.keys(duplicateBody.user).sort()).toEqual(Object.keys(freshBody.user).sort());

    await waitForEmail(email, 'already have');
    expect(sentEmails.some((item) => item.to === email && item.subject.includes('Confirm'))).toBe(
      false,
    );
  });

  it('rejects a callback URL outside the app', async () => {
    const response = await call('/sign-up/email', {
      body: {
        name: 'Test',
        email: uniqueEmail(),
        password: PASSWORD,
        callbackURL: 'https://evil.example',
      },
      ip: uniqueIp(),
    });
    expect(response.status).toBe(403);
  });
});

describe('Sign in', () => {
  it('rejects a wrong password without revealing which field is wrong', async () => {
    const { email } = await createVerifiedUser();
    const wrongPassword = await call('/sign-in/email', {
      body: { email, password: 'not-the-password' },
      ip: uniqueIp(),
    });
    const unknownEmail = await call('/sign-in/email', {
      body: { email: uniqueEmail(), password: 'not-the-password' },
      ip: uniqueIp(),
    });
    expect(wrongPassword.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  });

  it(`locks sign-in after ${String(SIGN_IN_RATE_LIMIT.max)} attempts from one IP`, async () => {
    const { email } = await createVerifiedUser();
    const ip = uniqueIp();
    for (let attempt = 0; attempt < SIGN_IN_RATE_LIMIT.max; attempt++) {
      const response = await call('/sign-in/email', { body: { email, password: 'wrong' }, ip });
      expect(response.status).toBe(401);
    }
    const locked = await call('/sign-in/email', { body: { email, password: PASSWORD }, ip });
    expect(locked.status).toBe(429);
    expect(Number(locked.headers.get('x-retry-after'))).toBeGreaterThan(0);

    const otherIp = await call('/sign-in/email', {
      body: { email, password: PASSWORD },
      ip: uniqueIp(),
    });
    expect(otherIp.status).toBe(200);
  });

  it('sets an HttpOnly session cookie that lasts 7 days, or the browser session without "Keep me signed in"', async () => {
    const { email } = await createVerifiedUser();
    const remembered = await call('/sign-in/email', {
      body: { email, password: PASSWORD, rememberMe: true },
      ip: uniqueIp(),
    });
    const sessionCookie = remembered.headers
      .getSetCookie()
      .find((value) => value.startsWith('better-auth.session_token='));
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);
    expect(sessionCookie).toMatch(/Max-Age=604800/);

    const notRemembered = await call('/sign-in/email', {
      body: { email, password: PASSWORD, rememberMe: false },
      ip: uniqueIp(),
    });
    const browserSessionCookie = notRemembered.headers
      .getSetCookie()
      .find((value) => value.startsWith('better-auth.session_token='));
    expect(browserSessionCookie).toBeDefined();
    expect(browserSessionCookie).not.toMatch(/Max-Age/i);
  });

  it('marks cookies Secure in production', async () => {
    const productionAuth = buildAuth('production');
    const { email } = await createVerifiedUser();
    const response = await productionAuth.handler(
      new Request(`${APP_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: APP_URL,
          'x-forwarded-for': uniqueIp(),
        },
        body: JSON.stringify({ email, password: PASSWORD }),
      }),
    );
    const sessionCookie = response.headers
      .getSetCookie()
      .find((value) => value.includes('session_token='));
    expect(sessionCookie).toMatch(/Secure/);
  });
});

describe('Reset password', () => {
  it('answers the same way whether or not the email has an account', async () => {
    const { email } = await createVerifiedUser();
    sentEmails.length = 0;
    const known = await call('/request-password-reset', {
      body: { email, redirectTo: '/reset-password' },
      ip: uniqueIp(),
    });
    const unknown = await call('/request-password-reset', {
      body: { email: uniqueEmail(), redirectTo: '/reset-password' },
      ip: uniqueIp(),
    });
    expect(known.status).toBe(unknown.status);
    expect(await known.json()).toEqual(await unknown.json());
    await waitForEmail(email, 'Reset');
    expect(sentEmails).toHaveLength(1);
  });

  it('sets a new password once per link and signs out existing sessions', async () => {
    const { email, cookie } = await createVerifiedUser();
    await call('/request-password-reset', {
      body: { email, redirectTo: '/reset-password' },
      ip: uniqueIp(),
    });
    const link = linkIn(await waitForEmail(email, 'Reset'));
    const redirect = await call(link, { method: 'GET' });
    const location = new URL(redirect.headers.get('location') ?? '', APP_URL);
    expect(location.pathname).toBe('/reset-password');
    const token = location.searchParams.get('token');
    expect(token).toBeTruthy();

    const reset = await call('/reset-password', {
      body: { token, newPassword: 'a-brand-new-password' },
      ip: uniqueIp(),
    });
    expect(reset.status).toBe(200);

    const reused = await call('/reset-password', {
      body: { token, newPassword: 'another-new-password' },
      ip: uniqueIp(),
    });
    expect(reused.status).toBe(400);
    expect(await reused.json()).toMatchObject({ code: 'INVALID_TOKEN' });

    const oldSession = await call('/get-session', { method: 'GET', cookie });
    expect(await oldSession.json()).toBeNull();

    const signIn = await call('/sign-in/email', {
      body: { email, password: 'a-brand-new-password' },
      ip: uniqueIp(),
    });
    expect(signIn.status).toBe(200);
  });
});
