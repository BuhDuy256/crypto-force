// Sessions of the auth API: a new token at each sign-in, revocation after a new password,
// "Keep me signed in" (7 days, extended once a day), browser sessions (1 day), the 30-day
// absolute limit, and the age limit of verification and reset links.
//
// How these tests run: `support/harness.ts` sends requests straight to the Better Auth handler
// (no HTTP server) with the same configuration as production code, on the `<POSTGRES_DB>_test`
// database. Emails go to an in-memory mailer, and every outbound HTTP call (Google, Pwned
// Passwords) goes to the fakes in `support/outbound.ts`. Each test uses its own client IP, because
// rate limits count requests per IP. Run with `pnpm test` after `pnpm db:up`.
// Time: `controlClock` fixes `Date`, so a test can stand one second before or after a limit.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type Account,
  controlClock,
  createHarness,
  createIpPool,
  createUnverifiedAccount,
  createVerifiedAccount,
  DAY,
  getSession,
  type Harness,
  HOUR,
  isEmailVerified,
  NEW_PASSWORD,
  newResetToken,
  passwordWorks,
  pool,
  rateLimitIps,
  resetPassword,
  sessionSetCookie,
  sessionToken,
  signIn,
} from '../support/harness';

const ip = createIpPool(3);
const clientIp = rateLimitIps('203.0.113', 200);
let h: Harness;
let clock: ReturnType<typeof controlClock>;

beforeEach(() => {
  h = createHarness();
  clock = controlClock();
  clock.at(-HOUR);
});

afterEach(() => {
  clock.restore();
});

afterAll(async () => {
  await pool.end();
});

const SEVEN_DAYS = 7 * DAY;

async function expiresAtOf(cookie: string) {
  const token = sessionToken(cookie);
  const result = await pool.query<{ expires_at: Date }>(
    'SELECT expires_at FROM session WHERE token = $1',
    [token],
  );
  return result.rows[0]?.expires_at.getTime();
}

/** P1 (Keep me signed in on) or P2 (off), created at `t` = 0. */
async function openSession(account: Account, remember: boolean) {
  clock.at(0);
  const { response, cookie } = await signIn(h, account.email, account.password, ip(), {
    rememberMe: remember,
  });
  expect(response.status).toBe(200);
  return cookie;
}

async function accepted(cookie: string, t: number) {
  clock.at(t);
  const { body } = await getSession(h, cookie, ip());
  return body !== null;
}

describe('Session lifecycle', () => {
  it('TC-032 a request without a cookie has no session', async () => {
    const { body } = await getSession(h, '');
    expect(body).toBeNull();
  });

  describe('TC-033 signing in again issues a new token and revokes the old one (ASVS 7.2.4)', () => {
    const rows = [
      { row: 1, existing: 'P1', remember: true },
      { row: 2, existing: 'P1', remember: false },
      { row: 3, existing: 'P2', remember: true },
      { row: 4, existing: 'P2', remember: false },
    ];
    for (const { row, existing, remember } of rows) {
      it(`row ${String(row)}: ${existing}, Keep me signed in ${remember ? 'on' : 'off'}`, async () => {
        const account = await createVerifiedAccount(h, ip);
        const oldCookie = await openSession(account, existing === 'P1');
        const { response, cookie } = await signIn(h, account.email, account.password, ip(), {
          rememberMe: remember,
          cookie: oldCookie,
        });

        expect(response.status).toBe(200);
        expect(sessionToken(cookie)).not.toBe(sessionToken(oldCookie));
        expect((await getSession(h, oldCookie)).body).toBeNull();
        const setCookie = sessionSetCookie(response) ?? '';
        if (remember) expect(setCookie).toMatch(/Max-Age=604800/i);
        else expect(setCookie).not.toMatch(/Max-Age/i);
      });
    }
  });

  describe('TC-034 a remembered session is extended once a day while in use', () => {
    it('row 1: request after 1 day + 1 hour moves the expiry to t + 7 days', async () => {
      const cookie = await openSession(await createVerifiedAccount(h, ip), true);
      const t = DAY + HOUR;
      clock.at(t);
      const { response, body } = await getSession(h, cookie);

      expect(body).not.toBeNull();
      expect(await expiresAtOf(cookie)).toBe(clock.origin + (t + SEVEN_DAYS) * 1000);
      expect(sessionSetCookie(response)).toMatch(/Max-Age=604800/i);
    });

    it('row 2: request after 1 hour keeps the expiry', async () => {
      const cookie = await openSession(await createVerifiedAccount(h, ip), true);
      const before = await expiresAtOf(cookie);
      expect(await accepted(cookie, HOUR)).toBe(true);
      expect(await expiresAtOf(cookie)).toBe(before);
    });
  });

  it('TC-035 a remembered session unused for 7 days is rejected', async () => {
    const cookie = await openSession(await createVerifiedAccount(h, ip), true);
    expect(await accepted(cookie, 8 * DAY)).toBe(false);
  });

  it('TC-036 a session ends 30 days after sign-in even when used every day', async () => {
    const cookie = await openSession(await createVerifiedAccount(h, ip), true);
    const results: { t: number; accepted: boolean }[] = [];
    for (let k = 1; k * (DAY + 1) <= 31 * DAY; k++) {
      const t = k * (DAY + 1);
      results.push({ t, accepted: await accepted(cookie, t) });
    }
    const before30 = results.filter((item) => item.t < 30 * DAY);
    const firstFrom30 = results.find((item) => item.t >= 30 * DAY);
    expect(before30.every((item) => item.accepted)).toBe(true);
    expect(firstFrom30?.accepted).toBe(false);
  });

  describe('TC-039 setting a new password revokes existing sessions', () => {
    for (const [row, remember] of [
      [1, true],
      [2, false],
    ] as const) {
      it(`row ${String(row)}: ${remember ? 'P1' : 'P2'} on client 1`, async () => {
        const account = await createVerifiedAccount(h, ip);
        const client1 = await openSession(account, remember);
        const token = await newResetToken(h, account.email, ip());
        expect((await resetPassword(h, token, NEW_PASSWORD, ip())).status).toBe(200);
        expect((await getSession(h, client1)).body).toBeNull();
      });
    }
  });

  describe('TC-041 concurrent sessions from two clients are both accepted', () => {
    for (const [row, remember] of [
      [1, true],
      [2, false],
    ] as const) {
      it(`row ${String(row)}: ${remember ? 'P1' : 'P2'} on client 1`, async () => {
        const account = await createVerifiedAccount(h, ip);
        clock.at(0);
        const client1 = await signIn(h, account.email, account.password, clientIp(), {
          rememberMe: remember,
        });
        const client2 = await signIn(h, account.email, account.password, clientIp());
        expect((await getSession(h, client1.cookie)).body).not.toBeNull();
        expect((await getSession(h, client2.cookie)).body).not.toBeNull();
      });
    }
  });

  describe('TC-042 a browser session expires on the server after 1 day and is not extended', () => {
    it('row 1: accepted after 1 hour with the same expiry, rejected after 1 day + 1 hour', async () => {
      const cookie = await openSession(await createVerifiedAccount(h, ip), false);
      const before = await expiresAtOf(cookie);
      expect(await accepted(cookie, HOUR)).toBe(true);
      expect(await expiresAtOf(cookie)).toBe(before);
      expect(await accepted(cookie, DAY + HOUR)).toBe(false);
    });

    it('row 2: rejected after 7 days + 1 second without requests', async () => {
      const cookie = await openSession(await createVerifiedAccount(h, ip), false);
      expect(await accepted(cookie, SEVEN_DAYS + 1)).toBe(false);
    });
  });

  it('TC-044 the session from a verification link is a remembered session', async () => {
    const { link } = await createUnverifiedAccount(h, ip);
    const response = await h.call(link, { method: 'GET', ip: ip() });
    expect(sessionSetCookie(response)).toMatch(/Max-Age=604800/i);
  });
});

describe('Time limits', () => {
  describe('TC-045 verification link age', () => {
    for (const age of [3598, 3599, 3600, 3601]) {
      it(`opened ${String(age)} s after sending`, async () => {
        clock.at(0);
        const { email, link } = await createUnverifiedAccount(h, ip);
        clock.at(age);
        const response = await h.call(link, { method: 'GET', ip: ip() });

        if (age < 3600) {
          expect(await isEmailVerified(email)).toBe(true);
          expect(sessionSetCookie(response)).toBeDefined();
        } else {
          expect(response.headers.get('location') ?? '').toMatch(/[?&]error=/);
          expect(sessionSetCookie(response)).toBeUndefined();
          expect(await isEmailVerified(email)).toBe(false);
        }
      });
    }
  });

  describe('TC-046 reset link age', () => {
    for (const age of [3598, 3599, 3600, 3601]) {
      it(`used ${String(age)} s after sending`, async () => {
        const account = await createVerifiedAccount(h, ip);
        clock.at(0);
        const token = await newResetToken(h, account.email, ip());
        clock.at(age);
        const response = await resetPassword(h, token, NEW_PASSWORD, ip());

        if (age < 3600) {
          expect(response.status).toBe(200);
          expect(await passwordWorks(h, account.email, NEW_PASSWORD, ip())).toBe(true);
        } else {
          expect(response.status).toBe(400);
          expect(await passwordWorks(h, account.email, account.password, ip())).toBe(true);
        }
      });
    }
  });

  describe('TC-047 7-day limit of a remembered session', () => {
    for (const offset of [-2, -1, 0, 1]) {
      it(`request at 7 days ${offset < 0 ? '−' : '+'} ${String(Math.abs(offset))} s`, async () => {
        const cookie = await openSession(await createVerifiedAccount(h, ip), true);
        expect(await accepted(cookie, SEVEN_DAYS + offset)).toBe(offset < 0);
      });
    }
  });

  describe('TC-048 1-day extension boundary', () => {
    for (const offset of [-2, -1, 0, 1]) {
      it(`request at 1 day ${offset < 0 ? '−' : '+'} ${String(Math.abs(offset))} s`, async () => {
        const cookie = await openSession(await createVerifiedAccount(h, ip), true);
        const before = await expiresAtOf(cookie);
        const t = DAY + offset;
        expect(await accepted(cookie, t)).toBe(true);
        const after = await expiresAtOf(cookie);
        if (offset < 0) expect(after).toBe(before);
        else expect(after).toBe(clock.origin + (t + SEVEN_DAYS) * 1000);
      });
    }
  });

  describe('TC-049 30-day absolute limit', () => {
    for (const offset of [-2, -1, 0, 1]) {
      it(`request at 30 days ${offset < 0 ? '−' : '+'} ${String(Math.abs(offset))} s`, async () => {
        const cookie = await openSession(await createVerifiedAccount(h, ip), true);
        for (let k = 1; k * (DAY + 1) < 30 * DAY - 2; k++) await accepted(cookie, k * (DAY + 1));
        expect(await accepted(cookie, 30 * DAY + offset)).toBe(offset < 0);
      });
    }
  });

  describe('TC-050 1-day limit of a browser session', () => {
    for (const offset of [-2, -1, 0, 1]) {
      it(`request at 1 day ${offset < 0 ? '−' : '+'} ${String(Math.abs(offset))} s`, async () => {
        const cookie = await openSession(await createVerifiedAccount(h, ip), false);
        expect(await accepted(cookie, DAY + offset)).toBe(offset < 0);
      });
    }
  });
});
