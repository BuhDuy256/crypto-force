// Attempt limits of the auth API: the Sign in lock after repeated presses, and the limits on
// Create account, resend verification link and Send reset link. Each test checks the request just
// before and just after a limit (count and time), and that a blocked request has no effect.
//
// How these tests run: `support/harness.ts` sends requests straight to the Better Auth handler
// (no HTTP server) with the same configuration as production code, on the `<POSTGRES_DB>_test`
// database. Emails go to an in-memory mailer, and every outbound HTTP call (Google, Pwned
// Passwords) goes to the fakes in `support/outbound.ts`. Each test uses its own client IP, because
// rate limits count requests per IP. Run with `pnpm test` after `pnpm db:up`.
// Time: `controlClock` fixes `Date`; `t` in a test is seconds after the first request.
// Restart: TC-003 and TC-005 run the real API as a process (`support/api-process.ts`), stop it and
// start a new one, because a new auth server in the same process shares the memory of the old one.
// These tests use the real clock, since the API processes cannot read the controlled clock.
// A request that a limit lets through gets its normal answer (Test Cases section 2.1), so the tests
// check that exact status: 401 for Sign in with a wrong password (as at t=0 in TC-001), 200 for
// Create account, resend verification link and Send reset link. A blocked request gets 429.
// The 200 comes from better-auth 1.7.25, not from a requirement: the product owner accepted it
// as the status of that version only. Thus, the tests also check the effect of each request: an
// accepted request sends its email or creates its account, and a blocked request does not.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type Account,
  controlClock,
  countUsers,
  createHarness,
  createIpPool,
  createUnverifiedAccount,
  createVerifiedAccount,
  type Harness,
  pool,
  rateLimitIps,
  requestReset,
  sessionSetCookie,
  settleEmails,
  uniqueEmail,
  WRONG_PASSWORD,
} from '../support/harness';
import { type ApiProcess, startApi } from '../support/api-process';

const fresh = createIpPool(2);
const nextIp = rateLimitIps('198.51.100');
let h: Harness;
let clock: ReturnType<typeof controlClock>;

beforeEach(() => {
  h = createHarness();
  clock = controlClock();
  clock.at(-300);
});

afterEach(() => {
  clock.restore();
});

afterAll(async () => {
  await pool.end();
});

/** One press of Sign in at `t`. Without an account the request is still counted. */
async function pressSignIn(
  harness: Harness,
  ip: string,
  t: number,
  credentials: { email: string; password: string } = {
    email: 'nobody@example.test',
    password: WRONG_PASSWORD,
  },
) {
  clock.at(t);
  return harness.call('/sign-in/email', { body: credentials, ip });
}

async function pressAll(ip: string, times: number[]) {
  const results: Response[] = [];
  for (const t of times) results.push(await pressSignIn(h, ip, t));
  return results;
}

async function tc001Chain(account: Account, ip: string) {
  const wrong = { email: account.email, password: WRONG_PASSWORD };
  const right = { email: account.email, password: account.password };
  return {
    t0: await pressSignIn(h, ip, 0, wrong),
    t1: await pressSignIn(h, ip, 1, right),
    t2: await pressSignIn(h, ip, 2, wrong),
    t3: await pressSignIn(h, ip, 3, wrong),
    t5: await pressSignIn(h, ip, 5, right),
  };
}

describe('Sign in lock', () => {
  it('TC-001 counts every press up to the lock; a press while locked does not extend it', async () => {
    const account = await createVerifiedAccount(h, fresh);
    const r = await tc001Chain(account, nextIp());

    expect(r.t0.status).toBe(401);
    expect(r.t1.status).toBe(200);
    expect(sessionSetCookie(r.t1)).toBeDefined();
    expect(r.t2.status).toBe(401);
    expect(r.t3.status).toBe(429);
    expect(r.t3.headers.get('x-retry-after')).toBe('9');
    expect(r.t5.status).toBe(429);
    expect(r.t5.headers.get('x-retry-after')).toBe('7');
    expect(sessionSetCookie(r.t5)).toBeUndefined();
  });

  it('TC-002 unlocks 10 seconds after the last accepted press, then counts from t=12', async () => {
    const account = await createVerifiedAccount(h, fresh);
    const ip = nextIp();
    await tc001Chain(account, ip);
    const right = { email: account.email, password: account.password };

    const t12 = await pressSignIn(h, ip, 12, right);
    expect(t12.status).toBe(200);
    expect(sessionSetCookie(t12)).toBeDefined();
    expect((await pressSignIn(h, ip, 13)).status).toBe(401);
    expect((await pressSignIn(h, ip, 14)).status).toBe(401);
    expect((await pressSignIn(h, ip, 15)).status).toBe(429);
  });

  describe('TC-004 the counter returns to 0 after 10 seconds without a press', () => {
    const rows = [
      { row: 1, first: [0], after: [10, 11, 12, 13] },
      { row: 2, first: [0, 1], after: [11, 12, 13, 14] },
      { row: 3, first: [0, 1, 2], after: [12, 13, 14, 15] },
    ];
    for (const { row, first, after } of rows) {
      it(`row ${String(row)}: ${String(first.length)} press(es), pause, then 4 presses`, async () => {
        const results = await pressAll(nextIp(), [...first, ...after]);
        const accepted = new Array<number>(results.length - 1).fill(401);
        expect(results.map((response) => response.status)).toEqual([...accepted, 429]);
      });
    }
  });
});

describe('Sign in lock across API restarts', () => {
  const credentials = { email: 'nobody@example.test', password: WRONG_PASSWORD };
  const running: ApiProcess[] = [];

  async function start(port: number) {
    const api = await startApi(port);
    running.push(api);
    return api;
  }

  afterEach(async () => {
    await Promise.all(running.splice(0).map((api) => api.stop()));
  });

  /** Presses Sign in at each `t`: seconds after `origin` on the real clock (`performance.now`). */
  async function pressAt(api: ApiProcess, ip: string, origin: number, times: number[]) {
    const statuses: number[] = [];
    for (const t of times) {
      const wait = origin + t * 1000 - performance.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      statuses.push((await api.post('/sign-in/email', credentials, ip)).status);
    }
    return statuses;
  }

  // A process that has just started is the API right after a restart.
  it('TC-003 accepts the first press after an API restart', async () => {
    const api = await start(3991);
    expect(await pressAt(api, nextIp(), performance.now(), [0])).toEqual([401]);
  }, 60_000);

  describe('TC-005 the counter survives an API restart', () => {
    const rows = [
      { row: 1, before: [0], after: [2, 3, 4], beforeResult: [401], expected: [401, 401, 429] },
      { row: 2, before: [0, 1], after: [3, 4], beforeResult: [401, 401], expected: [401, 429] },
      { row: 3, before: [0, 1, 2], after: [4], beforeResult: [401, 401, 401], expected: [429] },
      {
        row: 4,
        before: [0, 1, 2, 3],
        after: [5],
        beforeResult: [401, 401, 401, 429],
        expected: [429],
      },
    ];
    for (const { row, before, after, beforeResult, expected } of rows) {
      it(`row ${String(row)}`, async () => {
        const ip = nextIp();
        const first = await start(3992);
        const origin = performance.now();
        expect(await pressAt(first, ip, origin, before)).toEqual(beforeResult);

        await first.stop();
        const restarted = await start(3993);
        // When the new process is ready after the first `after` time, every later press moves by
        // the same delay. The counter starts again only when 10 s pass after the previous press.
        // Thus, the expected result stays the same while all presses are less than 10 s after the
        // first press: then no gap between two presses reaches 10 s.
        const delay = Math.max(0, (performance.now() - origin) / 1000 - (after[0] ?? 0));
        const statuses = await pressAt(
          restarted,
          ip,
          origin,
          after.map((t) => t + delay),
        );
        const lastPress = (performance.now() - origin) / 1000;
        expect(lastPress, 'the restart took too long: presses left the 10 s window').toBeLessThan(
          9,
        );
        expect(statuses).toEqual(expected);
      }, 60_000);
    }
  });
});

describe('Attempt limits', () => {
  it('TC-006 Sign in: presses 2 and 3 are accepted, presses 4 and 5 get 429', async () => {
    const results = await pressAll(nextIp(), [0, 1, 2, 3, 4]);
    expect(results.map((response) => response.status)).toEqual([401, 401, 401, 429, 429]);
  });

  describe('TC-007 Sign in: time of the 4th press', () => {
    for (const d of [8, 9, 10, 11]) {
      it(`d = ${String(d)}`, async () => {
        const ip = nextIp();
        await pressAll(ip, [0, 1, 2]);
        const fourth = await pressSignIn(h, ip, 2 + d);
        expect(fourth.status).toBe(d >= 10 ? 401 : 429);
      });
    }
  });

  describe('TC-008 Sign in: press while locked, by time', () => {
    for (const d of [8, 9, 10, 11]) {
      it(`d = ${String(d)}`, async () => {
        const ip = nextIp();
        await pressAll(ip, [0, 1, 2]);
        expect((await pressSignIn(h, ip, 3)).status).toBe(429);
        const press = await pressSignIn(h, ip, 2 + d);
        expect(press.status).toBe(d >= 10 ? 401 : 429);
      });
    }
  });

  async function resendVerification(email: string, ip: string, t: number) {
    clock.at(t);
    return h.call('/send-verification-email', { body: { email, callbackURL: '/sign-in' }, ip });
  }

  it('TC-011 resend verification link: requests 1 to 3 each send a link, 4 and 5 get 429 and send none', async () => {
    const { email } = await createUnverifiedAccount(h, fresh);
    const ip = nextIp();
    const sentAtStart = (await settleEmails(h.mailer, email)).length;
    const statuses: number[] = [];
    for (const t of [0, 1, 2]) statuses.push((await resendVerification(email, ip, t)).status);
    const sentBefore = (await settleEmails(h.mailer, email)).length;
    for (const t of [3, 4]) statuses.push((await resendVerification(email, ip, t)).status);

    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(sentBefore - sentAtStart).toBe(3);
    expect((await settleEmails(h.mailer, email)).length).toBe(sentBefore);
  });

  describe('TC-012 resend verification link: time of the 4th request', () => {
    for (const d of [58, 59, 60, 61]) {
      it(`d = ${String(d)}`, async () => {
        const { email } = await createUnverifiedAccount(h, fresh);
        const ip = nextIp();
        for (const t of [0, 1, 2]) await resendVerification(email, ip, t);
        const sentBefore = (await settleEmails(h.mailer, email)).length;

        const fourth = await resendVerification(email, ip, 2 + d);
        const sentAfter = (await settleEmails(h.mailer, email)).length;
        expect(fourth.status).toBe(d >= 60 ? 200 : 429);
        expect(sentAfter > sentBefore).toBe(d >= 60);
      });
    }
  });

  async function reset(email: string, ip: string, t: number) {
    clock.at(t);
    return requestReset(h, email, ip);
  }

  it('TC-013 reset link: requests 1 to 3 each send a link, 4 and 5 get 429 and send none', async () => {
    const account = await createVerifiedAccount(h, fresh);
    const ip = nextIp();
    const sentAtStart = (await settleEmails(h.mailer, account.email)).length;
    const statuses: number[] = [];
    for (const t of [0, 1, 2]) statuses.push((await reset(account.email, ip, t)).status);
    const sentBefore = (await settleEmails(h.mailer, account.email)).length;
    for (const t of [3, 4]) statuses.push((await reset(account.email, ip, t)).status);

    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(sentBefore - sentAtStart).toBe(3);
    expect((await settleEmails(h.mailer, account.email)).length).toBe(sentBefore);
  });

  describe('TC-014 reset link: time of the 4th request', () => {
    for (const d of [58, 59, 60, 61]) {
      it(`d = ${String(d)}`, async () => {
        const account = await createVerifiedAccount(h, fresh);
        const ip = nextIp();
        for (const t of [0, 1, 2]) await reset(account.email, ip, t);
        const sentBefore = (await settleEmails(h.mailer, account.email)).length;

        const fourth = await reset(account.email, ip, 2 + d);
        const sentAfter = (await settleEmails(h.mailer, account.email)).length;
        expect(fourth.status).toBe(d >= 60 ? 200 : 429);
        expect(sentAfter > sentBefore).toBe(d >= 60);
      });
    }
  });

  async function signUp(email: string, ip: string, t: number) {
    clock.at(t);
    return h.call('/sign-up/email', {
      body: { name: 'Rate Limit', email, password: 'Correct-Horse-91', callbackURL: '/sign-in' },
      ip,
    });
  }

  it('TC-015 Create account: requests 1 to 3 each create an account, 4 and 5 get 429 and create none', async () => {
    const ip = nextIp();
    const emails = [0, 1, 2, 3, 4].map(() => uniqueEmail('signup-limit'));
    const statuses: number[] = [];
    for (const [t, email] of emails.entries()) statuses.push((await signUp(email, ip, t)).status);

    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    for (const email of emails.slice(0, 3)) expect(await countUsers(email)).toBe(1);
    expect(await countUsers(emails[3] ?? '')).toBe(0);
    expect(await countUsers(emails[4] ?? '')).toBe(0);
  });

  describe('TC-016 Create account: time of the 4th request', () => {
    for (const d of [8, 9, 10, 11]) {
      it(`d = ${String(d)}`, async () => {
        const ip = nextIp();
        for (const t of [0, 1, 2]) await signUp(uniqueEmail('signup-limit'), ip, t);
        const fourthEmail = uniqueEmail('signup-limit');
        const fourth = await signUp(fourthEmail, ip, 2 + d);
        expect(fourth.status).toBe(d >= 10 ? 200 : 429);
        expect(await countUsers(fourthEmail)).toBe(d >= 10 ? 1 : 0);
      });
    }
  });

  it('TC-020 rounds X-Retry-After up to whole seconds', async () => {
    const ip = nextIp();
    await pressAll(ip, [0, 1, 2]);
    const response = await pressSignIn(h, ip, 10.5);
    expect(response.status).toBe(429);
    expect(response.headers.get('x-retry-after')).toBe('2');
  });
});
