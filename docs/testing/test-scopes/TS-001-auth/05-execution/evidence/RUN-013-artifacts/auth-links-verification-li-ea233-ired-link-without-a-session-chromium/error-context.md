# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\links.spec.ts >> verification link >> TC-072 an expired link without a session
- Location: e2e\auth\links.spec.ts:202:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /resend|new link/i }).or(getByRole('link', { name: /resend|new link/i }))
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: /resend|new link/i }).or(getByRole('link', { name: /resend|new link/i })) with timeout 10000ms
  - waiting for getByRole('button', { name: /resend|new link/i }).or(getByRole('link', { name: /resend|new link/i }))

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
  - region "Welcome back":
    - heading "Welcome back" [level=1]
    - alert: This confirmation link has expired. Sign in and we’ll send you a new one.
    - tablist "Account":
      - tab "Sign in" [selected]
      - tab "Create account"
    - tabpanel "Sign in":
      - button "Continue with Google"
      - text: or with email Email
      - textbox "Email"
      - text: Password
      - link "Forgot password?":
        - /url: /forgot-password
      - textbox "Password"
      - button "Show password": Show
      - checkbox "Keep me signed in on this device" [checked]
      - text: Keep me signed in on this device
      - button "Sign in"
      - paragraph:
        - text: New to Crypto Force?
        - link "Create an account":
          - /url: /sign-up
- region "Notifications alt+T"
```

# Test source

```ts
  1   | // Reset links and verification links opened in the browser: valid, used, expired and changed
  2   | // links, and the Reset password flows from Forgot password to Sign in.
  3   | //
  4   | // How these tests run: Playwright opens the real app in Chromium. `playwright.config.ts` starts
  5   | // the E2E servers (see `e2e/environment.ts`): a fresh database, and emails printed to the server
  6   | // console instead of sent; `fixtures.ts` reads links from that console. Each test has its own
  7   | // client IP (`x-forwarded-for`), because rate limits count requests per IP. Accounts are created
  8   | // through the API or the database to save time; only the step under test goes through the UI.
  9   | // Run with `pnpm test:e2e` after `pnpm db:up`, with `pnpm dev` stopped.
  10  | // Expired links: the browser cannot move the server clock, so `fixtures.ts` makes a reset link
  11  | // expired in the database, and signs a copy of a verification link that expired a minute ago.
  12  | //
  13  | // Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
  14  | // in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
  15  | // test case first: the test checks the requirement, not the current code.
  16  | import type { Page } from '@playwright/test';
  17  | import {
  18  |   APP_ORIGIN_HEADERS,
  19  |   authForm,
  20  |   backtestHeading,
  21  |   contextWithIp,
  22  |   createUnverifiedUser,
  23  |   createVerifiedUser,
  24  |   emailsTo,
  25  |   expect,
  26  |   expiredVerificationLink,
  27  |   expireResetLink,
  28  |   fillSignIn,
  29  |   isEmailVerified,
  30  |   linkIn,
  31  |   MESSAGES,
  32  |   NEW_PASSWORD,
  33  |   OTHER_PASSWORD,
  34  |   passwordWorks,
  35  |   realtimeHeading,
  36  |   resetLink,
  37  |   resetTokenOf,
  38  |   sessionAcceptedFor,
  39  |   sessionCookie,
  40  |   sessionEmail,
  41  |   signInAs,
  42  |   signOutFromMenu,
  43  |   tamperToken,
  44  |   test,
  45  |   verificationLink,
  46  |   waitForEmail,
  47  | } from './fixtures';
  48  | import { query } from '../environment';
  49  | 
  50  | const chooseHeading = (page: Page) => page.getByRole('heading', { name: 'Choose a new password' });
  51  | const expectExpiredScreen = async (page: Page) => {
  52  |   await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
  53  |   await expect(page.getByRole('link', { name: 'Send a new link' })).toBeVisible();
  54  |   await expect(page.getByRole('link', { name: 'Back to sign in' })).toBeVisible();
  55  | };
  56  | const passwordUpdated = (page: Page) => page.getByText(/^Password updated\./);
  57  | /** The error for a bad verification link: it names the link and offers a way to get a new one. */
  58  | const verificationLinkError = async (page: Page) => {
  59  |   const alert = page.getByRole('alert').filter({ hasText: /confirmation link/i });
  60  |   await expect(alert).toBeVisible();
  61  |   await expect(
  62  |     page
  63  |       .getByRole('button', { name: /resend|new link/i })
  64  |       .or(page.getByRole('link', { name: /resend|new link/i })),
> 65  |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  66  | };
  67  | 
  68  | async function saveNewPassword(page: Page, password: string, confirm = password) {
  69  |   await authForm(page).newPassword.fill(password);
  70  |   await authForm(page).confirmPassword.fill(confirm);
  71  |   await authForm(page).saveNewPassword.click();
  72  | }
  73  | 
  74  | async function useResetLinkByApi(page: Page, link: string, password: string) {
  75  |   const response = await page.request.post('/api/auth/reset-password', {
  76  |     data: { token: resetTokenOf(link), newPassword: password },
  77  |     headers: APP_ORIGIN_HEADERS,
  78  |   });
  79  |   expect(response.status()).toBe(200);
  80  | }
  81  | 
  82  | test.describe('reset link', () => {
  83  |   test('TC-060 a valid link opens in two tabs; saving signs out every browser', async ({
  84  |     browser,
  85  |   }) => {
  86  |     const user = await createVerifiedUser();
  87  |     const browser1 = await contextWithIp(browser);
  88  |     const browser2 = await contextWithIp(browser);
  89  |     await signInAs(browser1, user);
  90  |     await signInAs(browser2, user);
  91  |     const cookie1 = (await sessionCookie(browser1))?.value ?? '';
  92  |     const cookie2 = (await sessionCookie(browser2))?.value ?? '';
  93  | 
  94  |     // A signed-in browser opening /forgot-password is sent to Realtime, so the link is asked for
  95  |     // in a third browser that is not signed in, as a user who forgot the password would do.
  96  |     const browser3 = await contextWithIp(browser);
  97  |     const forgot = await browser3.newPage();
  98  |     await forgot.goto('/forgot-password');
  99  |     await authForm(forgot).email.fill(user.email);
  100 |     await authForm(forgot).sendReset.click();
  101 |     await expect(forgot.getByText(`If an account exists for ${user.email}`)).toBeVisible();
  102 |     const link = linkIn(await waitForEmail(user.email, 'Reset'));
  103 |     await browser3.close();
  104 | 
  105 |     const tab1 = await browser1.newPage();
  106 |     await tab1.goto(link);
  107 |     await expect(chooseHeading(tab1)).toBeVisible();
  108 |     const tab2 = await browser1.newPage();
  109 |     await tab2.goto(link);
  110 |     await expect(chooseHeading(tab2)).toBeVisible();
  111 |     await saveNewPassword(tab2, NEW_PASSWORD);
  112 | 
  113 |     await expect(passwordUpdated(tab2)).toBeVisible();
  114 |     await expect(tab2.getByRole('link', { name: 'Sign in' })).toBeVisible();
  115 |     expect(await sessionAcceptedFor(cookie1)).toBeNull();
  116 |     expect(await sessionAcceptedFor(cookie2)).toBeNull();
  117 |     await browser1.close();
  118 |     await browser2.close();
  119 |   });
  120 | 
  121 |   test('TC-061 an invalid new password does not use up the link', async ({ page }) => {
  122 |     const user = await createVerifiedUser();
  123 |     await page.goto(await resetLink(user.email));
  124 |     await saveNewPassword(page, 'Short12');
  125 |     await expect(page.getByText(MESSAGES.passwordMin)).toBeVisible();
  126 |     expect(await passwordWorks(user.email, user.password)).toBe(true);
  127 | 
  128 |     await saveNewPassword(page, NEW_PASSWORD);
  129 |     await expect(passwordUpdated(page)).toBeVisible();
  130 |   });
  131 | 
  132 |   test('TC-062 an expired link shows the expired-link screen', async ({ page }) => {
  133 |     const user = await createVerifiedUser();
  134 |     const link = await resetLink(user.email);
  135 |     await expireResetLink(link);
  136 |     await page.goto(link);
  137 |     await expectExpiredScreen(page);
  138 |   });
  139 | 
  140 |   test('TC-064 a used link shows the expired-link screen', async ({ page }) => {
  141 |     const user = await createVerifiedUser();
  142 |     const link = await resetLink(user.email);
  143 |     await useResetLinkByApi(page, link, NEW_PASSWORD);
  144 |     await page.goto(link);
  145 |     await expectExpiredScreen(page);
  146 |   });
  147 | 
  148 |   test('TC-065 saving from a second tab after the link was used', async ({ page, context }) => {
  149 |     const user = await createVerifiedUser();
  150 |     const link = await resetLink(user.email);
  151 |     await page.goto(link);
  152 |     const tab2 = await context.newPage();
  153 |     await tab2.goto(link);
  154 |     await saveNewPassword(page, NEW_PASSWORD);
  155 |     await expect(passwordUpdated(page)).toBeVisible();
  156 |     await saveNewPassword(tab2, OTHER_PASSWORD);
  157 | 
  158 |     await expectExpiredScreen(tab2);
  159 |     expect(await passwordWorks(user.email, NEW_PASSWORD)).toBe(true);
  160 |     expect(await passwordWorks(user.email, OTHER_PASSWORD)).toBe(false);
  161 |   });
  162 | 
  163 |   test('TC-067 saving from a form opened before the link expired', async ({ page }) => {
  164 |     const user = await createVerifiedUser();
  165 |     const link = await resetLink(user.email);
```