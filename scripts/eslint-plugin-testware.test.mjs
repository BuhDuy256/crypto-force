// Tests of the testware lint rules: each rule reports the bad tests it is for (most come from the
// auth testware before it was fixed) and accepts valid tests. Run with `pnpm check:rules`.
import { RuleTester } from 'eslint';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import tseslint from 'typescript-eslint';
import testware from './eslint-plugin-testware.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

const root = join(import.meta.dirname, '..');
const webUnitTest = join(root, 'apps/web/app/utils/auth-redirect.test.ts');
const apiTest = join(root, 'apps/api/test/auth/rate-limit.test.ts');
const e2eTest = join(root, 'apps/web/e2e/auth/security.spec.ts');
const rule = (/** @type {string} */ name) => {
  const found = testware.rules?.[name];
  if (!found || typeof found === 'function') throw new Error(`Rule ${name} is missing`);
  return found;
};

tester.run('no-implementation-oracle', rule('no-implementation-oracle'), {
  valid: [
    {
      filename: webUnitTest,
      code: `import { getSafeNext } from './auth-redirect';
        expect(getSafeNext('//evil.example')).toBe('/realtime');`,
    },
    {
      filename: apiTest,
      code: `import { PASSWORD } from '../support/harness';
        expect(account.password).toBe(PASSWORD);`,
    },
    {
      filename: apiTest,
      code: `import { AppError } from '../../src/errors/app-error';
        expect(() => run()).toThrow(AppError);`,
    },
    {
      filename: apiTest,
      code: `import type { Limit } from '../../src/configs/auth';
        const limit: Limit = { max: 3 };
        expect(limit.max).toBe(3);`,
    },
    {
      filename: join(root, 'packages/shared/test/auth.schema.test.ts'),
      code: `import { signUpSchema } from '../src/schemas/auth.schema';
        expect(signUpSchema.safeParse({ password: 'a'.repeat(7) }).success).toBe(false);`,
    },
  ],
  invalid: [
    {
      name: 'a test that checks an exported constant (auth-redirect.test.ts before the fix)',
      filename: webUnitTest,
      code: `import { DEFAULT_DESTINATION } from './auth-redirect';
        expect(DEFAULT_DESTINATION).toBe('/realtime');`,
      errors: [{ message: /a value in the code, not a behavior/ }],
    },
    {
      name: 'an expected value taken from the code under test',
      filename: webUnitTest,
      code: `import { DEFAULT_DESTINATION, getSafeNext } from './auth-redirect';
        expect(getSafeNext(null)).toBe(DEFAULT_DESTINATION);`,
      errors: [{ message: /expected value comes from the code under test/ }],
    },
    {
      name: 'an expected value taken from the code through a local constant',
      filename: webUnitTest,
      code: `import { DEFAULT_DESTINATION, getSafeNext } from '~/utils/auth-redirect';
        const expected = DEFAULT_DESTINATION;
        expect(getSafeNext(null)).toBe(expected);`,
      errors: [{ message: /expected value comes from the code under test/ }],
    },
    {
      name: 'an expected value computed from a production setting',
      filename: apiTest,
      code: `import { SIGN_IN_RATE_LIMIT } from '../../src/configs/auth';
        expect(response.headers.get('x-retry-after')).toBe(String(SIGN_IN_RATE_LIMIT.window));`,
      errors: [{ message: /expected value comes from the code under test/ }],
    },
    {
      name: 'a test that reads a setting of the configured object instead of its behavior',
      filename: apiTest,
      code: `import { authOptions } from '../../src/configs/auth';
        expect(authOptions.rateLimit.max).toBe(3);`,
      errors: [{ message: /a value in the code, not a behavior/ }],
    },
  ],
});

tester.run('no-app-module-mocks', rule('no-app-module-mocks'), {
  valid: [
    { filename: apiTest, code: `vi.spyOn(console, 'error');` },
    { filename: apiTest, code: `vi.spyOn(globalThis, 'fetch');` },
    { filename: apiTest, code: `vi.mock('../support/outbound');` },
    { filename: apiTest, code: `vi.useFakeTimers({ toFake: ['Date'] });` },
  ],
  invalid: [
    {
      filename: apiTest,
      code: `vi.mock('../../src/services/mailer');`,
      errors: [{ message: /Do not replace the app module/ }],
    },
    {
      filename: webUnitTest,
      code: `vi.mock('~/api/auth', () => ({ signIn: vi.fn() }));`,
      errors: [{ message: /Do not replace the app module/ }],
    },
    {
      filename: apiTest,
      code: `vi.doMock(import('../../src/services/mailer'));`,
      errors: [{ message: /Do not replace the app module/ }],
    },
    {
      filename: apiTest,
      code: `import * as emails from '../../src/services/auth-email.service';
        vi.spyOn(emails, 'createAuthEmails');`,
      errors: [{ message: /Do not replace a function of/ }],
    },
  ],
});

tester.run('exact-status-oracle', rule('exact-status-oracle'), {
  valid: [
    { filename: apiTest, code: `expect(response.status).toBe(401);` },
    { filename: apiTest, code: `expect(statuses).toEqual([401, 401, 401, 429, 429]);` },
    { filename: apiTest, code: `expect(registered.status).toBe(fresh.status);` },
    { filename: apiTest, code: `if (response.status !== 200) throw new Error('Sign up failed');` },
    { filename: apiTest, code: `const body = response.status === 200 ? await read() : {};` },
    { filename: apiTest, code: `expect(results.every((r) => r.status === 200)).toBe(true);` },
    { filename: apiTest, code: `expect(code).not.toBe(0);` },
    {
      filename: e2eTest,
      code: `expect(await field.getAttribute('autocomplete')).not.toBe('off');`,
    },
  ],
  invalid: [
    {
      name: 'a helper that accepts any status but 429 (rate-limit.test.ts before the fix)',
      filename: apiTest,
      code: `const accepted = (response: Response) => response.status !== 429;`,
      errors: [{ message: /only tells what the HTTP status is not/ }],
    },
    {
      name: 'a boolean per status (rate-limit.test.ts before the fix)',
      filename: apiTest,
      code: `expect(results.map((response) => response.status === 429)).toEqual([false, true]);`,
      errors: [{ message: /turns each status into true or false/ }],
    },
    {
      filename: apiTest,
      code: `expect(statuses.map((status) => status === 429)).toEqual([false, true]);`,
      errors: [{ message: /turns each status into true or false/ }],
    },
    {
      filename: apiTest,
      code: `expect(response.status).not.toBe(429);`,
      errors: [{ message: /only tells what the HTTP status is not/ }],
    },
    {
      filename: e2eTest,
      code: `expect(response.status()).not.toBe(500);`,
      errors: [{ message: /only tells what the HTTP status is not/ }],
    },
    {
      filename: apiTest,
      code: `expect(response.status).toBeLessThan(400);`,
      errors: [{ message: /only tells what the HTTP status is not/ }],
    },
  ],
});

tester.run('no-app-constants', rule('no-app-constants'), {
  valid: [
    {
      filename: webUnitTest,
      code: `import { getSafeNext } from './auth-redirect';
        expect(getSafeNext('//evil.example')).toBe('/realtime');`,
    },
    {
      name: 'a constant of the test support code',
      filename: apiTest,
      code: `import { SESSION_TOKEN_LOG } from '../support/harness';`,
    },
    {
      filename: apiTest,
      code: `import type { RATE_LIMITS } from '../../src/auth/rate-limits';`,
    },
    {
      name: 'a class or a function from the app, not a constant',
      filename: apiTest,
      code: `import { AppError, createApp } from '../../src/app';`,
    },
  ],
  invalid: [
    {
      name: 'the default destination (auth-redirect.test.ts before the fix)',
      filename: webUnitTest,
      code: `import { DEFAULT_DESTINATION, getSafeNext } from './auth-redirect';`,
      errors: [{ message: /"DEFAULT_DESTINATION" from \.\/auth-redirect is a value in the code/ }],
    },
    {
      name: 'a boundary value taken from the setting under test',
      filename: apiTest,
      code: `import * as limits from '../../src/auth/rate-limits';
        for (let i = 0; i < limits.SIGN_IN_RATE_LIMIT.max; i++) await signIn();`,
      errors: [{ message: /"SIGN_IN_RATE_LIMIT" from \.\.\/\.\.\/src\/auth\/rate-limits/ }],
    },
    {
      filename: apiTest,
      code: `import { MAX } from '@crypto-force/shared';`,
      errors: [{ message: /"MAX" from @crypto-force\/shared/ }],
    },
  ],
});

tester.run('require-expect', rule('require-expect'), {
  valid: [
    {
      filename: e2eTest,
      code: `test('TC-184 reload', async ({ page }) => {
        await page.reload();
        await expect(page.getByRole('heading')).toBeVisible();
      });`,
    },
    {
      name: 'an assertion helper (links.spec.ts)',
      filename: e2eTest,
      code: `const expectExpiredScreen = async (page) => {
          await expect(page.getByRole('heading')).toBeVisible();
        };
        test('TC-062 expired link', async ({ page }) => {
          await page.goto(link);
          await expectExpiredScreen(page);
        });`,
    },
    {
      name: 'a blocked test that always skips (forms.spec.ts)',
      filename: e2eTest,
      code: `test('TC-103 blocked', () => {
        test.skip(true, 'Blocked: the fake Google cannot answer the code exchange.');
      });`,
    },
    {
      filename: e2eTest,
      code: `test.describe('Sign in', () => {
        test.beforeEach(async ({ page }) => { await page.goto('/sign-in'); });
      });`,
    },
  ],
  invalid: [
    {
      name: 'the helper hid the assertions (links.spec.ts before the rename)',
      filename: e2eTest,
      code: `test('TC-062 expired link', async ({ page }) => {
        await page.goto(link);
        await expiredScreen(page);
      });`,
      errors: [{ message: /This test has no expect\(\) in its body/ }],
    },
    {
      name: 'a skip that depends on a condition still runs the test',
      filename: e2eTest,
      code: `test('TC-001 sign in', async ({ page }) => {
        test.skip(!process.env.GOOGLE_CLIENT_ID, 'No Google');
        await page.goto('/sign-in');
      });`,
      errors: [{ message: /This test has no expect\(\) in its body/ }],
    },
    {
      name: 'an assertion helper with no assertion in it',
      filename: e2eTest,
      code: `async function expectSignedIn(page) { await page.goto('/realtime'); }`,
      errors: [{ message: /"expectSignedIn" is named as an assertion helper/ }],
    },
    {
      name: 'an assertion helper that only calls another helper',
      filename: e2eTest,
      code: `const expectSignedIn = (page) => expectRealtime(page);`,
      errors: [{ message: /"expectSignedIn" is named as an assertion helper/ }],
    },
  ],
});

tester.run('exact-status-oracle: other forms of a weak status check', rule('exact-status-oracle'), {
  valid: [
    { filename: apiTest, code: `expect(response.statusCode).toBe(302);` },
    { filename: apiTest, code: `expect(result.success).toBe(true);` },
  ],
  invalid: [
    {
      name: 'node:http status',
      filename: apiTest,
      code: `expect(response.statusCode).not.toBe(429);`,
      errors: [{ message: /only tells what the HTTP status is not/ }],
    },
    {
      name: 'a set of statuses',
      filename: apiTest,
      code: `expect(response.status).toBeOneOf([200, 302]);`,
      errors: [{ message: /only tells what the HTTP status is not, or gives a range/ }],
    },
    {
      name: 'response.ok is a range',
      filename: e2eTest,
      code: `expect(response.ok()).toBe(true);`,
      errors: [{ message: /response.ok is true for each status from 200 to 299/ }],
    },
    {
      filename: apiTest,
      code: `expect(response.ok).toBe(true);`,
      errors: [{ message: /response.ok is true for each status from 200 to 299/ }],
    },
  ],
});

tester.run('no-app-module-mocks: a template literal path', rule('no-app-module-mocks'), {
  valid: [{ filename: apiTest, code: 'vi.mock(`../support/outbound`);' }],
  invalid: [
    {
      filename: apiTest,
      code: 'vi.mock(`../../src/services/mailer`);',
      errors: [{ message: /the app module \.\.\/\.\.\/src\/services\/mailer/ }],
    },
  ],
});

tester.run('no-real-time-wait', rule('no-real-time-wait'), {
  valid: [
    {
      name: 'a guard timer that kills a process (security.test.ts)',
      filename: apiTest,
      code: `const timer = setTimeout(() => child.kill(), 20_000);`,
    },
    {
      name: 'a wait for a condition',
      filename: e2eTest,
      code: `await expect(page.getByText('Sent')).toBeVisible();`,
    },
    {
      name: 'one turn of the event loop',
      filename: apiTest,
      code: `await new Promise((resolve) => setImmediate(resolve));`,
    },
    {
      name: 'a guard timer with a named callback',
      filename: apiTest,
      code: `const timer = setTimeout(killChild, 20_000);`,
    },
    {
      name: 'a guard timer inside a promise that rejects (api-process.ts)',
      filename: apiTest,
      code: `await new Promise((resolve, reject) => { const timer = setTimeout(() => { reject(new Error('no start')); }, 30_000); });`,
    },
  ],
  invalid: [
    {
      name: 'a fixed wait in Playwright (links.spec.ts TC-189 before the fix)',
      filename: e2eTest,
      code: `await page.waitForTimeout(2_000);`,
      errors: [{ message: /waits a fixed time on the real clock/ }],
    },
    {
      name: 'a sleep until a time on the real clock (rate-limit.test.ts TC-005 before the fix)',
      filename: apiTest,
      code: `if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));`,
      errors: [{ message: /waits a fixed time on the real clock/ }],
    },
    {
      name: 'a sleep with a callback that resolves',
      filename: apiTest,
      code: `await new Promise((resolve) => { setTimeout(() => { resolve(); }, 200); });`,
      errors: [{ message: /waits a fixed time on the real clock/ }],
    },
    {
      name: 'resolve with an argument',
      filename: apiTest,
      code: `await new Promise((done) => setTimeout(() => done(undefined), 200));`,
      errors: [{ message: /waits a fixed time on the real clock/ }],
    },
    {
      name: 'globalThis.setTimeout',
      filename: apiTest,
      code: `await new Promise((resolve) => globalThis.setTimeout(resolve, 200));`,
      errors: [{ message: /waits a fixed time on the real clock/ }],
    },
    {
      name: 'a namespace import of timers/promises',
      filename: apiTest,
      code: `import * as timers from 'node:timers/promises';
        await timers.setTimeout(200);`,
      errors: [{ message: /waits a fixed time on the real clock/ }],
    },
    {
      name: 'setTimeout from timers/promises',
      filename: apiTest,
      code: `import { setTimeout as sleep } from 'node:timers/promises';
        await sleep(200);`,
      errors: [{ message: /waits a fixed time on the real clock/ }],
    },
  ],
});
