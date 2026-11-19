# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\security.spec.ts >> security configuration >> TC-227 security headers on API responses
- Location: e2e\auth\security.spec.ts:99:3

# Error details

```
Error: /api/auth/get-session

expect(received).toBe(expected) // Object.is equality

Expected: "nosniff"
Received: undefined
```

# Test source

```ts
  2   | // cookie flags, sign-in from another origin, the email printed in development, security headers,
  3   | // no caching of Auth responses, and no referrer from the page with a reset token.
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
  15  | import {
  16  |   APP_ORIGIN_HEADERS,
  17  |   authForm,
  18  |   createVerifiedUser,
  19  |   expect,
  20  |   fillSignIn,
  21  |   fillSignUp,
  22  |   newUser,
  23  |   PASSWORD,
  24  |   realtimeHeading,
  25  |   resetLink,
  26  |   sessionCookie,
  27  |   sessionEmail,
  28  |   test,
  29  |   waitForEmail,
  30  | } from './fixtures';
  31  | 
  32  | const EVIL = 'https://evil.example';
  33  | 
  34  | test.describe('ASVS checks', () => {
  35  |   test('TC-202 password fields accept paste and allow password managers', async ({
  36  |     page,
  37  |     context,
  38  |   }) => {
  39  |     await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  40  |     const user = await createVerifiedUser();
  41  |     const pasteInto = async (field: ReturnType<typeof authForm>['password']) => {
  42  |       await page.evaluate((value) => navigator.clipboard.writeText(value), PASSWORD);
  43  |       await field.click();
  44  |       await page.keyboard.press('ControlOrMeta+V');
  45  |       await expect(field).toHaveValue(PASSWORD);
  46  |       expect(await field.getAttribute('autocomplete')).not.toBe('off');
  47  |     };
  48  | 
  49  |     await page.goto('/sign-in');
  50  |     await pasteInto(authForm(page).password);
  51  |     await page.goto('/sign-up');
  52  |     await pasteInto(authForm(page).password);
  53  |     await page.goto(await resetLink(user.email));
  54  |     await pasteInto(authForm(page).newPassword);
  55  |     await pasteInto(authForm(page).confirmPassword);
  56  |   });
  57  | 
  58  |   test('TC-207 CORS does not allow another origin', async ({ page }) => {
  59  |     for (const path of ['/api/auth/get-session', '/api/auth-config']) {
  60  |       const response = await page.request.get(path, { headers: { Origin: EVIL } });
  61  |       const allowed = response.headers()['access-control-allow-origin'];
  62  |       expect([undefined, 'http://localhost:5173'], path).toContain(allowed);
  63  |     }
  64  |   });
  65  | });
  66  | 
  67  | test.describe('security configuration', () => {
  68  |   test('TC-220 rows 1 and 2: the session cookie is HttpOnly and SameSite=Lax', async ({
  69  |     page,
  70  |     context,
  71  |   }) => {
  72  |     const user = await createVerifiedUser();
  73  |     await page.goto('/sign-in');
  74  |     await fillSignIn(page, user.email, user.password);
  75  |     await expect(realtimeHeading(page)).toBeVisible();
  76  |     const cookie = await sessionCookie(context);
  77  |     expect(cookie?.httpOnly).toBe(true);
  78  |     expect(cookie?.sameSite).toBe('Lax');
  79  |   });
  80  | 
  81  |   test('TC-221 row 1: a sign-in from another origin is rejected', async ({ page }) => {
  82  |     const user = await createVerifiedUser();
  83  |     const response = await page.request.post('/api/auth/sign-in/email', {
  84  |       data: { email: user.email, password: user.password },
  85  |       headers: { Origin: EVIL },
  86  |     });
  87  |     expect(response.status()).toBe(403);
  88  |     expect(await sessionEmail(page.request)).toBeNull();
  89  |   });
  90  | 
  91  |   test('TC-225 development prints the email with the link to the API console', async ({ page }) => {
  92  |     const user = newUser('console');
  93  |     await page.goto('/sign-up');
  94  |     await fillSignUp(page, user);
  95  |     const email = await waitForEmail(user.email, 'Confirm');
  96  |     expect(email.text).toMatch(/http:\/\/localhost:5173\/api\/auth\/verify-email\?token=/);
  97  |   });
  98  | 
  99  |   test('TC-227 security headers on API responses', async ({ page }) => {
  100 |     for (const path of ['/api/auth/get-session', '/api/auth-config', '/api/does-not-exist']) {
  101 |       const headers = (await page.request.get(path, { headers: APP_ORIGIN_HEADERS })).headers();
> 102 |       expect(headers['x-content-type-options'], path).toBe('nosniff');
      |                                                       ^ Error: /api/auth/get-session
  103 |       expect(headers['referrer-policy'], path).toBe('no-referrer');
  104 |       expect(headers['content-security-policy'] ?? '', path).toMatch(/frame-ancestors 'none'/);
  105 |     }
  106 |   });
  107 | 
  108 |   test('TC-228 Auth responses are not stored', async ({ page }) => {
  109 |     const response = await page.request.get('/api/auth/get-session');
  110 |     expect(response.headers()['cache-control'] ?? '').toMatch(/no-store/);
  111 |   });
  112 | 
  113 |   test('TC-230 the page with a reset token sends no referrer', async ({ page }) => {
  114 |     const user = await createVerifiedUser();
  115 |     const response = await page.goto(await resetLink(user.email));
  116 |     const header = response?.headers()['referrer-policy'];
  117 |     const meta = await page
  118 |       .locator('meta[name="referrer"]')
  119 |       .getAttribute('content')
  120 |       .catch(() => null);
  121 |     expect([header, meta]).toContain('no-referrer');
  122 |   });
  123 | });
  124 | 
```