// Reset links and verification links of the auth API: which link still works after a newer link,
// after use, after expiry, or after another link set the password.
//
// How these tests run: `support/harness.ts` sends requests straight to the Better Auth handler
// (no HTTP server) with the same configuration as production code, on the `<POSTGRES_DB>_test`
// database. Emails go to an in-memory mailer, and every outbound HTTP call (Google, Pwned
// Passwords) goes to the fakes in `support/outbound.ts`. Each test uses its own client IP, because
// rate limits count requests per IP. Run with `pnpm test` after `pnpm db:up`.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  controlClock,
  createHarness,
  createIpPool,
  createUnverifiedAccount,
  createVerifiedAccount,
  type Harness,
  HOUR,
  MINUTE,
  NEW_PASSWORD,
  newResetToken,
  OTHER_PASSWORD,
  passwordWorks,
  pool,
  resetPassword,
  sessionSetCookie,
} from '../support/harness';

const ip = createIpPool(4);
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

describe('Reset link', () => {
  it('TC-063 an older link still works after a newer link is sent', async () => {
    const account = await createVerifiedAccount(h, ip);
    const t1 = await newResetToken(h, account.email, ip(), 1);
    await newResetToken(h, account.email, ip(), 2);

    expect((await resetPassword(h, t1, NEW_PASSWORD, ip())).status).toBe(200);
    expect(await passwordWorks(h, account.email, NEW_PASSWORD, ip())).toBe(true);
  });

  describe('TC-066 a new link does not make a used or expired link work again', () => {
    it('row 1: T1 used', async () => {
      const account = await createVerifiedAccount(h, ip);
      const t1 = await newResetToken(h, account.email, ip(), 1);
      expect((await resetPassword(h, t1, NEW_PASSWORD, ip())).status).toBe(200);
      await newResetToken(h, account.email, ip(), 2);

      expect((await resetPassword(h, t1, OTHER_PASSWORD, ip())).status).toBe(400);
      expect(await passwordWorks(h, account.email, NEW_PASSWORD, ip())).toBe(true);
    });

    it('row 2: T1 expired', async () => {
      const account = await createVerifiedAccount(h, ip);
      clock.at(0);
      const t1 = await newResetToken(h, account.email, ip(), 1);
      clock.at(HOUR + MINUTE);
      await newResetToken(h, account.email, ip(), 2);

      expect((await resetPassword(h, t1, NEW_PASSWORD, ip())).status).toBe(400);
      expect(await passwordWorks(h, account.email, account.password, ip())).toBe(true);
    });
  });

  it('TC-068 setting a password with one link invalidates the other links', async () => {
    const account = await createVerifiedAccount(h, ip);
    const t1 = await newResetToken(h, account.email, ip(), 1);
    const t2 = await newResetToken(h, account.email, ip(), 2);

    expect((await resetPassword(h, t2, NEW_PASSWORD, ip())).status).toBe(200);
    expect((await resetPassword(h, t1, OTHER_PASSWORD, ip())).status).toBe(400);
    expect(await passwordWorks(h, account.email, NEW_PASSWORD, ip())).toBe(true);
  });

  describe('TC-069 a used or expired link stays rejected after another link sets the password', () => {
    it('row 1: T1 used', async () => {
      const account = await createVerifiedAccount(h, ip);
      const t1 = await newResetToken(h, account.email, ip(), 1);
      expect((await resetPassword(h, t1, NEW_PASSWORD, ip())).status).toBe(200);
      const t2 = await newResetToken(h, account.email, ip(), 2);
      await resetPassword(h, t2, OTHER_PASSWORD, ip());

      expect((await resetPassword(h, t1, 'Third-Horse-94', ip())).status).toBe(400);
    });

    it('row 2: T1 expired', async () => {
      const account = await createVerifiedAccount(h, ip);
      clock.at(0);
      const t1 = await newResetToken(h, account.email, ip(), 1);
      clock.at(HOUR);
      const t2 = await newResetToken(h, account.email, ip(), 2);
      clock.at(HOUR + MINUTE);
      expect((await resetPassword(h, t2, NEW_PASSWORD, ip())).status).toBe(200);

      expect((await resetPassword(h, t1, OTHER_PASSWORD, ip())).status).toBe(400);
    });
  });
});

describe('Verification link', () => {
  it('TC-077 the link of an already verified email expires and creates no session', async () => {
    clock.at(0);
    const { link } = await createUnverifiedAccount(h, ip);
    clock.at(10);
    expect((await h.call(link, { method: 'GET', ip: ip() })).status).toBe(302);

    clock.at(HOUR + MINUTE);
    const response = await h.call(link, { method: 'GET', ip: ip() });
    expect(response.headers.get('location') ?? '').toMatch(/[?&]error=/);
    expect(sessionSetCookie(response)).toBeUndefined();
  });
});
