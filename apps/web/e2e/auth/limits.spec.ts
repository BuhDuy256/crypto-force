// What the user sees when an attempt limit blocks a request: the Sign in lock, and the limits on
// Create account, resend verification link and Send reset link. To reach a limit fast, a test
// sends the first requests through the API, then makes the last one through the UI.
//
// How these tests run: Playwright opens the real app in Chromium. `playwright.config.ts` starts
// the E2E servers (see `e2e/environment.ts`): a fresh database, and emails printed to the server
// console instead of sent; `fixtures.ts` reads links from that console. Each test has its own
// client IP (`x-forwarded-for`), because rate limits count requests per IP. Accounts are created
// through the API or the database to save time; only the step under test goes through the UI.
// Run with `pnpm test:e2e` after `pnpm db:up`, with `pnpm dev` stopped.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import type { APIRequestContext, Page } from '@playwright/test';
import {
  APP_ORIGIN_HEADERS,
  authForm,
  contextWithIp,
  createVerifiedUser,
  expect,
  fillSignIn,
  fillSignUp,
  newUser,
  sessionEmail,
  test,
  WRONG_PASSWORD,
} from './fixtures';

/** The alert of a request that the server refused with 429: an error that suggests waiting. */
const waitHint = (page: Page) => page.getByRole('alert').filter({ hasText: /wait|try again/i });

async function preload(api: APIRequestContext, path: string, data: () => object, times = 3) {
  for (let n = 0; n < times; n++)
    await api.post(path, { data: data(), headers: APP_ORIGIN_HEADERS });
}

test.describe('TC-021 the UI when a request that sends email is refused', () => {
  test('row 1: Resend the link on Check your email; same message for an unregistered email', async ({
    browser,
  }) => {
    // Create account opens Check your email both for a new email and for the email of an
    // existing account, so the UI reaches this step with an email that had no account (run 2)
    // and with one that had (run 1).
    const resendPath = '/api/auth/send-verification-email';
    const existing = await createVerifiedUser();
    const messages: string[] = [];
    for (const [index, email] of [existing.email, newUser('unregistered').email].entries()) {
      const context = await contextWithIp(browser, `198.51.100.${String(21 + index)}`);
      const page = await context.newPage();
      await page.goto('/sign-up');
      await fillSignUp(page, { ...newUser(), email });
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
      await preload(page.request, resendPath, () => ({ email, callbackURL: '/sign-in' }));

      await page.getByRole('button', { name: /resend the link/i }).click();
      await expect(waitHint(page)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sent again' })).toHaveCount(0);
      messages.push((await waitHint(page).textContent()) ?? '');
      await context.close();
    }
    expect(messages[1]).toBe(messages[0]);
  });

  test('row 2: Send reset link for the 4th time in 60 s; same message for an unregistered email', async ({
    browser,
  }) => {
    const messages: string[] = [];
    for (const [index, registered] of [true, false].entries()) {
      const context = await contextWithIp(browser, `198.51.100.${String(23 + index)}`);
      const page = await context.newPage();
      const email = registered ? (await createVerifiedUser()).email : 'none@example.test';
      await preload(page.request, '/api/auth/request-password-reset', () => ({
        email,
        redirectTo: '/reset-password',
      }));
      await page.goto('/forgot-password');
      await authForm(page).email.fill(email);
      await authForm(page).sendReset.click();

      await expect(waitHint(page)).toBeVisible();
      await expect(page.getByText(/If an account exists for/)).toHaveCount(0);
      messages.push((await waitHint(page).textContent()) ?? '');
      await context.close();
    }
    expect(messages[1]).toBe(messages[0]);
  });

  test('row 3: Create account for the 4th time in 10 s; same message for a registered email', async ({
    browser,
  }) => {
    const messages: string[] = [];
    for (const [index, registered] of [true, false].entries()) {
      const context = await contextWithIp(browser, `198.51.100.${String(25 + index)}`);
      const page = await context.newPage();
      const user = registered ? await createVerifiedUser() : newUser('fresh');
      await preload(page.request, '/api/auth/sign-up/email', () => ({
        ...newUser('preload'),
        callbackURL: '/sign-in',
      }));
      await page.goto('/sign-up');
      await fillSignUp(page, { ...user, password: 'Other-Horse-93' });

      await expect(waitHint(page)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Check your email' })).toHaveCount(0);
      messages.push((await waitHint(page).textContent()) ?? '');
      await context.close();
    }
    expect(messages[1]).toBe(messages[0]);
  });
});

async function pressSignInFourTimes(page: Page, email: string, password: string) {
  for (let n = 0; n < 4; n++) {
    const response = page.waitForResponse('**/api/auth/sign-in/email');
    if (n === 0) await fillSignIn(page, email, password);
    else await authForm(page).signIn.click();
    await response;
  }
}

test.describe('TC-138 Sign in lock message while editing', () => {
  test.use({ clientIp: '198.51.100.138' });

  test('editing the password keeps the lock message', async ({ page }) => {
    await page.goto('/sign-in');
    await pressSignInFourTimes(page, 'nobody@example.test', WRONG_PASSWORD);
    const lock = page.getByRole('alert').filter({ hasText: /Too many attempts/ });
    await expect(lock).toBeVisible();

    await authForm(page).password.fill(`${WRONG_PASSWORD}x`);
    await expect(lock).toBeVisible();
  });
});

test.describe('TC-175 Sign in lock in the UI', () => {
  test.use({ clientIp: '198.51.100.175' });

  test('the 4th press locks Sign in and suggests waiting or resetting the password', async ({
    page,
  }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await pressSignInFourTimes(page, user.email, WRONG_PASSWORD);

    const lock = page.getByRole('alert').filter({ hasText: /wait|try again/i });
    await expect(lock).toBeVisible();
    await expect(lock.getByRole('link', { name: /reset password/i })).toBeVisible();
    expect(await sessionEmail(page.request)).toBeNull();
  });
});
