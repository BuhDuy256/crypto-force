// Accessibility of the Auth screens: how a field error is announced and linked to its field, an
// axe scan of each screen with and without errors, and keyboard use of the Sign in and Create
// account tabs.
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
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import {
  authForm,
  createVerifiedUser,
  expect,
  expireResetLink,
  fillSignUp,
  newUser,
  resetLink,
  test,
} from './fixtures';

/** (a) error under the field, (b) aria-describedby to the error and aria-invalid="true". */
async function expectFieldError(page: Page, field: Locator) {
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  const id = await field.getAttribute('aria-describedby');
  expect(id).toBeTruthy();
  const message = page.locator(`#${id ?? ''}`);
  await expect(message).toBeVisible();
  await expect(message).not.toBeEmpty();
}

/** (d) the error list; returns its items. */
function errorList(page: Page) {
  return page.getByRole('alert').filter({ hasText: /^Fix \d+ fields? to continue/ });
}

test.describe('form error pattern', () => {
  test('TC-240 Sign in', async ({ page }) => {
    await page.goto('/sign-in');
    await authForm(page).signIn.click();
    const { email, password } = authForm(page);
    await expectFieldError(page, email);
    await expectFieldError(page, password);
    await expect(email).toBeFocused();
    await expect(errorList(page)).toBeVisible();
    await errorList(page).getByRole('button').nth(1).click();
    await expect(password).toBeFocused();
  });

  test('TC-241 Create account', async ({ page }) => {
    await page.goto('/sign-up');
    await authForm(page).createAccount.click();
    const { name, email, password, terms } = authForm(page);
    for (const field of [name, email, password, terms]) await expectFieldError(page, field);
    await expect(name).toBeFocused();
    await expect(errorList(page)).toBeVisible();
    await errorList(page).getByRole('button').nth(1).click();
    await expect(email).toBeFocused();
  });

  test('TC-242 Forgot password', async ({ page }) => {
    await page.goto('/forgot-password');
    await authForm(page).sendReset.click();
    await expectFieldError(page, authForm(page).email);
    await expect(authForm(page).email).toBeFocused();
    await expect(errorList(page)).toBeVisible();
  });

  test('TC-243 Choose a new password', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto(await resetLink(user.email));
    await authForm(page).saveNewPassword.click();
    const { newPassword, confirmPassword } = authForm(page);
    await expectFieldError(page, newPassword);
    await expectFieldError(page, confirmPassword);
    await expect(newPassword).toBeFocused();
    await expect(errorList(page)).toBeVisible();
    await errorList(page).getByRole('button').nth(1).click();
    await expect(confirmPassword).toBeFocused();
  });
});

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id}: ${violation.help}`);
}

test.describe('axe scan, default state (TC-244)', () => {
  const screens: [string, (page: Page) => Promise<void>][] = [
    ['Sign in', (page) => page.goto('/sign-in').then(() => undefined)],
    ['Create account', (page) => page.goto('/sign-up').then(() => undefined)],
    [
      'Check your email',
      async (page) => {
        await page.goto('/sign-up');
        await fillSignUp(page, newUser('axe'));
        await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
      },
    ],
    ['Forgot password', (page) => page.goto('/forgot-password').then(() => undefined)],
    [
      'Choose a new password',
      async (page) => {
        await page.goto(await resetLink((await createVerifiedUser()).email));
        await expect(authForm(page).newPassword).toBeVisible();
      },
    ],
    [
      'expired link',
      async (page) => {
        const link = await resetLink((await createVerifiedUser()).email);
        await expireResetLink(link);
        await page.goto(link);
        await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
      },
    ],
  ];
  for (const [label, open] of screens) {
    test(`TC-244 ${label}`, async ({ page }) => {
      await open(page);
      await expect(page.locator('h1')).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
});

test.describe('axe scan, error state (TC-245)', () => {
  const screens: [string, (page: Page) => Promise<void>][] = [
    [
      'Sign in',
      async (page) => {
        await page.goto('/sign-in');
        await authForm(page).signIn.click();
      },
    ],
    [
      'Create account',
      async (page) => {
        await page.goto('/sign-up');
        await authForm(page).createAccount.click();
      },
    ],
    [
      'Forgot password',
      async (page) => {
        await page.goto('/forgot-password');
        await authForm(page).sendReset.click();
      },
    ],
    [
      'Choose a new password',
      async (page) => {
        await page.goto(await resetLink((await createVerifiedUser()).email));
        await authForm(page).saveNewPassword.click();
      },
    ],
  ];
  for (const [label, open] of screens) {
    test(`TC-245 ${label}`, async ({ page }) => {
      await open(page);
      await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
  }
});

test('TC-246 arrow keys, Home and End on the Sign in and Create account tabs', async ({ page }) => {
  await page.goto('/sign-in');
  const signInTab = page.getByRole('tab', { name: 'Sign in' });
  const createTab = page.getByRole('tab', { name: 'Create account' });
  await signInTab.focus();

  await page.keyboard.press('ArrowRight');
  await expect(createTab).toBeFocused();
  await expect(createTab).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(signInTab).toBeFocused();
  await expect(signInTab).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(createTab).toBeFocused();
  await expect(createTab).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(signInTab).toBeFocused();
  await expect(signInTab).toHaveAttribute('aria-selected', 'true');
});
