// Smoke test: create an account, open the verification link, then sign in. `vitest.config.ts`
// runs this file first. When it fails, the auth API or its database does not work, and the
// failures of the other files say nothing about single features: fix this first.
import { afterAll, describe, expect, it } from 'vitest';
import {
  createHarness,
  createIpPool,
  createUnverifiedAccount,
  getSession,
  pool,
  signIn,
} from './support/harness';

const h = createHarness();
const ip = createIpPool(1);

afterAll(async () => {
  await pool.end();
});

describe('Smoke', () => {
  it('creates an account, confirms the email and signs in', async () => {
    const account = await createUnverifiedAccount(h, ip);
    const verify = await h.call(account.link, { method: 'GET', ip: ip() });
    expect(verify.status).toBe(302);

    const { response, cookie } = await signIn(h, account.email, account.password, ip());
    expect(response.status).toBe(200);
    const { body } = await getSession(h, cookie);
    expect(body?.user.email).toBe(account.email);
  });
});
