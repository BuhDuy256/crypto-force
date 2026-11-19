# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\limits.spec.ts >> TC-175 Sign in lock in the UI >> the 4th press locks Sign in and suggests waiting or resetting the password
- Location: e2e\auth\limits.spec.ts:140:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert').filter({ hasText: /wait|try again/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('alert').filter({ hasText: /wait|try again/i }) with timeout 10000ms
  - waiting for getByRole('alert').filter({ hasText: /wait|try again/i })

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
    - tablist "Account":
      - tab "Sign in" [selected]
      - tab "Create account"
    - tabpanel "Sign in":
      - button "Continue with Google"
      - text: or with email Email
      - textbox "Email": verified-b2b152d2-b276-4759-9a8c-1d45e1467dba@example.com
      - text: Password
      - link "Forgot password?":
        - /url: /forgot-password
      - textbox "Password": Wrong-Horse-00
      - button "Show password": Show
      - checkbox "Keep me signed in on this device" [checked]
      - text: Keep me signed in on this device
      - alert:
        - text: That email and password don’t match. Check for typos, or reset your password.
        - link "Reset password":
          - /url: /forgot-password
      - button "Sign in"
      - paragraph:
        - text: New to Crypto Force?
        - link "Create an account":
          - /url: /sign-up
- region "Notifications alt+T"
```

# Test source

```ts
  48  |     for (const [index, email] of [existing.email, newUser('unregistered').email].entries()) {
  49  |       const context = await contextWithIp(browser, `198.51.100.${String(21 + index)}`);
  50  |       const page = await context.newPage();
  51  |       await page.goto('/sign-up');
  52  |       await fillSignUp(page, { ...newUser(), email });
  53  |       await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  54  |       await preload(page.request, resendPath, () => ({ email, callbackURL: '/sign-in' }));
  55  | 
  56  |       await page.getByRole('button', { name: /resend the link/i }).click();
  57  |       await expect(waitHint(page)).toBeVisible();
  58  |       await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  59  |       await expect(page.getByRole('button', { name: 'Sent again' })).toHaveCount(0);
  60  |       messages.push((await waitHint(page).textContent()) ?? '');
  61  |       await context.close();
  62  |     }
  63  |     expect(messages[1]).toBe(messages[0]);
  64  |   });
  65  | 
  66  |   test('row 2: Send reset link for the 4th time in 60 s; same message for an unregistered email', async ({
  67  |     browser,
  68  |   }) => {
  69  |     const messages: string[] = [];
  70  |     for (const [index, registered] of [true, false].entries()) {
  71  |       const context = await contextWithIp(browser, `198.51.100.${String(23 + index)}`);
  72  |       const page = await context.newPage();
  73  |       const email = registered ? (await createVerifiedUser()).email : 'none@example.test';
  74  |       await preload(page.request, '/api/auth/request-password-reset', () => ({
  75  |         email,
  76  |         redirectTo: '/reset-password',
  77  |       }));
  78  |       await page.goto('/forgot-password');
  79  |       await authForm(page).email.fill(email);
  80  |       await authForm(page).sendReset.click();
  81  | 
  82  |       await expect(waitHint(page)).toBeVisible();
  83  |       await expect(page.getByText(/If an account exists for/)).toHaveCount(0);
  84  |       messages.push((await waitHint(page).textContent()) ?? '');
  85  |       await context.close();
  86  |     }
  87  |     expect(messages[1]).toBe(messages[0]);
  88  |   });
  89  | 
  90  |   test('row 3: Create account for the 4th time in 10 s; same message for a registered email', async ({
  91  |     browser,
  92  |   }) => {
  93  |     const messages: string[] = [];
  94  |     for (const [index, registered] of [true, false].entries()) {
  95  |       const context = await contextWithIp(browser, `198.51.100.${String(25 + index)}`);
  96  |       const page = await context.newPage();
  97  |       const user = registered ? await createVerifiedUser() : newUser('fresh');
  98  |       await preload(page.request, '/api/auth/sign-up/email', () => ({
  99  |         ...newUser('preload'),
  100 |         callbackURL: '/sign-in',
  101 |       }));
  102 |       await page.goto('/sign-up');
  103 |       await fillSignUp(page, { ...user, password: 'Other-Horse-93' });
  104 | 
  105 |       await expect(waitHint(page)).toBeVisible();
  106 |       await expect(page.getByRole('heading', { name: 'Check your email' })).toHaveCount(0);
  107 |       messages.push((await waitHint(page).textContent()) ?? '');
  108 |       await context.close();
  109 |     }
  110 |     expect(messages[1]).toBe(messages[0]);
  111 |   });
  112 | });
  113 | 
  114 | async function pressSignInFourTimes(page: Page, email: string, password: string) {
  115 |   for (let n = 0; n < 4; n++) {
  116 |     const response = page.waitForResponse('**/api/auth/sign-in/email');
  117 |     if (n === 0) await fillSignIn(page, email, password);
  118 |     else await authForm(page).signIn.click();
  119 |     await response;
  120 |   }
  121 | }
  122 | 
  123 | test.describe('TC-138 Sign in lock message while editing', () => {
  124 |   test.use({ clientIp: '198.51.100.138' });
  125 | 
  126 |   test('editing the password keeps the lock message', async ({ page }) => {
  127 |     await page.goto('/sign-in');
  128 |     await pressSignInFourTimes(page, 'nobody@example.test', WRONG_PASSWORD);
  129 |     const lock = page.getByRole('alert').filter({ hasText: /Too many attempts/ });
  130 |     await expect(lock).toBeVisible();
  131 | 
  132 |     await authForm(page).password.fill(`${WRONG_PASSWORD}x`);
  133 |     await expect(lock).toBeVisible();
  134 |   });
  135 | });
  136 | 
  137 | test.describe('TC-175 Sign in lock in the UI', () => {
  138 |   test.use({ clientIp: '198.51.100.175' });
  139 | 
  140 |   test('the 4th press locks Sign in and suggests waiting or resetting the password', async ({
  141 |     page,
  142 |   }) => {
  143 |     const user = await createVerifiedUser();
  144 |     await page.goto('/sign-in');
  145 |     await pressSignInFourTimes(page, user.email, WRONG_PASSWORD);
  146 | 
  147 |     const lock = page.getByRole('alert').filter({ hasText: /wait|try again/i });
> 148 |     await expect(lock).toBeVisible();
      |                        ^ Error: expect(locator).toBeVisible() failed
  149 |     await expect(lock.getByRole('link', { name: /reset password/i })).toBeVisible();
  150 |     expect(await sessionEmail(page.request)).toBeNull();
  151 |   });
  152 | });
  153 | 
```