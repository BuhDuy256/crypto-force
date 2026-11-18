// Reset links and verification links opened in the browser: valid, used, expired and changed
// links, and the Reset password flows from Forgot password to Sign in.
//
// How these tests run: Playwright opens the real app in Chromium. `playwright.config.ts` starts
// the E2E servers (see `e2e/environment.ts`): a fresh database, and emails printed to the server
// console instead of sent; `fixtures.ts` reads links from that console. Each test has its own
// client IP (`x-forwarded-for`), because rate limits count requests per IP. Accounts are created
// through the API or the database to save time; only the step under test goes through the UI.
// Run with `pnpm test:e2e` after `pnpm db:up`, with `pnpm dev` stopped.
// Expired links: the browser cannot move the server clock, so `fixtures.ts` makes a reset link
// expired in the database, and signs a copy of a verification link that expired a minute ago.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import type { Page } from '@playwright/test';
import {
  APP_ORIGIN_HEADERS,
  authForm,
  backtestHeading,
  contextWithIp,
  createUnverifiedUser,
  createVerifiedUser,
  emailsTo,
  expect,
  expiredVerificationLink,
  expireResetLink,
  fillSignIn,
  isEmailVerified,
  linkIn,
  MESSAGES,
  NEW_PASSWORD,
  OTHER_PASSWORD,
  passwordWorks,
  realtimeHeading,
  resetLink,
  resetTokenOf,
  sessionAcceptedFor,
  sessionCookie,
  sessionEmail,
  signInAs,
  signOutFromMenu,
  tamperToken,
  test,
  verificationLink,
  waitForEmail,
} from './fixtures';
import { query } from '../environment';

const chooseHeading = (page: Page) => page.getByRole('heading', { name: 'Choose a new password' });
const expectExpiredScreen = async (page: Page) => {
  await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Send a new link' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to sign in' })).toBeVisible();
};
const passwordUpdated = (page: Page) => page.getByText(/^Password updated\./);
/** The error for a bad verification link: it names the link and offers a way to get a new one. */
const verificationLinkError = async (page: Page) => {
  const alert = page.getByRole('alert').filter({ hasText: /confirmation link/i });
  await expect(alert).toBeVisible();
  await expect(
    page
      .getByRole('button', { name: /resend|new link/i })
      .or(page.getByRole('link', { name: /resend|new link/i })),
  ).toBeVisible();
};

async function saveNewPassword(page: Page, password: string, confirm = password) {
  await authForm(page).newPassword.fill(password);
  await authForm(page).confirmPassword.fill(confirm);
  await authForm(page).saveNewPassword.click();
}

async function useResetLinkByApi(page: Page, link: string, password: string) {
  const response = await page.request.post('/api/auth/reset-password', {
    data: { token: resetTokenOf(link), newPassword: password },
    headers: APP_ORIGIN_HEADERS,
  });
  expect(response.status()).toBe(200);
}

test.describe('reset link', () => {
  test('TC-060 a valid link opens in two tabs; saving signs out every browser', async ({
    browser,
  }) => {
    const user = await createVerifiedUser();
    const browser1 = await contextWithIp(browser);
    const browser2 = await contextWithIp(browser);
    await signInAs(browser1, user);
    await signInAs(browser2, user);
    const cookie1 = (await sessionCookie(browser1))?.value ?? '';
    const cookie2 = (await sessionCookie(browser2))?.value ?? '';

    // A signed-in browser opening /forgot-password is sent to Realtime, so the link is asked for
    // in a third browser that is not signed in, as a user who forgot the password would do.
    const browser3 = await contextWithIp(browser);
    const forgot = await browser3.newPage();
    await forgot.goto('/forgot-password');
    await authForm(forgot).email.fill(user.email);
    await authForm(forgot).sendReset.click();
    await expect(forgot.getByText(`If an account exists for ${user.email}`)).toBeVisible();
    const link = linkIn(await waitForEmail(user.email, 'Reset'));
    await browser3.close();

    const tab1 = await browser1.newPage();
    await tab1.goto(link);
    await expect(chooseHeading(tab1)).toBeVisible();
    const tab2 = await browser1.newPage();
    await tab2.goto(link);
    await expect(chooseHeading(tab2)).toBeVisible();
    await saveNewPassword(tab2, NEW_PASSWORD);

    await expect(passwordUpdated(tab2)).toBeVisible();
    await expect(tab2.getByRole('link', { name: 'Sign in' })).toBeVisible();
    expect(await sessionAcceptedFor(cookie1)).toBeNull();
    expect(await sessionAcceptedFor(cookie2)).toBeNull();
    await browser1.close();
    await browser2.close();
  });

  test('TC-061 an invalid new password does not use up the link', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto(await resetLink(user.email));
    await saveNewPassword(page, 'Short12');
    await expect(page.getByText(MESSAGES.passwordMin)).toBeVisible();
    expect(await passwordWorks(user.email, user.password)).toBe(true);

    await saveNewPassword(page, NEW_PASSWORD);
    await expect(passwordUpdated(page)).toBeVisible();
  });

  test('TC-062 an expired link shows the expired-link screen', async ({ page }) => {
    const user = await createVerifiedUser();
    const link = await resetLink(user.email);
    await expireResetLink(link);
    await page.goto(link);
    await expectExpiredScreen(page);
  });

  test('TC-064 a used link shows the expired-link screen', async ({ page }) => {
    const user = await createVerifiedUser();
    const link = await resetLink(user.email);
    await useResetLinkByApi(page, link, NEW_PASSWORD);
    await page.goto(link);
    await expectExpiredScreen(page);
  });

  test('TC-065 saving from a second tab after the link was used', async ({ page, context }) => {
    const user = await createVerifiedUser();
    const link = await resetLink(user.email);
    await page.goto(link);
    const tab2 = await context.newPage();
    await tab2.goto(link);
    await saveNewPassword(page, NEW_PASSWORD);
    await expect(passwordUpdated(page)).toBeVisible();
    await saveNewPassword(tab2, OTHER_PASSWORD);

    await expectExpiredScreen(tab2);
    expect(await passwordWorks(user.email, NEW_PASSWORD)).toBe(true);
    expect(await passwordWorks(user.email, OTHER_PASSWORD)).toBe(false);
  });

  test('TC-067 saving from a form opened before the link expired', async ({ page }) => {
    const user = await createVerifiedUser();
    const link = await resetLink(user.email);
    await page.goto(link);
    await expect(chooseHeading(page)).toBeVisible();
    await expireResetLink(link);
    await saveNewPassword(page, NEW_PASSWORD);

    await expectExpiredScreen(page);
    expect(await passwordWorks(user.email, user.password)).toBe(true);
  });
});

test.describe('verification link', () => {
  test('TC-070 the first opening verifies the account and opens Realtime', async ({ page }) => {
    const user = await createUnverifiedUser();
    await page.goto(await verificationLink(user.email));
    await expect(realtimeHeading(page)).toBeVisible();
    expect(await sessionEmail(page.request)).toBe(user.email);
  });

  test('TC-071 the link of B while signed in as A', async ({ page, context, browser }) => {
    const a = await createVerifiedUser('a');
    const b = await createUnverifiedUser('b');
    await signInAs(context, a);
    await page.goto(await verificationLink(b.email));

    await expect(
      page.getByText(`${b.email} is verified. You’re still signed in as ${a.email}.`),
    ).toBeVisible();
    expect(await sessionEmail(page.request)).toBe(a.email);
    const other = await contextWithIp(browser);
    const otherPage = await other.newPage();
    await otherPage.goto('/sign-in');
    await fillSignIn(otherPage, b.email, b.password);
    await expect(realtimeHeading(otherPage)).toBeVisible();
    await other.close();
  });

  test('TC-072 an expired link without a session', async ({ page }) => {
    const b = await createUnverifiedUser();
    await page.goto(await expiredVerificationLink(await verificationLink(b.email)));
    await verificationLinkError(page);
    expect(await sessionEmail(page.request)).toBeNull();
    expect(await isEmailVerified(b.email)).toBe(false);
  });

  test('TC-073 an older link after the email was verified with a newer one', async ({
    browser,
  }) => {
    const b = await createUnverifiedUser();
    const l1 = await verificationLink(b.email, 1);
    const resend = await contextWithIp(browser);
    await resend.request.post('/api/auth/send-verification-email', {
      data: { email: b.email, callbackURL: '/sign-in' },
      headers: APP_ORIGIN_HEADERS,
    });
    await resend.close();
    const l2 = await verificationLink(b.email, 2);

    const browser1 = await contextWithIp(browser);
    await (await browser1.newPage()).goto(l2);
    const browser2 = await contextWithIp(browser);
    const page2 = await browser2.newPage();
    await page2.goto(l1);

    await expect(authForm(page2).signIn).toBeVisible();
    await expect(page2.getByRole('alert')).toHaveCount(0);
    expect(await sessionEmail(page2.request)).toBeNull();
    await browser1.close();
    await browser2.close();
  });

  test('TC-074 a used link opened again without a session', async ({ browser }) => {
    const b = await createUnverifiedUser();
    const link = await verificationLink(b.email);
    const browser1 = await contextWithIp(browser);
    await (await browser1.newPage()).goto(link);
    await browser1.close();

    const browser2 = await contextWithIp(browser);
    const page2 = await browser2.newPage();
    await page2.goto(link);
    await expect(authForm(page2).signIn).toBeVisible();
    await expect(page2.getByRole('alert')).toHaveCount(0);
    expect(await sessionEmail(page2.request)).toBeNull();
    await browser2.close();
  });

  test('TC-075 a used link opened again with the session of the same account', async ({ page }) => {
    const b = await createUnverifiedUser();
    const link = await verificationLink(b.email);
    await page.goto(link);
    await expect(realtimeHeading(page)).toBeVisible();
    await page.goto(link);
    await expect(realtimeHeading(page)).toBeVisible();
    expect(await sessionEmail(page.request)).toBe(b.email);
  });

  test('TC-076 the link of a verified B while signed in as A', async ({
    page,
    context,
    browser,
  }) => {
    const b = await createUnverifiedUser('b');
    const link = await verificationLink(b.email);
    const other = await contextWithIp(browser);
    await (await other.newPage()).goto(link);
    await other.close();
    const a = await createVerifiedUser('a');
    await signInAs(context, a);

    await page.goto(link);
    await expect(realtimeHeading(page)).toBeVisible();
    expect(await sessionEmail(page.request)).toBe(a.email);
  });

  for (const [row, owner] of [
    [1, 'B'],
    [2, 'A'],
  ] as const) {
    test(`TC-078 row ${String(row)}: an expired link with the session of ${owner}`, async ({
      page,
      context,
    }) => {
      const b = await createUnverifiedUser('b');
      const expired = await expiredVerificationLink(await verificationLink(b.email));
      const signedIn = owner === 'B' ? b : await createVerifiedUser('a');
      if (owner === 'B') {
        await query('UPDATE "user" SET email_verified = true WHERE email = $1', [b.email]);
      }
      await signInAs(context, signedIn);
      await page.goto(expired);

      await verificationLinkError(page);
      expect(await sessionEmail(page.request)).toBe(signedIn.email);
    });
  }

  test('TC-145 a changed token in the verification link', async ({ page, browser }) => {
    const b = await createUnverifiedUser();
    await page.goto(tamperToken(await verificationLink(b.email), 'query'));
    await verificationLinkError(page);
    expect(await sessionEmail(page.request)).toBeNull();

    const other = await contextWithIp(browser);
    const otherPage = await other.newPage();
    await otherPage.goto('/sign-in');
    await fillSignIn(otherPage, b.email, b.password);
    await expect(
      otherPage.getByRole('alert').filter({ hasText: 'Confirm your email first' }),
    ).toBeVisible();
    await other.close();
  });

  test('TC-146 a changed token in the reset link', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto(tamperToken(await resetLink(user.email), 'path'));
    await expectExpiredScreen(page);
    expect(await passwordWorks(user.email, user.password)).toBe(true);
  });
});

test.describe('Reset password flows', () => {
  test('TC-186 Reset password from Sign in', async ({ page, browser }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await authForm(page).email.fill(user.email);
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await authForm(page).sendReset.click();
    await expect(page.getByText(/If an account exists for/)).toBeVisible();
    await page.goto(linkIn(await waitForEmail(user.email, 'Reset')));
    await saveNewPassword(page, NEW_PASSWORD);
    await expect(passwordUpdated(page)).toBeVisible();
    await page.getByRole('link', { name: 'Sign in' }).click();
    await fillSignIn(page, user.email, NEW_PASSWORD);
    await expect(realtimeHeading(page)).toBeVisible();
    await signOutFromMenu(page, user.email);

    const fresh = await contextWithIp(browser);
    const freshPage = await fresh.newPage();
    await freshPage.goto('/sign-in');
    await fillSignIn(freshPage, user.email, user.password);
    await expect(freshPage.getByRole('alert').filter({ hasText: MESSAGES.mismatch })).toBeVisible();
    await fresh.close();
  });

  test('TC-187 Reset password from the Backtest gate returns to Backtest', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto('/backtest');
    await page.getByRole('link', { name: 'Sign in to continue' }).click();
    await authForm(page).email.fill(user.email);
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await authForm(page).sendReset.click();
    await expect(page.getByText(/If an account exists for/)).toBeVisible();
    await page.goto(linkIn(await waitForEmail(user.email, 'Reset')));
    await saveNewPassword(page, NEW_PASSWORD);
    await page.getByRole('link', { name: 'Sign in' }).click();
    await fillSignIn(page, user.email, NEW_PASSWORD);
    await expect(backtestHeading(page)).toBeVisible();
  });

  test('TC-188 a reset link opened while signed in', async ({ page, context }) => {
    const user = await createVerifiedUser();
    await signInAs(context, user);
    await page.goto(await resetLink(user.email));
    await expect(chooseHeading(page)).toBeVisible();
    await saveNewPassword(page, NEW_PASSWORD);
    await expect(passwordUpdated(page)).toBeVisible();
    expect(await sessionEmail(page.request)).toBeNull();
  });

  test('TC-189 Forgot password for an email without an account', async ({ page }) => {
    await page.goto('/forgot-password');
    await authForm(page).email.fill('none@example.test');
    await authForm(page).sendReset.click();
    await expect(page.getByText('If an account exists for none@example.test')).toBeVisible();
    await page.waitForTimeout(2_000);
    expect(emailsTo('none@example.test')).toEqual([]);
  });

  test('TC-190 a used link: Send a new link opens Forgot password', async ({ page }) => {
    const user = await createVerifiedUser();
    const link = await resetLink(user.email);
    await useResetLinkByApi(page, link, NEW_PASSWORD);
    await page.goto(link);
    await page.getByRole('link', { name: 'Send a new link' }).click();
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(authForm(page).email).toBeVisible();
  });

  test('TC-191 an expired link: Back to sign in opens Sign in', async ({ page }) => {
    const user = await createVerifiedUser();
    const link = await resetLink(user.email);
    await expireResetLink(link);
    await page.goto(link);
    await page.getByRole('link', { name: 'Back to sign in' }).click();
    await expect(authForm(page).signIn).toBeVisible();
  });
});
