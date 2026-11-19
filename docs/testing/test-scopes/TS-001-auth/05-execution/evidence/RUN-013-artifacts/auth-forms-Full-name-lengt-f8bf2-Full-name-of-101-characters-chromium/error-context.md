# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\forms.spec.ts >> Full name length in the form >> TC-095 Full name of 101 characters
- Location: e2e\auth\forms.spec.ts:80:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "Use 100 characters or fewer."
Received: null
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "Crypto Force" [ref=e6] [cursor=pointer]:
          - /url: /
        - link "Back to home" [ref=e11] [cursor=pointer]:
          - /url: /
    - main [ref=e14]:
      - region "Check your email" [ref=e15]:
        - heading "Check your email" [level=1] [ref=e16]
        - paragraph [ref=e17]:
          - text: We sent a confirmation link to
          - strong [ref=e18]: name-862fcc67-5213-4953-9142-3c8576381cbb@example.com
          - text: . Open it to activate your account. The link expires in 1 hour.
        - button "I’ve confirmed, continue to Realtime" [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]: Didn’t get it? Check spam, or
          - button "resend the link" [ref=e22]
          - button "Use a different email" [ref=e23]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | // The Auth forms: field rules and messages, what Sign in shows for each kind of account, where
  2   | // the user goes after Sign in (`next`), the Create account, Sign in and Google flows, and the
  3   | // Continue with Google button with and without Google configured.
  4   | //
  5   | // How these tests run: Playwright opens the real app in Chromium. `playwright.config.ts` starts
  6   | // the E2E servers (see `e2e/environment.ts`): a fresh database, and emails printed to the server
  7   | // console instead of sent; `fixtures.ts` reads links from that console. Each test has its own
  8   | // client IP (`x-forwarded-for`), because rate limits count requests per IP. Accounts are created
  9   | // through the API or the database to save time; only the step under test goes through the UI.
  10  | // Run with `pnpm test:e2e` after `pnpm db:up`, with `pnpm dev` stopped.
  11  | // Google: tests answer for accounts.google.com with `page.route`, so no request reaches Google.
  12  | // The button without Google uses the second E2E server, which starts with no Google settings.
  13  | //
  14  | // Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
  15  | // in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
  16  | // test case first: the test checks the requirement, not the current code.
  17  | import type { Page } from '@playwright/test';
  18  | import {
  19  |   authForm,
  20  |   backtestHeading,
  21  |   contextWithIp,
  22  |   countUsers,
  23  |   createGoogleOnlyUser,
  24  |   createUnverifiedUser,
  25  |   createVerifiedUser,
  26  |   expect,
  27  |   fillSignIn,
  28  |   fillSignUp,
  29  |   isEmailVerified,
  30  |   MESSAGES,
  31  |   newUser,
  32  |   passwordWorks,
  33  |   PASSWORD,
  34  |   realtimeHeading,
  35  |   resetLink,
  36  |   sessionEmail,
  37  |   signInAs,
  38  |   signOutFromMenu,
  39  |   test,
  40  |   verificationLink,
  41  |   waitForEmail,
  42  |   WRONG_PASSWORD,
  43  | } from './fixtures';
  44  | import { E2E_SERVERS, originOf } from '../environment';
  45  | 
  46  | const EMOJI = '😀';
  47  | const checkEmailHeading = (page: Page) => page.getByRole('heading', { name: 'Check your email' });
  48  | const createHeading = (page: Page) => page.getByRole('heading', { name: 'Create your account' });
  49  | const mismatchAlert = (page: Page) =>
  50  |   page.getByRole('alert').filter({ hasText: MESSAGES.mismatch });
  51  | 
  52  | /** The error shown under a field, or null when the field is valid. */
  53  | async function fieldError(field: ReturnType<typeof authForm>['email']) {
  54  |   if ((await field.getAttribute('aria-invalid')) !== 'true') return null;
  55  |   const id = await field.getAttribute('aria-describedby');
  56  |   return id ? ((await field.page().locator(`#${id}`).textContent()) ?? '').trim() : '';
  57  | }
  58  | 
  59  | async function signUpWithName(page: Page, name: string) {
  60  |   await page.goto('/sign-up');
  61  |   await fillSignUp(page, { ...newUser('name'), name });
  62  | }
  63  | 
  64  | test.describe('Full name length in the form', () => {
  65  |   const cases: [string, string, string | null][] = [
  66  |     ['TC-094', '', MESSAGES.nameRequired],
  67  |     ['TC-094', 'N', null],
  68  |     ['TC-094', 'NN', null],
  69  |     ['TC-095', 'N'.repeat(99), null],
  70  |     ['TC-095', 'N'.repeat(100), null],
  71  |     ['TC-095', 'N'.repeat(101), MESSAGES.nameMax],
  72  |     ['TC-095', 'N'.repeat(102), MESSAGES.nameMax],
  73  |     ['TC-098', EMOJI.repeat(51), null],
  74  |     ['TC-098', EMOJI.repeat(101), MESSAGES.nameMax],
  75  |   ];
  76  |   for (const [id, name, message] of cases) {
  77  |     const label = name.startsWith(EMOJI)
  78  |       ? `${String(name.length / EMOJI.length)} × emoji`
  79  |       : `${String(name.length)} characters`;
  80  |     test(`${id} Full name of ${label}`, async ({ page }) => {
  81  |       await signUpWithName(page, name);
  82  |       if (message) {
> 83  |         expect(await fieldError(authForm(page).name)).toBe(message);
      |                                                       ^ Error: expect(received).toBe(expected) // Object.is equality
  84  |       } else {
  85  |         await expect(checkEmailHeading(page)).toBeVisible();
  86  |       }
  87  |     });
  88  |   }
  89  | });
  90  | 
  91  | const EMAIL_VALUES: [string, string | null][] = [
  92  |   ['', MESSAGES.emailRequired],
  93  |   ['an.example.com', MESSAGES.emailFormat],
  94  |   ['an@', MESSAGES.emailFormat],
  95  |   ['an@example', MESSAGES.emailFormat],
  96  |   ['an@@example.com', MESSAGES.emailFormat],
  97  |   ['an example@example.com', MESSAGES.emailFormat],
  98  |   ['an@example.com', null],
  99  | ];
  100 | 
  101 | test.describe('form fields', () => {
  102 |   for (const [value, message] of EMAIL_VALUES) {
  103 |     test(`TC-130 Sign in email "${value}"`, async ({ page }) => {
  104 |       await page.goto('/sign-in');
  105 |       await fillSignIn(page, value, PASSWORD);
  106 |       expect(await fieldError(authForm(page).email)).toBe(message);
  107 |     });
  108 | 
  109 |     test(`TC-131 Create account email "${value}"`, async ({ page }) => {
  110 |       await page.goto('/sign-up');
  111 |       const form = authForm(page);
  112 |       await form.name.fill('An Nguyen');
  113 |       await form.email.fill(value);
  114 |       await form.password.fill(PASSWORD);
  115 |       await form.terms.check();
  116 |       await form.createAccount.click();
  117 |       expect(await fieldError(form.email)).toBe(message);
  118 |     });
  119 | 
  120 |     test(`TC-132 Forgot password email "${value}"`, async ({ page }) => {
  121 |       await page.goto('/forgot-password');
  122 |       await authForm(page).email.fill(value);
  123 |       await authForm(page).sendReset.click();
  124 |       if (message) expect(await fieldError(authForm(page).email)).toBe(message);
  125 |       else await expect(page.getByText(`If an account exists for ${value}`)).toBeVisible();
  126 |     });
  127 |   }
  128 | 
  129 |   test('TC-133 spaces around the email are removed: Sign in opens the same account', async ({
  130 |     page,
  131 |   }) => {
  132 |     const user = await createVerifiedUser();
  133 |     await page.goto('/sign-in');
  134 |     await fillSignIn(page, ` ${user.email} `, user.password);
  135 |     await expect(realtimeHeading(page)).toBeVisible();
  136 |     expect(await sessionEmail(page.request)).toBe(user.email);
  137 |   });
  138 | 
  139 |   test('TC-134 Sign in password', async ({ page }) => {
  140 |     await page.goto('/sign-in');
  141 |     await fillSignIn(page, 'an@example.com', '');
  142 |     expect(await fieldError(authForm(page).password)).toBe(MESSAGES.passwordRequired);
  143 |     await authForm(page).password.fill(PASSWORD);
  144 |     await authForm(page).signIn.click();
  145 |     expect(await fieldError(authForm(page).password)).toBeNull();
  146 |   });
  147 | 
  148 |   const resetRows: [number, string, string, string | null][] = [
  149 |     [1, '', 'New-Horse-92', MESSAGES.fillBoth],
  150 |     [2, 'New-Horse-92', '', MESSAGES.fillBoth],
  151 |   ];
  152 |   for (const [row, newPassword, confirm, message] of resetRows) {
  153 |     test(`TC-135 row ${String(row)}: an empty field`, async ({ page }) => {
  154 |       const user = await createVerifiedUser();
  155 |       await page.goto(await resetLink(user.email));
  156 |       await authForm(page).newPassword.fill(newPassword);
  157 |       await authForm(page).confirmPassword.fill(confirm);
  158 |       await authForm(page).saveNewPassword.click();
  159 |       await expect(page.getByText(message ?? '')).toBeVisible();
  160 |     });
  161 |   }
  162 | 
  163 |   test('TC-135 rows 3 and 4: the mismatch shows while typing, then clears', async ({ page }) => {
  164 |     const user = await createVerifiedUser();
  165 |     await page.goto(await resetLink(user.email));
  166 |     await authForm(page).newPassword.fill('New-Horse-92');
  167 |     await authForm(page).confirmPassword.pressSequentially('New-Horse-9');
  168 |     await expect(page.getByText(MESSAGES.noMatch)).toBeVisible();
  169 |     await authForm(page).confirmPassword.fill('New-Horse-92');
  170 |     await expect(page.getByText(MESSAGES.noMatch)).toHaveCount(0);
  171 |     expect(await fieldError(authForm(page).confirmPassword)).toBeNull();
  172 |   });
  173 | 
  174 |   test('TC-136 the confirmation checkbox', async ({ page }) => {
  175 |     await page.goto('/sign-up');
  176 |     const form = authForm(page);
  177 |     await form.name.fill('An Nguyen');
  178 |     await form.email.fill(newUser('terms').email);
  179 |     await form.password.fill(PASSWORD);
  180 |     await form.createAccount.click();
  181 |     await expect(page.getByText(MESSAGES.confirm, { exact: true })).toBeVisible();
  182 |     await form.terms.check();
  183 |     await form.createAccount.click();
```