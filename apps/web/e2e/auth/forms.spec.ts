// The Auth forms: field rules and messages, what Sign in shows for each kind of account, where
// the user goes after Sign in (`next`), the Create account, Sign in and Google flows, and the
// Continue with Google button with and without Google configured.
//
// How these tests run: Playwright opens the real app in Chromium. `playwright.config.ts` starts
// the E2E servers (see `e2e/environment.ts`): a fresh database, and emails printed to the server
// console instead of sent; `fixtures.ts` reads links from that console. Each test has its own
// client IP (`x-forwarded-for`), because rate limits count requests per IP. Accounts are created
// through the API or the database to save time; only the step under test goes through the UI.
// Run with `pnpm test:e2e` after `pnpm db:up`, with `pnpm dev` stopped.
// Google: tests answer for accounts.google.com with `page.route`, so no request reaches Google.
// The button without Google uses the second E2E server, which starts with no Google settings.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import type { Page } from '@playwright/test';
import {
  authForm,
  backtestHeading,
  contextWithIp,
  countUsers,
  createGoogleOnlyUser,
  createUnverifiedUser,
  createVerifiedUser,
  expect,
  fillSignIn,
  fillSignUp,
  isEmailVerified,
  MESSAGES,
  newUser,
  passwordWorks,
  PASSWORD,
  realtimeHeading,
  resetLink,
  sessionEmail,
  signInAs,
  signOutFromMenu,
  test,
  verificationLink,
  waitForEmail,
  WRONG_PASSWORD,
} from './fixtures';
import { E2E_SERVERS, originOf } from '../environment';

const EMOJI = '😀';
const checkEmailHeading = (page: Page) => page.getByRole('heading', { name: 'Check your email' });
const createHeading = (page: Page) => page.getByRole('heading', { name: 'Create your account' });
const mismatchAlert = (page: Page) =>
  page.getByRole('alert').filter({ hasText: MESSAGES.mismatch });

/** The error shown under a field, or null when the field is valid. */
async function fieldError(field: ReturnType<typeof authForm>['email']) {
  if ((await field.getAttribute('aria-invalid')) !== 'true') return null;
  const id = await field.getAttribute('aria-describedby');
  return id ? ((await field.page().locator(`#${id}`).textContent()) ?? '').trim() : '';
}

async function signUpWithName(page: Page, name: string) {
  await page.goto('/sign-up');
  await fillSignUp(page, { ...newUser('name'), name });
}

test.describe('Full name length in the form', () => {
  const cases: [string, string, string | null][] = [
    ['TC-094', '', MESSAGES.nameRequired],
    ['TC-094', 'N', null],
    ['TC-094', 'NN', null],
    ['TC-095', 'N'.repeat(99), null],
    ['TC-095', 'N'.repeat(100), null],
    ['TC-095', 'N'.repeat(101), MESSAGES.nameMax],
    ['TC-095', 'N'.repeat(102), MESSAGES.nameMax],
    ['TC-098', EMOJI.repeat(51), null],
    ['TC-098', EMOJI.repeat(101), MESSAGES.nameMax],
  ];
  for (const [id, name, message] of cases) {
    const label = name.startsWith(EMOJI)
      ? `${String(name.length / EMOJI.length)} × emoji`
      : `${String(name.length)} characters`;
    test(`${id} Full name of ${label}`, async ({ page }) => {
      await signUpWithName(page, name);
      if (message) {
        expect(await fieldError(authForm(page).name)).toBe(message);
      } else {
        await expect(checkEmailHeading(page)).toBeVisible();
      }
    });
  }
});

const EMAIL_VALUES: [string, string | null][] = [
  ['', MESSAGES.emailRequired],
  ['an.example.com', MESSAGES.emailFormat],
  ['an@', MESSAGES.emailFormat],
  ['an@example', MESSAGES.emailFormat],
  ['an@@example.com', MESSAGES.emailFormat],
  ['an example@example.com', MESSAGES.emailFormat],
  ['an@example.com', null],
];

test.describe('form fields', () => {
  for (const [value, message] of EMAIL_VALUES) {
    test(`TC-130 Sign in email "${value}"`, async ({ page }) => {
      await page.goto('/sign-in');
      await fillSignIn(page, value, PASSWORD);
      expect(await fieldError(authForm(page).email)).toBe(message);
    });

    test(`TC-131 Create account email "${value}"`, async ({ page }) => {
      await page.goto('/sign-up');
      const form = authForm(page);
      await form.name.fill('An Nguyen');
      await form.email.fill(value);
      await form.password.fill(PASSWORD);
      await form.terms.check();
      await form.createAccount.click();
      expect(await fieldError(form.email)).toBe(message);
    });

    test(`TC-132 Forgot password email "${value}"`, async ({ page }) => {
      await page.goto('/forgot-password');
      await authForm(page).email.fill(value);
      await authForm(page).sendReset.click();
      if (message) expect(await fieldError(authForm(page).email)).toBe(message);
      else await expect(page.getByText(`If an account exists for ${value}`)).toBeVisible();
    });
  }

  test('TC-133 spaces around the email are removed: Sign in opens the same account', async ({
    page,
  }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, ` ${user.email} `, user.password);
    await expect(realtimeHeading(page)).toBeVisible();
    expect(await sessionEmail(page.request)).toBe(user.email);
  });

  test('TC-134 Sign in password', async ({ page }) => {
    await page.goto('/sign-in');
    await fillSignIn(page, 'an@example.com', '');
    expect(await fieldError(authForm(page).password)).toBe(MESSAGES.passwordRequired);
    await authForm(page).password.fill(PASSWORD);
    await authForm(page).signIn.click();
    expect(await fieldError(authForm(page).password)).toBeNull();
  });

  const resetRows: [number, string, string, string | null][] = [
    [1, '', 'New-Horse-92', MESSAGES.fillBoth],
    [2, 'New-Horse-92', '', MESSAGES.fillBoth],
  ];
  for (const [row, newPassword, confirm, message] of resetRows) {
    test(`TC-135 row ${String(row)}: an empty field`, async ({ page }) => {
      const user = await createVerifiedUser();
      await page.goto(await resetLink(user.email));
      await authForm(page).newPassword.fill(newPassword);
      await authForm(page).confirmPassword.fill(confirm);
      await authForm(page).saveNewPassword.click();
      await expect(page.getByText(message ?? '')).toBeVisible();
    });
  }

  test('TC-135 rows 3 and 4: the mismatch shows while typing, then clears', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto(await resetLink(user.email));
    await authForm(page).newPassword.fill('New-Horse-92');
    await authForm(page).confirmPassword.pressSequentially('New-Horse-9');
    await expect(page.getByText(MESSAGES.noMatch)).toBeVisible();
    await authForm(page).confirmPassword.fill('New-Horse-92');
    await expect(page.getByText(MESSAGES.noMatch)).toHaveCount(0);
    expect(await fieldError(authForm(page).confirmPassword)).toBeNull();
  });

  test('TC-136 the confirmation checkbox', async ({ page }) => {
    await page.goto('/sign-up');
    const form = authForm(page);
    await form.name.fill('An Nguyen');
    await form.email.fill(newUser('terms').email);
    await form.password.fill(PASSWORD);
    await form.createAccount.click();
    await expect(page.getByText(MESSAGES.confirm, { exact: true })).toBeVisible();
    await form.terms.check();
    await form.createAccount.click();
    await expect(checkEmailHeading(page)).toBeVisible();
  });

  test('TC-137 editing the password hides the mismatch message', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, user.email, WRONG_PASSWORD);
    await expect(mismatchAlert(page)).toBeVisible();
    await authForm(page).password.fill(`${WRONG_PASSWORD.slice(0, -1)}1`);
    await expect(mismatchAlert(page)).toHaveCount(0);
  });

  test('TC-139 the show-password button', async ({ page }) => {
    await page.goto('/sign-in');
    const password = authForm(page).password;
    await password.fill(PASSWORD);
    const toggle = page.getByRole('button', { name: 'Show password' });
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('TC-140 row 1: Google configured shows Continue with Google', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('TC-140 row 2: Google not configured hides Continue with Google', async ({ page }) => {
    // This server starts with empty GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
    await page.goto(`${originOf(E2E_SERVERS.withoutGoogle)}/sign-in`);
    await expect(authForm(page).email).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0);
  });

  for (const [row, error] of [
    [1, 'access_denied'],
    [2, 'server_error'],
  ] as const) {
    test(`TC-141 row ${String(row)}: Google returns ${error}`, async ({ page }) => {
      await page.route('https://accounts.google.com/**', (route) => {
        const state = new URL(route.request().url()).searchParams.get('state') ?? '';
        return route.fulfill({
          status: 302,
          headers: {
            location: `http://localhost:5173/api/auth/callback/google?error=${error}&state=${encodeURIComponent(state)}`,
          },
        });
      });
      await page.goto('/sign-in');
      await authForm(page).email.fill('an@example.com');
      await page.getByRole('button', { name: 'Continue with Google' }).click();

      await expect(page.getByRole('alert').filter({ hasText: /Google/ })).toBeVisible();
      await expect(authForm(page).email).toHaveValue('an@example.com');
      expect(await sessionEmail(page.request)).toBeNull();
    });
  }

  const retryHint = (page: Page) => page.getByRole('alert').filter({ hasText: /try again/i });

  test('TC-142 row 1: Sign in without network', async ({ page }) => {
    await page.goto('/sign-in');
    await page.route('**/api/auth/sign-in/email', (route) => route.abort('internetdisconnected'));
    await fillSignIn(page, 'an@example.com', PASSWORD);
    await expect(retryHint(page)).toBeVisible();
    await expect(authForm(page).email).toHaveValue('an@example.com');
    await expect(authForm(page).password).toHaveValue(PASSWORD);
  });

  test('TC-142 row 2: Create account when the API answers 500', async ({ page }) => {
    const user = newUser('server-error');
    await page.goto('/sign-up');
    await page.route('**/api/auth/sign-up/email', (route) =>
      route.fulfill({ status: 500, body: '{}' }),
    );
    await fillSignUp(page, user);
    await expect(retryHint(page)).toBeVisible();
    await expect(createHeading(page)).toBeVisible();
    await expect(authForm(page).name).toHaveValue(user.name);
    await expect(authForm(page).email).toHaveValue(user.email);
    await expect(authForm(page).password).toHaveValue(user.password);
  });

  test('TC-142 row 3: Send reset link without network', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.route('**/api/auth/request-password-reset', (route) =>
      route.abort('internetdisconnected'),
    );
    await authForm(page).email.fill('an@example.com');
    await authForm(page).sendReset.click();
    await expect(retryHint(page)).toBeVisible();
    await expect(authForm(page).email).toHaveValue('an@example.com');
  });

  test('TC-142 row 4: save the new password when the API answers 500', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto(await resetLink(user.email));
    await page.route('**/api/auth/reset-password', (route) =>
      route.fulfill({ status: 500, body: '{}' }),
    );
    await authForm(page).newPassword.fill('New-Horse-92');
    await authForm(page).confirmPassword.fill('New-Horse-92');
    await authForm(page).saveNewPassword.click();
    await expect(retryHint(page)).toBeVisible();
    await expect(authForm(page).newPassword).toHaveValue('New-Horse-92');
    await expect(authForm(page).confirmPassword).toHaveValue('New-Horse-92');
  });

  test('TC-142 row 5: Resend the link without network', async ({ page }) => {
    await page.goto('/sign-up');
    await fillSignUp(page, newUser('offline'));
    await expect(checkEmailHeading(page)).toBeVisible();
    await page.route('**/api/auth/send-verification-email', (route) =>
      route.abort('internetdisconnected'),
    );
    await page.getByRole('button', { name: /resend the link/i }).click();
    await expect(retryHint(page)).toBeVisible();
    await expect(checkEmailHeading(page)).toBeVisible();
  });

  test('TC-143 row 1: /sign-in without a session shows the form', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(authForm(page).signIn).toBeVisible();
  });

  test('TC-143 row 2: /sign-in with a session opens Realtime', async ({ page, context }) => {
    await signInAs(context, await createVerifiedUser());
    await page.goto('/sign-in');
    await expect(realtimeHeading(page)).toBeVisible();
  });

  test('TC-143 row 3: a valid reset link with a session shows the form', async ({
    page,
    context,
  }) => {
    const user = await createVerifiedUser();
    await signInAs(context, user);
    await page.goto(await resetLink(user.email));
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  });

  test('TC-144 a Full name of spaces only', async ({ page }) => {
    await signUpWithName(page, '   ');
    expect(await fieldError(authForm(page).name)).toBe(MESSAGES.nameRequired);
    await authForm(page).name.fill('An Nguyen');
    await authForm(page).createAccount.click();
    await expect(checkEmailHeading(page)).toBeVisible();
  });
});

test.describe('Sign in result by account (UI)', () => {
  const noMatchRows: [number, string][] = [
    [1, 'no account'],
    [2, 'Google-only account'],
    [3, 'wrong password'],
    [4, 'unverified, wrong password'],
  ];
  for (const [row, label] of noMatchRows) {
    test(`TC-150 row ${String(row)}: ${label}`, async ({ page }) => {
      const email =
        row === 1
          ? 'none@example.test'
          : row === 2
            ? await createGoogleOnlyUser()
            : row === 3
              ? (await createVerifiedUser()).email
              : (await createUnverifiedUser()).email;
      await page.goto('/sign-in');
      await fillSignIn(page, email, row >= 3 ? WRONG_PASSWORD : PASSWORD);
      await expect(mismatchAlert(page)).toBeVisible();
      await expect(mismatchAlert(page).getByRole('link', { name: 'Reset password' })).toBeVisible();
      expect(await sessionEmail(page.request)).toBeNull();
    });
  }

  test('TC-150 row 5: unverified, right password', async ({ page }) => {
    const u = await createUnverifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, u.email, PASSWORD);
    const alert = page.getByRole('alert').filter({ hasText: 'Confirm your email first' });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole('button', { name: 'Resend the link' })).toBeVisible();
    expect(await sessionEmail(page.request)).toBeNull();
  });

  test('TC-150 row 6: verified, right password', async ({ page }) => {
    const a = await createVerifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, a.email, PASSWORD);
    await expect(realtimeHeading(page)).toBeVisible();
    expect(await sessionEmail(page.request)).toBe(a.email);
  });
});

test.describe('`next` after Sign in (UI)', () => {
  const rows: [string, string | null, 'Backtest' | 'Realtime'][] = [
    ['/backtest', '/backtest', 'Backtest'],
    ['https://evil.example/', 'https://evil.example/', 'Realtime'],
    ['//evil.example', '//evil.example', 'Realtime'],
    ['/\\evil.example', '/\\evil.example', 'Realtime'],
    ['javascript:alert(1)', 'javascript:alert(1)', 'Realtime'],
    ['/sign-in', '/sign-in', 'Realtime'],
    ['no next', null, 'Realtime'],
  ];
  for (const [label, next, screen] of rows) {
    test(`TC-160 next = ${label}`, async ({ page }) => {
      let dialogs = 0;
      page.on('dialog', (dialog) => {
        dialogs += 1;
        void dialog.dismiss();
      });
      const user = await createVerifiedUser();
      await page.goto(next === null ? '/sign-in' : `/sign-in?next=${encodeURIComponent(next)}`);
      await fillSignIn(page, user.email, user.password);

      if (screen === 'Backtest') await expect(backtestHeading(page)).toBeVisible();
      else await expect(realtimeHeading(page)).toBeVisible();
      expect(dialogs).toBe(0);
      expect(new URL(page.url()).origin).toBe('http://localhost:5173');
    });
  }
});

test.describe('Auth flows', () => {
  test('TC-170 Sign in without a pending destination', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, user.email, user.password);
    await expect(realtimeHeading(page)).toBeVisible();
    expect(await sessionEmail(page.request)).toBe(user.email);
  });

  test('TC-171 Sign in from the Backtest gate, then the note is gone', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto('/backtest');
    await page.getByRole('link', { name: 'Sign in to continue' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: /continue to Backtest/ }),
    ).toBeVisible();
    await fillSignIn(page, user.email, user.password);
    await expect(backtestHeading(page)).toBeVisible();
    await signOutFromMenu(page, user.email);
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/sign-in');
    await expect(authForm(page).signIn).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /continue to/ })).toHaveCount(0);
  });

  test('TC-172 switching steps keeps the email', async ({ page }) => {
    await page.goto('/sign-in');
    await authForm(page).email.fill('an@example.com');
    await page.getByRole('tab', { name: 'Create account' }).click();
    await expect(authForm(page).email).toHaveValue('an@example.com');
    await page.getByRole('tab', { name: 'Sign in' }).click();
    await expect(authForm(page).email).toHaveValue('an@example.com');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(authForm(page).email).toHaveValue('an@example.com');
  });

  test('TC-173 wrong password, then Reset password', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, user.email, WRONG_PASSWORD);
    await mismatchAlert(page).getByRole('link', { name: 'Reset password' }).click();
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
    await expect(authForm(page).email).toHaveValue(user.email);
    expect(await sessionEmail(page.request)).toBeNull();
  });

  test('TC-174 unverified email: resend the link', async ({ page }) => {
    const u = await createUnverifiedUser();
    await waitForEmail(u.email, 'Confirm', 1);
    await page.goto('/sign-in');
    await fillSignIn(page, u.email, PASSWORD);
    await page.getByRole('button', { name: 'Resend the link' }).click();
    await waitForEmail(u.email, 'Confirm', 2);
    expect(await sessionEmail(page.request)).toBeNull();
  });

  test('TC-176 Create account, then open the link in the same browser', async ({
    page,
    context,
  }) => {
    const user = newUser('same-browser');
    await page.goto('/sign-up');
    await fillSignUp(page, user);
    await expect(checkEmailHeading(page)).toBeVisible();
    await expect(page.getByText(user.email)).toBeVisible();

    const tab = await context.newPage();
    await tab.goto(await verificationLink(user.email));
    await expect(realtimeHeading(tab)).toBeVisible();
    expect(await isEmailVerified(user.email)).toBe(true);
    expect(await sessionEmail(tab.request)).toBe(user.email);
  });

  test('TC-177 Create account from the Backtest gate', async ({ page, context }) => {
    const user = newUser('gate-signup');
    await page.goto('/backtest');
    await page.getByRole('link', { name: 'Sign in to continue' }).click();
    await page.getByRole('tab', { name: 'Create account' }).click();
    await fillSignUp(page, user);
    await expect(
      page.getByRole('button', { name: /I’ve confirmed, continue to Backtest/ }),
    ).toBeVisible();

    const tab = await context.newPage();
    await tab.goto(await verificationLink(user.email));
    await expect(backtestHeading(tab)).toBeVisible();
  });

  test('TC-178 the link opened in another browser', async ({ page, browser }) => {
    const user = newUser('other-browser');
    await page.goto('/sign-up');
    await fillSignUp(page, user);
    await expect(checkEmailHeading(page)).toBeVisible();
    const other = await contextWithIp(browser);
    await (await other.newPage()).goto(await verificationLink(user.email));
    await other.close();

    await page.getByRole('button', { name: /I’ve confirmed, continue/ }).click();
    await expect(authForm(page).signIn).toBeVisible();
    await expect(authForm(page).email).toHaveValue(user.email);
  });

  test('TC-179 the link opened in another tab of the same browser', async ({ page, context }) => {
    const user = newUser('other-tab');
    await page.goto('/sign-up');
    await fillSignUp(page, user);
    await expect(checkEmailHeading(page)).toBeVisible();
    const tab = await context.newPage();
    await tab.goto(await verificationLink(user.email));
    await expect(realtimeHeading(tab)).toBeVisible();

    await page.bringToFront();
    await page.getByRole('button', { name: /I’ve confirmed, continue/ }).click();
    await expect(realtimeHeading(page)).toBeVisible();
  });

  test('TC-180 Resend the link', async ({ page, browser }) => {
    const user = newUser('resend');
    await page.goto('/sign-up');
    await fillSignUp(page, user);
    await expect(checkEmailHeading(page)).toBeVisible();
    await waitForEmail(user.email, 'Confirm', 1);
    await page.getByRole('button', { name: /resend the link/i }).click();

    await expect(page.getByRole('button', { name: 'Sent again' })).toBeDisabled();
    const other = await contextWithIp(browser);
    await (await other.newPage()).goto(await verificationLink(user.email, 2));
    await other.close();
    expect(await isEmailVerified(user.email)).toBe(true);
  });

  test('TC-181 Use a different email', async ({ page }) => {
    await page.goto('/sign-up');
    await fillSignUp(page, newUser('different'));
    await expect(checkEmailHeading(page)).toBeVisible();
    await page.getByRole('button', { name: 'Use a different email' }).click();
    await expect(createHeading(page)).toBeVisible();
    await expect(authForm(page).createAccount).toBeVisible();
  });

  test('TC-182 Create account with the email of a verified account', async ({ page }) => {
    const a = await createVerifiedUser();
    await page.goto('/sign-up');
    await fillSignUp(page, { name: 'Someone Else', email: a.email, password: 'Other-Horse-93' });
    await expect(checkEmailHeading(page)).toBeVisible();

    const notice = await waitForEmail(a.email, 'already have');
    expect(notice.text).toMatch(/\/sign-in/);
    expect(notice.text).toMatch(/\/forgot-password/);
    expect(await countUsers(a.email)).toBe(1);
    expect(await passwordWorks(a.email, a.password)).toBe(true);
  });

  test('TC-183 Create account with the email of an unverified account', async ({ page }) => {
    const u = await createUnverifiedUser();
    await page.goto('/sign-up');
    await fillSignUp(page, { name: 'Someone Else', email: u.email, password: 'Other-Horse-93' });
    await expect(checkEmailHeading(page)).toBeVisible();

    const notice = await waitForEmail(u.email, 'already have');
    expect(notice.text).toMatch(/\/sign-in/);
    expect(notice.text).toMatch(/\/forgot-password/);
    expect(notice.text).toMatch(/confirm/i);
    expect(await countUsers(u.email)).toBe(1);
  });

  test('TC-184 reloading Check your email shows Create account', async ({ page }) => {
    await page.goto('/sign-up');
    await fillSignUp(page, newUser('reload'));
    await expect(checkEmailHeading(page)).toBeVisible();
    await page.reload();
    await expect(createHeading(page)).toBeVisible();
  });
});
