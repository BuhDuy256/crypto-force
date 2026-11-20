// Continue with Google in the auth API: its rate limits, which account a Google sign-in opens
// (decision table by Google `sub`, email and existing accounts), and the `state` check of the
// callback.
//
// How these tests run: `support/harness.ts` sends requests straight to the Better Auth handler
// (no HTTP server) with the same configuration as production code, on the `<POSTGRES_DB>_test`
// database. Emails go to an in-memory mailer, and every outbound HTTP call (Google, Pwned
// Passwords) goes to the fakes in `support/outbound.ts`. Each test uses its own client IP, because
// rate limits count requests per IP. Run with `pnpm test` after `pnpm db:up`.
// Google: `setGoogleProfile` in `support/outbound.ts` chooses the profile that the fake Google
// token endpoint returns. The test then calls the callback the way a browser would.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  controlClock,
  cookieFrom,
  countUsers,
  createHarness,
  createIpPool,
  createUnverifiedAccount,
  createVerifiedAccount,
  getSession,
  type Harness,
  HOUR,
  newResetToken,
  NEW_PASSWORD,
  passwordWorks,
  pool,
  rateLimitIps,
  resetPassword,
  sessionSetCookie,
  settleEmails,
  uniqueEmail,
} from '../support/harness';
import { type GoogleProfile, resetOutbound, setGoogleProfile } from '../support/outbound';

const ip = createIpPool(6);
const nextIp = rateLimitIps('203.0.113');
let h: Harness;
let clock: ReturnType<typeof controlClock>;

beforeEach(() => {
  resetOutbound();
  h = createHarness({ google: true });
  clock = controlClock();
  clock.at(-HOUR);
});

afterEach(() => {
  clock.restore();
});

afterAll(async () => {
  await pool.end();
});

const sub = () => `google-sub-${crypto.randomUUID()}`;

/** Presses Continue with Google: returns the provider URL, its `state` and the state cookie. */
async function startGoogle(clientIp = ip(), cookie = '') {
  const response = await h.call('/sign-in/social', {
    body: {
      provider: 'google',
      callbackURL: '/realtime',
      errorCallbackURL: '/sign-in?provider=google',
    },
    ip: clientIp,
    ...(cookie ? { cookie } : {}),
  });
  const body = response.status === 200 ? ((await response.json()) as { url?: string }) : {};
  const url = body.url ? new URL(body.url) : null;
  return {
    response,
    url,
    state: url?.searchParams.get('state') ?? '',
    cookie: cookieFrom(response, cookie),
  };
}

/** Completes the flow: the fake provider returns `profile` for the authorization code. */
async function completeGoogle(profile: GoogleProfile, cookie = '') {
  setGoogleProfile(profile);
  const start = await startGoogle(ip(), cookie);
  const response = await h.call(
    `/callback/google?code=fake-code&state=${encodeURIComponent(start.state)}`,
    { method: 'GET', cookie: start.cookie, ip: ip() },
  );
  return { response, cookie: cookieFrom(response, start.cookie) };
}

async function googleAccounts(email: string) {
  const result = await pool.query<{ account_id: string }>(
    `SELECT a.account_id FROM account a JOIN "user" u ON u.id = a.user_id
     WHERE lower(u.email) = lower($1) AND a.provider_id = 'google' ORDER BY a.account_id`,
    [email],
  );
  return result.rows.map((row) => row.account_id);
}

/** An account that signs in only with Google. Google identifies it by `sub`, not by email. */
async function createGoogleOnlyAccount() {
  const profile = { sub: sub(), email: uniqueEmail('g1').replace('@example.com', '@example.test') };
  const { response } = await completeGoogle(profile);
  expect(sessionSetCookie(response)).toBeDefined();
  return profile;
}

describe('Google rate limits', () => {
  // A request that the limit lets through gets its normal answer, not just "not 429": Continue
  // with Google answers 200 with the provider URL, and a callback with an unknown `state` redirects
  // (302) back to Auth with an error, as in TC-232. A blocked request gets 429.
  // The codes 200 and 302 come from better-auth 1.7.25, not from a requirement: the product owner
  // accepted them as the status of that version only. Thus, the tests also check the part that the
  // requirement gives: the provider URL, and the error in the redirect.
  const PROVIDER = 'https://accounts.google.com';

  async function pressGoogle(clientIp: string, t: number) {
    clock.at(t);
    const start = await startGoogle(clientIp);
    return { status: start.response.status, provider: start.url?.origin };
  }

  it('TC-009 presses 2 and 3 return the provider URL; presses 4 and 5 get 429', async () => {
    const clientIp = nextIp();
    const results = [];
    for (const t of [0, 1, 2, 3, 4]) results.push(await pressGoogle(clientIp, t));

    expect(results).toEqual([
      { status: 200, provider: PROVIDER },
      { status: 200, provider: PROVIDER },
      { status: 200, provider: PROVIDER },
      { status: 429, provider: undefined },
      { status: 429, provider: undefined },
    ]);
  });

  describe('TC-010 time of the 4th press', () => {
    for (const d of [8, 9, 10, 11]) {
      it(`d = ${String(d)}`, async () => {
        const clientIp = nextIp();
        for (const t of [0, 1, 2]) await pressGoogle(clientIp, t);
        expect(await pressGoogle(clientIp, 2 + d)).toEqual(
          d >= 10 ? { status: 200, provider: PROVIDER } : { status: 429, provider: undefined },
        );
      });
    }
  });

  async function callback(clientIp: string, t: number) {
    clock.at(t);
    const response = await h.call('/callback/google?code=fake-code&state=unknown', {
      method: 'GET',
      ip: clientIp,
    });
    const toAuthWithError = /[?&]error=/.test(response.headers.get('location') ?? '');
    return { status: response.status, toAuthWithError };
  }

  const rejected = { status: 302, toAuthWithError: true };
  const blocked = { status: 429, toAuthWithError: false };

  it('TC-017 callback: requests 99 and 100 are accepted, 101 and 102 get 429', async () => {
    const clientIp = nextIp();
    const results = [];
    for (let n = 1; n <= 102; n++) results.push(await callback(clientIp, (n * 5) / 102));
    expect(results.slice(98)).toEqual([rejected, rejected, blocked, blocked]);
  });

  describe('TC-018 callback: time of request 101', () => {
    for (const d of [8, 9, 10, 11]) {
      it(`d = ${String(d)}`, async () => {
        const clientIp = nextIp();
        for (let n = 1; n <= 100; n++) await callback(clientIp, (n * 2) / 100);
        expect(await callback(clientIp, 2 + d)).toEqual(d >= 10 ? rejected : blocked);
      });
    }
  });

  it('TC-019 each endpoint has its own counter', async () => {
    const clientIp = nextIp();
    const signIns: number[] = [];
    for (const t of [0, 1, 2]) {
      clock.at(t);
      const response = await h.call('/sign-in/email', {
        body: { email: 'nobody@example.test', password: 'Wrong-Horse-00' },
        ip: clientIp,
      });
      signIns.push(response.status);
    }
    // Each press reached the Sign in counter: it got the answer for wrong credentials, not 429.
    expect(signIns).toEqual([401, 401, 401]);
    expect(await pressGoogle(clientIp, 3)).toEqual({ status: 200, provider: PROVIDER });
  });
});

describe('Google account chooser', () => {
  it('TC-247 the provider URL asks Google for the account chooser', async () => {
    const start = await startGoogle(nextIp());

    expect(start.url?.origin).toBe('https://accounts.google.com');
    expect(start.url?.searchParams.get('prompt')).toBe('select_account');
  });
});

describe('Google decision table', () => {
  it('TC-043 a session created by Google is a remembered session', async () => {
    const { response } = await completeGoogle({ sub: sub(), email: uniqueEmail('google-new') });
    expect(sessionSetCookie(response)).toMatch(/Max-Age=604800/i);
  });

  it('TC-100 a linked `sub` signs in to its account even when the email differs', async () => {
    const g = await createGoogleOnlyAccount();
    const otherEmail = uniqueEmail('g2').replace('@example.com', '@example.test');
    const { cookie } = await completeGoogle({ sub: g.sub, email: otherEmail });

    expect((await getSession(h, cookie)).body?.user.email).toBe(g.email);
    expect(await countUsers(otherEmail)).toBe(0);
    expect(await countUsers(g.email)).toBe(1);
  });

  it('TC-101 a new email creates a verified account without a verification email', async () => {
    const email = uniqueEmail('google-new');
    const { response, cookie } = await completeGoogle({ sub: sub(), email });

    const session = (await getSession(h, cookie)).body;
    expect(session?.user.email).toBe(email);
    expect(session?.user.emailVerified).toBe(true);
    expect(await settleEmails(h.mailer, email)).toEqual([]);
    expect(new URL(response.headers.get('location') ?? '', 'http://x').pathname).toBe('/realtime');
  });

  it('TC-102 Google is linked to a verified email/password account', async () => {
    const account = await createVerifiedAccount(h, ip);
    const googleSub = sub();
    const { cookie } = await completeGoogle({ sub: googleSub, email: account.email });

    expect((await getSession(h, cookie)).body?.user.email).toBe(account.email);
    expect(await googleAccounts(account.email)).toEqual([googleSub]);
    expect(await passwordWorks(h, account.email, account.password, ip())).toBe(true);
  });

  it('TC-103 Google with the email of an unverified account: no session, no link, an error', async () => {
    const { email } = await createUnverifiedAccount(h, ip);
    const { response } = await completeGoogle({ sub: sub(), email });

    expect(sessionSetCookie(response)).toBeUndefined();
    expect(await googleAccounts(email)).toEqual([]);
    expect(response.headers.get('location') ?? '').toMatch(/[?&]error=/);
  });

  it('TC-104 a Google-only account with another `sub` is linked to both', async () => {
    const g = await createGoogleOnlyAccount();
    const secondSub = sub();
    const { cookie } = await completeGoogle({ sub: secondSub, email: g.email });

    expect((await getSession(h, cookie)).body?.user.email).toBe(g.email);
    expect(await googleAccounts(g.email)).toEqual([g.sub, secondSub].sort());
    expect(await countUsers(g.email)).toBe(1);
  });
});

describe('Flows with Google', () => {
  it('TC-199 an unverified account is recovered by Reset password and email confirmation', async () => {
    const unverified = await createUnverifiedAccount(h, ip);
    const profile = { sub: sub(), email: unverified.email };

    const first = await completeGoogle(profile);
    expect(sessionSetCookie(first.response)).toBeUndefined();
    expect(await googleAccounts(unverified.email)).toEqual([]);

    const token = await newResetToken(h, unverified.email, ip());
    expect((await resetPassword(h, token, NEW_PASSWORD, ip())).status).toBe(200);
    const second = await completeGoogle(profile);
    expect(sessionSetCookie(second.response)).toBeUndefined();
    expect(await googleAccounts(unverified.email)).toEqual([]);

    expect((await h.call(unverified.link, { method: 'GET', ip: ip() })).status).toBe(302);
    const third = await completeGoogle(profile);
    expect(sessionSetCookie(third.response)).toBeDefined();
    expect(await googleAccounts(unverified.email)).toEqual([profile.sub]);
  });
});

describe('Google state check', () => {
  it('TC-232 row 1: a callback without state and without the state cookie is rejected', async () => {
    const email = uniqueEmail('state-missing');
    setGoogleProfile({ sub: sub(), email });
    const response = await h.call('/callback/google?code=fake-code', { method: 'GET', ip: ip() });

    expect(sessionSetCookie(response)).toBeUndefined();
    expect(await countUsers(email)).toBe(0);
    expect(response.headers.get('location') ?? '').toMatch(/[?&]error=/);
  });

  it('TC-232 row 2: the state of client 1 is rejected when client 2 sends it', async () => {
    const email = uniqueEmail('state-swap');
    setGoogleProfile({ sub: sub(), email });
    const client1 = await startGoogle(ip());
    const client2 = await startGoogle(ip());
    const response = await h.call(
      `/callback/google?code=fake-code&state=${encodeURIComponent(client1.state)}`,
      { method: 'GET', cookie: client2.cookie, ip: ip() },
    );

    expect(sessionSetCookie(response)).toBeUndefined();
    expect(await countUsers(email)).toBe(0);
    expect(response.headers.get('location') ?? '').toMatch(/[?&]error=/);
  });
});
