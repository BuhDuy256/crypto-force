// Security behavior of the auth API: email as typed, Sign in results that do not show which emails
// have an account, answers when sending email fails, ASVS checks (no default account, a new token
// per sign-in, no state change on GET), and security configuration (cookie flags, callback URLs,
// startup checks in production).
//
// How these tests run: `support/harness.ts` sends requests straight to the Better Auth handler
// (no HTTP server) with the same configuration as production code, on the `<POSTGRES_DB>_test`
// database. Emails go to an in-memory mailer, and every outbound HTTP call (Google, Pwned
// Passwords) goes to the fakes in `support/outbound.ts`. Each test uses its own client IP, because
// rate limits count requests per IP. Run with `pnpm test` after `pnpm db:up`.
// TC-204 builds a second, empty database (`support/fresh-database.ts`), because the other files
// add accounts to `<POSTGRES_DB>_test`. TC-226 starts the real API process with `node`.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { spawnApi } from '../support/api-process';
import {
  APP_URL,
  countUsers,
  createHarness,
  createIpPool,
  createUnverifiedAccount,
  createVerifiedAccount,
  getSession,
  type Harness,
  linkIn,
  LOG_LEVEL,
  MemoryMailer,
  NEW_PASSWORD,
  newResetToken,
  PASSWORD,
  passwordWorks,
  pool,
  requestReset,
  sessionSetCookie,
  sessionToken,
  settleEmails,
  signIn,
  uniqueEmail,
  waitForEmail,
  WRONG_PASSWORD,
} from '../support/harness';
import { resetOutbound, setGoogleProfile } from '../support/outbound';
import { withFreshDatabase } from '../support/fresh-database';

const ip = createIpPool(7);
let h: Harness;

beforeEach(() => {
  resetOutbound();
  h = createHarness({ google: true });
});

afterAll(async () => {
  await pool.end();
});

const errorLogs = (harness: Harness) =>
  harness.logs.filter((record) => record.level >= LOG_LEVEL.error);

const characterSets = (value: string) =>
  [/[a-z]/, /[A-Z]/, /[0-9]/, /[-_]/]
    .filter((pattern) => pattern.test(value))
    .map(String)
    .join('');
const isRecent = (value: unknown) =>
  typeof value === 'string' && Math.abs(Date.now() - Date.parse(value)) < 10 * 60_000;

/**
 * The Create account response, with four fields of `user` replaced by their form. Two different
 * emails always give different values in these fields: `id` is new for each account, `email`
 * repeats the email that was sent, and `createdAt` and `updatedAt` hold the time of the request.
 * So "the same response" can only mean "the same form" for them. The form still shows a
 * difference an attacker could use, for example an `id` of another length or alphabet, or an old
 * `createdAt` that belongs to the account that already exists.
 */
function responseForm(body: unknown) {
  const copy = structuredClone(body) as { user?: Record<string, unknown> };
  if (copy.user) {
    const { id, email, createdAt, updatedAt } = copy.user;
    copy.user = {
      ...copy.user,
      id: typeof id === 'string' ? `${String(id.length)} chars ${characterSets(id)}` : id,
      email: typeof email === 'string' && email.includes('@') ? 'an email' : email,
      createdAt: isRecent(createdAt) ? 'time of the request' : createdAt,
      updatedAt: isRecent(updatedAt) ? 'time of the request' : updatedAt,
    };
  }
  return copy;
}

async function createGoogleOnlyAccount() {
  const email = uniqueEmail('g1').replace('@example.com', '@example.test');
  setGoogleProfile({ sub: `google-sub-${crypto.randomUUID()}`, email });
  const start = await h.call('/sign-in/social', {
    body: { provider: 'google', callbackURL: '/realtime' },
    ip: ip(),
  });
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get('state') ?? '';
  const cookie = start.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
  await h.call(`/callback/google?code=fake-code&state=${encodeURIComponent(state)}`, {
    method: 'GET',
    cookie,
    ip: ip(),
  });
  expect(await countUsers(email)).toBe(1);
  return email;
}

/** The form of a JSON body; a body that is not JSON (for example an empty 500) stays text. */
async function bodyForm(response: Response) {
  const text = await response.text();
  try {
    return responseForm(JSON.parse(text));
  } catch {
    return text;
  }
}

describe('Email as typed', () => {
  // The spaces around an email never reach the API: the email field of the Sign in form (the only
  // client of the API) and its schema remove them. Thus, the e2e test of the form checks them.
  it('TC-133 ignores the case of a registered email; a +tag is another email', async () => {
    await createVerifiedAccount(h, ip, { email: 'an@example.com' });
    const results: Record<string, number> = {};
    for (const typed of ['An@Example.com', 'an+test@example.com', 'an@example.com']) {
      const { response, cookie } = await signIn(h, typed, PASSWORD, ip());
      results[typed] = response.status;
      if (response.status === 200) {
        expect((await getSession(h, cookie)).body?.user.email).toBe('an@example.com');
      }
    }
    expect(results).toEqual({
      'An@Example.com': 200,
      'an+test@example.com': 401,
      'an@example.com': 200,
    });
  });
});

describe('Sign in result by account', () => {
  it('TC-150 rows 1–4 answer alike; row 5 asks to confirm the email; row 6 signs in', async () => {
    const googleOnly = await createGoogleOnlyAccount();
    const a = await createVerifiedAccount(h, ip);
    const u = await createUnverifiedAccount(h, ip);

    const rows = [
      { email: 'none@example.test', password: PASSWORD },
      { email: googleOnly, password: PASSWORD },
      { email: a.email, password: WRONG_PASSWORD },
      { email: u.email, password: WRONG_PASSWORD },
    ];
    const answers = [];
    for (const row of rows) {
      const { response } = await signIn(h, row.email, row.password, ip());
      expect(sessionSetCookie(response)).toBeUndefined();
      answers.push({ status: response.status, body: await response.json() });
    }
    for (const answer of answers.slice(1)) expect(answer).toEqual(answers[0]);
    expect(answers[0]?.status).toBe(401);

    const row5 = await signIn(h, u.email, PASSWORD, ip());
    expect(row5.response.status).toBe(403);
    expect(await row5.response.json()).toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
    expect(sessionSetCookie(row5.response)).toBeUndefined();

    const row6 = await signIn(h, a.email, PASSWORD, ip());
    expect(row6.response.status).toBe(200);
    expect((await getSession(h, row6.cookie)).body?.user.email).toBe(a.email);
  });
});

describe('Email sending failures', () => {
  /** Runs `act` with a working mailer and with a failing one, and returns both responses. */
  async function compareWithFailingMailer(act: (harness: Harness) => Promise<Response>) {
    const ok = await act(h);
    // The comparison means something only when the request with a working mailer succeeds. 200 is
    // the status of better-auth 1.7.25 for these requests (accepted request table of the test cases).
    expect(ok.status, 'status with a working mailer').toBe(200);
    const failingMailer = new MemoryMailer();
    failingMailer.failing = true;
    const failing = createHarness({}, failingMailer);
    const failed = await act(failing);
    await settleEmails(failingMailer, 'nobody');
    return {
      ok: { status: ok.status, body: await bodyForm(ok) },
      failed: { status: failed.status, body: await bodyForm(failed) },
      errors: errorLogs(failing).length,
    };
  }

  const signUp = (harness: Harness) =>
    harness.call('/sign-up/email', {
      body: {
        name: 'Mail Fail',
        email: uniqueEmail('mailfail'),
        password: PASSWORD,
        callbackURL: '/sign-in',
      },
      ip: ip(),
    });

  it('TC-185 / TC-229 row 1: Create account answers as usual and logs the failure', async () => {
    const result = await compareWithFailingMailer(signUp);
    expect(result.failed).toEqual(result.ok);
    expect(result.errors).toBeGreaterThanOrEqual(1);
  });

  it('TC-229 row 2: resend verification link answers as usual and logs the failure', async () => {
    const u1 = await createUnverifiedAccount(h, ip);
    const u2 = await createUnverifiedAccount(h, ip);
    let first = true;
    const result = await compareWithFailingMailer((harness) => {
      const email = first ? u1.email : u2.email;
      first = false;
      return harness.call('/send-verification-email', {
        body: { email, callbackURL: '/sign-in' },
        ip: ip(),
      });
    });
    expect(result.failed).toEqual(result.ok);
    expect(result.errors).toBeGreaterThanOrEqual(1);
  });

  it('TC-192 / TC-229 row 3: Send reset link answers as usual and logs the failure', async () => {
    const a1 = await createVerifiedAccount(h, ip);
    const a2 = await createVerifiedAccount(h, ip);
    let first = true;
    const result = await compareWithFailingMailer((harness) => {
      const email = first ? a1.email : a2.email;
      first = false;
      return requestReset(harness, email, ip());
    });
    expect(result.failed).toEqual(result.ok);
    expect(result.errors).toBeGreaterThanOrEqual(1);
  });
});

describe('ASVS checks', () => {
  it('TC-204 a database built from the migrations has no account; default logins are rejected', async () => {
    const users = await withFreshDatabase(async (client) => {
      const result = await client.query<{ count: string }>('SELECT count(*) FROM "user"');
      return Number(result.rows[0]?.count);
    });
    expect(users).toBe(0);

    for (const email of ['root@localhost', 'admin@localhost', 'sa@localhost']) {
      const { response } = await signIn(h, email, 'password', ip());
      // The domain has no dot, so the email has an invalid format. 400 and the code come from
      // better-auth 1.7.25, not from a requirement; the requirement is that no session starts.
      expect(response.status, email).toBe(400);
      expect(await response.json(), email).toMatchObject({ code: 'INVALID_EMAIL' });
      expect(sessionSetCookie(response)).toBeUndefined();
    }
  });

  it('TC-205 two sign-ins give two different tokens', async () => {
    const a = await createVerifiedAccount(h, ip);
    const first = await signIn(h, a.email, a.password, ip());
    const second = await signIn(h, a.email, a.password, ip());
    expect(sessionToken(first.cookie)).toBeDefined();
    expect(sessionToken(first.cookie)).not.toBe(sessionToken(second.cookie));
  });

  it('TC-208 GET does not change state on POST-only endpoints', async () => {
    const a = await createVerifiedAccount(h, ip);
    const { cookie } = await signIn(h, a.email, a.password, ip());
    const newEmail = uniqueEmail('get-signup');
    const token = await newResetToken(h, a.email, ip());
    const resetEmailsBefore = (await settleEmails(h.mailer, a.email)).length;
    const q = (params: Record<string, string>) => new URLSearchParams(params).toString();

    const signInGet = await h.call(
      `/sign-in/email?${q({ email: a.email, password: a.password })}`,
      {
        method: 'GET',
        ip: ip(),
      },
    );
    expect(sessionSetCookie(signInGet)).toBeUndefined();

    await h.call(`/sign-up/email?${q({ name: 'Get', email: newEmail, password: PASSWORD })}`, {
      method: 'GET',
      ip: ip(),
    });
    expect(await countUsers(newEmail)).toBe(0);

    await h.call('/sign-out', { method: 'GET', cookie, ip: ip() });
    expect((await getSession(h, cookie)).body).not.toBeNull();

    await h.call(`/request-password-reset?${q({ email: a.email })}`, { method: 'GET', ip: ip() });
    expect((await settleEmails(h.mailer, a.email)).length).toBe(resetEmailsBefore);

    await h.call(`/reset-password?${q({ token, newPassword: NEW_PASSWORD })}`, {
      method: 'GET',
      ip: ip(),
    });
    expect(await passwordWorks(h, a.email, a.password, ip())).toBe(true);
  });
});

describe('Security configuration', () => {
  it('TC-220 row 3: the session cookie is Secure with NODE_ENV=production', async () => {
    const a = await createVerifiedAccount(h, ip);
    const production = createHarness({ nodeEnv: 'production' });
    const { response } = await signIn(production, a.email, a.password, ip());
    expect(sessionSetCookie(response)).toMatch(/;\s*Secure/i);
  });

  it('TC-221 row 2: a request from another origin is rejected with NODE_ENV=test', async () => {
    const a = await createVerifiedAccount(h, ip);
    const response = await h.call('/sign-in/email', {
      body: { email: a.email, password: a.password },
      ip: ip(),
      headers: { origin: 'https://evil.example' },
    });
    expect(response.status).toBe(403);
    expect(sessionSetCookie(response)).toBeUndefined();
  });

  describe('TC-222 a callback URL outside the app is rejected', () => {
    it('sign-in/social callbackURL', async () => {
      const response = await h.call('/sign-in/social', {
        body: { provider: 'google', callbackURL: 'https://evil.example/' },
        ip: ip(),
      });
      expect(response.status).toBe(403);
    });

    it('sign-up/email callbackURL', async () => {
      const email = uniqueEmail('evil-callback');
      const response = await h.call('/sign-up/email', {
        body: { name: 'Evil', email, password: PASSWORD, callbackURL: 'https://evil.example/' },
        ip: ip(),
      });
      expect(response.status).toBe(403);
      expect(await settleEmails(h.mailer, email)).toEqual([]);
    });

    it('request-password-reset redirectTo', async () => {
      const a = await createVerifiedAccount(h, ip);
      const before = (await settleEmails(h.mailer, a.email)).length;
      const response = await h.call('/request-password-reset', {
        body: { email: a.email, redirectTo: 'https://evil.example/' },
        ip: ip(),
      });
      expect(response.status).toBe(403);
      expect((await settleEmails(h.mailer, a.email)).length).toBe(before);
    });
  });

  it('TC-223 Create account answers alike for a registered and a new email', async () => {
    const a = await createVerifiedAccount(h, ip);
    const signUp = (email: string) =>
      h.call('/sign-up/email', {
        body: { name: 'Same Answer', email, password: 'Other-Horse-93', callbackURL: '/sign-in' },
        ip: ip(),
      });
    const registered = await signUp(a.email);
    const fresh = await signUp(uniqueEmail('fresh'));
    expect(registered.status).toBe(fresh.status);
    expect(responseForm(await registered.json())).toEqual(responseForm(await fresh.json()));
  });

  it('TC-224 Forgot password answers alike for a registered and an unknown email', async () => {
    const a = await createVerifiedAccount(h, ip);
    const registered = await requestReset(h, a.email, ip());
    const unknown = await requestReset(h, 'none@example.test', ip());
    expect(registered.status).toBe(unknown.status);
    expect(await registered.json()).toEqual(await unknown.json());
  });

  describe('TC-226 the API does not start in production without an email setting', () => {
    const run = (env: Record<string, string>) =>
      new Promise<{ code: number | null; output: string }>((resolve) => {
        const child = spawnApi({ NODE_ENV: 'production', API_PORT: '3999', ...env });
        let output = '';
        child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
        child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));
        const timer = setTimeout(() => child.kill(), 20_000);
        child.on('exit', (code) => {
          clearTimeout(timer);
          resolve({ code, output });
        });
      });

    it('row 1: RESEND_API_KEY empty', async () => {
      const { code, output } = await run({
        RESEND_API_KEY: '',
        EMAIL_FROM: 'Auth <auth@example.com>',
      });
      expect(code).not.toBe(0);
      expect(code).not.toBeNull();
      expect(output).toContain('RESEND_API_KEY');
    }, 30_000);

    it('row 2: EMAIL_FROM empty', async () => {
      const { code, output } = await run({ RESEND_API_KEY: 're_test_key', EMAIL_FROM: '' });
      expect(code).not.toBe(0);
      expect(code).not.toBeNull();
      expect(output).toContain('EMAIL_FROM');
    }, 30_000);
  });

  describe('TC-231 links in emails use the origin of BETTER_AUTH_URL', () => {
    const spoofed = { 'x-forwarded-host': 'evil.example', host: 'evil.example' };

    it('row 1: Create account', async () => {
      const email = uniqueEmail('host');
      await h.call('http://evil.example/api/auth/sign-up/email', {
        body: { name: 'Host', email, password: PASSWORD, callbackURL: '/sign-in' },
        ip: ip(),
        headers: spoofed,
      });
      expect(linkIn(await waitForEmail(h.mailer, email, 'Confirm')).startsWith(`${APP_URL}/`)).toBe(
        true,
      );
    });

    it('row 2: Send reset link', async () => {
      const a = await createVerifiedAccount(h, ip);
      await h.call('http://evil.example/api/auth/request-password-reset', {
        body: { email: a.email, redirectTo: '/reset-password' },
        ip: ip(),
        headers: spoofed,
      });
      expect(linkIn(await waitForEmail(h.mailer, a.email, 'Reset')).startsWith(`${APP_URL}/`)).toBe(
        true,
      );
    });
  });
});
