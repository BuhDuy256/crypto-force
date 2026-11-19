// Password rules of the auth API: length limits (counted in Unicode code points, never cut), the
// common-password list, and the Pwned Passwords check, also when that service fails.
//
// How these tests run: `support/harness.ts` sends requests straight to the Better Auth handler
// (no HTTP server) with the same configuration as production code, on the `<POSTGRES_DB>_test`
// database. Emails go to an in-memory mailer, and every outbound HTTP call (Google, Pwned
// Passwords) goes to the fakes in `support/outbound.ts`. Each test uses its own client IP, because
// rate limits count requests per IP. Run with `pnpm test` after `pnpm db:up`.
// Pwned Passwords: `markPwned` and `setPwnedMode` in `support/outbound.ts` choose the answer of the
// fake service.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  countUsers,
  createHarness,
  createIpPool,
  createVerifiedAccount,
  type Harness,
  linkIn,
  LOG_LEVEL,
  newResetToken,
  passwordWorks,
  pool,
  resetPassword,
  uniqueEmail,
  waitForEmail,
} from '../support/harness';
import { markPwned, outbound, resetOutbound, setPwnedMode } from '../support/outbound';
import { asciiPassword, EMOJI, randomPassword } from '../support/passwords';

const ip = createIpPool(5);
let h: Harness;

beforeEach(() => {
  resetOutbound();
  h = createHarness();
});

afterAll(async () => {
  await pool.end();
});

async function createAccount(password: string) {
  const email = uniqueEmail('password');
  const response = await h.call('/sign-up/email', {
    body: { name: 'Password Test', email, password, callbackURL: '/sign-in' },
    ip: ip(),
  });
  return { email, response, created: (await countUsers(email)) === 1 };
}

/** Sets `password` with a fresh reset link of a new verified account. */
async function setNewPassword(password: string) {
  const account = await createVerifiedAccount(h, ip);
  const token = await newResetToken(h, account.email, ip());
  const response = await resetPassword(h, token, password, ip());
  return { account, response, changed: await passwordWorks(h, account.email, password, ip()) };
}

async function verifyByLink(email: string) {
  const link = linkIn(await waitForEmail(h.mailer, email, 'Confirm'));
  await h.call(link, { method: 'GET', ip: ip() });
}

describe('Password length', () => {
  describe('TC-090 Create account: lower boundary', () => {
    for (const length of [6, 7, 8, 9]) {
      it(`${String(length)} characters`, async () => {
        const { created } = await createAccount(asciiPassword(length));
        expect(created).toBe(length >= 8);
      });
    }
  });

  describe('TC-091 Create account: upper boundary; the password is not cut', () => {
    for (const length of [127, 128, 129, 130]) {
      it(`${String(length)} characters`, async () => {
        const password = asciiPassword(length);
        const { email, created } = await createAccount(password);
        expect(created).toBe(length <= 128);
        if (length > 128) return;

        await verifyByLink(email);
        expect(await passwordWorks(h, email, password, ip())).toBe(true);
        expect(await passwordWorks(h, email, password.slice(0, -1), ip())).toBe(false);
      });
    }
  });

  describe('TC-092 New password: lower boundary', () => {
    for (const length of [6, 7, 8, 9]) {
      it(`${String(length)} characters`, async () => {
        const password = asciiPassword(length);
        const { account, changed } = await setNewPassword(password);
        expect(changed).toBe(length >= 8);
        if (length < 8) {
          expect(await passwordWorks(h, account.email, account.password, ip())).toBe(true);
        }
      });
    }
  });

  describe('TC-093 New password: upper boundary; the password is not cut', () => {
    for (const length of [127, 128, 129, 130]) {
      it(`${String(length)} characters`, async () => {
        const password = asciiPassword(length);
        const { account, changed } = await setNewPassword(password);
        expect(changed).toBe(length <= 128);
        if (length <= 128) {
          expect(await passwordWorks(h, account.email, password.slice(0, -1), ip())).toBe(false);
        }
      });
    }
  });

  describe('TC-096 Create account: length counts Unicode code points', () => {
    for (const count of [4, 8, 65, 129]) {
      it(`${String(count)} × ${EMOJI}`, async () => {
        const { created } = await createAccount(EMOJI.repeat(count));
        expect(created).toBe(count >= 8 && count <= 128);
      });
    }
  });

  describe('TC-097 New password: length counts Unicode code points', () => {
    for (const count of [4, 8, 65, 129]) {
      it(`${String(count)} × ${EMOJI}`, async () => {
        const { changed } = await setNewPassword(EMOJI.repeat(count));
        expect(changed).toBe(count >= 8 && count <= 128);
      });
    }
  });
});

describe('Common and breached passwords', () => {
  describe('TC-110 a password on the common-password list is rejected', () => {
    it('row 1: Create account with `password`', async () => {
      setPwnedMode('clean');
      const { created } = await createAccount('password');
      expect(created).toBe(false);
    });

    it('row 2: New password `12345678`', async () => {
      setPwnedMode('clean');
      const { account, changed } = await setNewPassword('12345678');
      expect(changed).toBe(false);
      expect(await passwordWorks(h, account.email, account.password, ip())).toBe(true);
    });
  });

  describe('TC-111 a password that the API reports as breached is rejected', () => {
    it('row 1: Create account', async () => {
      const password = randomPassword();
      markPwned(password);
      setPwnedMode('pwned');
      expect((await createAccount(password)).created).toBe(false);
    });

    it('row 2: New password', async () => {
      const password = randomPassword();
      markPwned(password);
      setPwnedMode('pwned');
      expect((await setNewPassword(password)).changed).toBe(false);
    });
  });

  describe('TC-112 a password that is not breached is accepted', () => {
    it('row 1: Create account', async () => {
      setPwnedMode('clean');
      expect((await createAccount(randomPassword())).created).toBe(true);
    });

    it('row 2: New password', async () => {
      setPwnedMode('clean');
      expect((await setNewPassword(randomPassword())).changed).toBe(true);
    });
  });

  const warnings = () => h.logs.filter((record) => record.level === LOG_LEVEL.warn).length;

  describe('TC-113 the Pwned Passwords API fails', () => {
    it('row 1: Create account is accepted and one warning is logged', async () => {
      setPwnedMode('unavailable');
      const before = warnings();
      expect((await createAccount(randomPassword())).created).toBe(true);
      expect(warnings() - before).toBe(1);
    });

    it('row 2: New password is accepted and one warning is logged', async () => {
      const account = await createVerifiedAccount(h, ip);
      const token = await newResetToken(h, account.email, ip());
      setPwnedMode('unavailable');
      const before = warnings();
      const password = randomPassword();
      expect((await resetPassword(h, token, password, ip())).status).toBe(200);
      expect(warnings() - before).toBe(1);
    });
  });

  describe('TC-114 the Pwned Passwords API does not answer', () => {
    it('row 1: Create account answers before the stub does, is accepted, logs one warning', async () => {
      setPwnedMode('no-answer');
      const before = warnings();
      const started = performance.now();
      const { created } = await createAccount(randomPassword());
      expect(performance.now() - started).toBeLessThan(10_000);
      expect(created).toBe(true);
      expect(warnings() - before).toBe(1);
    }, 20_000);

    it('row 2: New password answers before the stub does, is accepted, logs one warning', async () => {
      const account = await createVerifiedAccount(h, ip);
      const token = await newResetToken(h, account.email, ip());
      setPwnedMode('no-answer');
      const before = warnings();
      const started = performance.now();
      const response = await resetPassword(h, token, randomPassword(), ip());
      expect(performance.now() - started).toBeLessThan(10_000);
      expect(response.status).toBe(200);
      expect(warnings() - before).toBe(1);
    }, 20_000);
  });

  it('the stub saw no request that left the machine', () => {
    expect(outbound.unexpected).toEqual([]);
  });
});

describe('ASVS password checks', () => {
  it('TC-201 a lowercase-only password is accepted', async () => {
    setPwnedMode('clean');
    expect((await createAccount('qzmvbtkw')).created).toBe(true);
  });

  it('TC-203 the password is checked exactly as typed', async () => {
    const password = '  Pass Word Ab9  ';
    const account = await createVerifiedAccount(h, ip, { password });
    expect(await passwordWorks(h, account.email, password, ip())).toBe(true);
    expect(await passwordWorks(h, account.email, 'Pass Word Ab9', ip())).toBe(false);
    expect(await passwordWorks(h, account.email, '  pass word ab9  ', ip())).toBe(false);
  });
});
