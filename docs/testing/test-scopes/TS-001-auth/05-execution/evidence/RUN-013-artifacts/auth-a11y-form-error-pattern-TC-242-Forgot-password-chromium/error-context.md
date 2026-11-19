# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\a11y.spec.ts >> form error pattern >> TC-242 Forgot password
- Location: e2e\auth\a11y.spec.ts:67:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert').filter({ hasText: /^Fix \d+ fields? to continue/ })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('alert').filter({ hasText: /^Fix \d+ fields? to continue/ }) with timeout 10000ms
  - waiting for getByRole('alert').filter({ hasText: /^Fix \d+ fields? to continue/ })

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- banner:
  - link "Crypto Force":
    - /url: /
  - link "Back to home":
    - /url: /
- main:
  - region "Reset your password":
    - link "Back to sign in":
      - /url: /sign-in
    - heading "Reset your password" [level=1]
    - paragraph: Enter the email you signed up with and we’ll send a link to choose a new password.
    - text: Email
    - textbox "Email" [invalid]
    - text: Enter your email address.
    - button "Send reset link"
- region "Notifications alt+T"
```

# Test source

```ts
  1   | // Accessibility of the Auth screens: how a field error is announced and linked to its field, an
  2   | // axe scan of each screen with and without errors, and keyboard use of the Sign in and Create
  3   | // account tabs.
  4   | //
  5   | // How these tests run: Playwright opens the real app in Chromium. `playwright.config.ts` starts
  6   | // the E2E servers (see `e2e/environment.ts`): a fresh database, and emails printed to the server
  7   | // console instead of sent; `fixtures.ts` reads links from that console. Each test has its own
  8   | // client IP (`x-forwarded-for`), because rate limits count requests per IP. Accounts are created
  9   | // through the API or the database to save time; only the step under test goes through the UI.
  10  | // Run with `pnpm test:e2e` after `pnpm db:up`, with `pnpm dev` stopped.
  11  | //
  12  | // Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
  13  | // in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
  14  | // test case first: the test checks the requirement, not the current code.
  15  | import AxeBuilder from '@axe-core/playwright';
  16  | import type { Locator, Page } from '@playwright/test';
  17  | import {
  18  |   authForm,
  19  |   createVerifiedUser,
  20  |   expect,
  21  |   expireResetLink,
  22  |   fillSignUp,
  23  |   newUser,
  24  |   resetLink,
  25  |   test,
  26  | } from './fixtures';
  27  | 
  28  | /** (a) error under the field, (b) aria-describedby to the error and aria-invalid="true". */
  29  | async function expectFieldError(page: Page, field: Locator) {
  30  |   await expect(field).toHaveAttribute('aria-invalid', 'true');
  31  |   const id = await field.getAttribute('aria-describedby');
  32  |   expect(id).toBeTruthy();
  33  |   const message = page.locator(`#${id ?? ''}`);
  34  |   await expect(message).toBeVisible();
  35  |   await expect(message).not.toBeEmpty();
  36  | }
  37  | 
  38  | /** (d) the error list; returns its items. */
  39  | function errorList(page: Page) {
  40  |   return page.getByRole('alert').filter({ hasText: /^Fix \d+ fields? to continue/ });
  41  | }
  42  | 
  43  | test.describe('form error pattern', () => {
  44  |   test('TC-240 Sign in', async ({ page }) => {
  45  |     await page.goto('/sign-in');
  46  |     await authForm(page).signIn.click();
  47  |     const { email, password } = authForm(page);
  48  |     await expectFieldError(page, email);
  49  |     await expectFieldError(page, password);
  50  |     await expect(email).toBeFocused();
  51  |     await expect(errorList(page)).toBeVisible();
  52  |     await errorList(page).getByRole('button').nth(1).click();
  53  |     await expect(password).toBeFocused();
  54  |   });
  55  | 
  56  |   test('TC-241 Create account', async ({ page }) => {
  57  |     await page.goto('/sign-up');
  58  |     await authForm(page).createAccount.click();
  59  |     const { name, email, password, terms } = authForm(page);
  60  |     for (const field of [name, email, password, terms]) await expectFieldError(page, field);
  61  |     await expect(name).toBeFocused();
  62  |     await expect(errorList(page)).toBeVisible();
  63  |     await errorList(page).getByRole('button').nth(1).click();
  64  |     await expect(email).toBeFocused();
  65  |   });
  66  | 
  67  |   test('TC-242 Forgot password', async ({ page }) => {
  68  |     await page.goto('/forgot-password');
  69  |     await authForm(page).sendReset.click();
  70  |     await expectFieldError(page, authForm(page).email);
  71  |     await expect(authForm(page).email).toBeFocused();
> 72  |     await expect(errorList(page)).toBeVisible();
      |                                   ^ Error: expect(locator).toBeVisible() failed
  73  |   });
  74  | 
  75  |   test('TC-243 Choose a new password', async ({ page }) => {
  76  |     const user = await createVerifiedUser();
  77  |     await page.goto(await resetLink(user.email));
  78  |     await authForm(page).saveNewPassword.click();
  79  |     const { newPassword, confirmPassword } = authForm(page);
  80  |     await expectFieldError(page, newPassword);
  81  |     await expectFieldError(page, confirmPassword);
  82  |     await expect(newPassword).toBeFocused();
  83  |     await expect(errorList(page)).toBeVisible();
  84  |     await errorList(page).getByRole('button').nth(1).click();
  85  |     await expect(confirmPassword).toBeFocused();
  86  |   });
  87  | });
  88  | 
  89  | async function seriousViolations(page: Page) {
  90  |   const results = await new AxeBuilder({ page }).analyze();
  91  |   return results.violations
  92  |     .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
  93  |     .map((violation) => `${violation.id}: ${violation.help}`);
  94  | }
  95  | 
  96  | test.describe('axe scan, default state (TC-244)', () => {
  97  |   const screens: [string, (page: Page) => Promise<void>][] = [
  98  |     ['Sign in', (page) => page.goto('/sign-in').then(() => undefined)],
  99  |     ['Create account', (page) => page.goto('/sign-up').then(() => undefined)],
  100 |     [
  101 |       'Check your email',
  102 |       async (page) => {
  103 |         await page.goto('/sign-up');
  104 |         await fillSignUp(page, newUser('axe'));
  105 |         await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  106 |       },
  107 |     ],
  108 |     ['Forgot password', (page) => page.goto('/forgot-password').then(() => undefined)],
  109 |     [
  110 |       'Choose a new password',
  111 |       async (page) => {
  112 |         await page.goto(await resetLink((await createVerifiedUser()).email));
  113 |         await expect(authForm(page).newPassword).toBeVisible();
  114 |       },
  115 |     ],
  116 |     [
  117 |       'expired link',
  118 |       async (page) => {
  119 |         const link = await resetLink((await createVerifiedUser()).email);
  120 |         await expireResetLink(link);
  121 |         await page.goto(link);
  122 |         await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
  123 |       },
  124 |     ],
  125 |   ];
  126 |   for (const [label, open] of screens) {
  127 |     test(`TC-244 ${label}`, async ({ page }) => {
  128 |       await open(page);
  129 |       await expect(page.locator('h1')).toBeVisible();
  130 |       expect(await seriousViolations(page)).toEqual([]);
  131 |     });
  132 |   }
  133 | });
  134 | 
  135 | test.describe('axe scan, error state (TC-245)', () => {
  136 |   const screens: [string, (page: Page) => Promise<void>][] = [
  137 |     [
  138 |       'Sign in',
  139 |       async (page) => {
  140 |         await page.goto('/sign-in');
  141 |         await authForm(page).signIn.click();
  142 |       },
  143 |     ],
  144 |     [
  145 |       'Create account',
  146 |       async (page) => {
  147 |         await page.goto('/sign-up');
  148 |         await authForm(page).createAccount.click();
  149 |       },
  150 |     ],
  151 |     [
  152 |       'Forgot password',
  153 |       async (page) => {
  154 |         await page.goto('/forgot-password');
  155 |         await authForm(page).sendReset.click();
  156 |       },
  157 |     ],
  158 |     [
  159 |       'Choose a new password',
  160 |       async (page) => {
  161 |         await page.goto(await resetLink((await createVerifiedUser()).email));
  162 |         await authForm(page).saveNewPassword.click();
  163 |       },
  164 |     ],
  165 |   ];
  166 |   for (const [label, open] of screens) {
  167 |     test(`TC-245 ${label}`, async ({ page }) => {
  168 |       await open(page);
  169 |       await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  170 |       expect(await seriousViolations(page)).toEqual([]);
  171 |     });
  172 |   }
```