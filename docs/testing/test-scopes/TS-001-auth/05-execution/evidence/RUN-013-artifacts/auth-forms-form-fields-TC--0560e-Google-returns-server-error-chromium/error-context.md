# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\forms.spec.ts >> form fields >> TC-141 row 2: Google returns server_error
- Location: e2e\auth\forms.spec.ts:223:5

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByLabel('Email', { exact: true })
Expected: "an@example.com"
Received: ""
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" getByLabel('Email', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('Email', { exact: true })
    23 × locator resolved to <input id="email" type="email" name="email" data-slot="input" autocomplete="email" class="w-full min-w-0 border border-input py-1 shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-…/>
       - unexpected value ""

```

```yaml
- textbox "Email"
```

# Test source

```ts
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
  184 |     await expect(checkEmailHeading(page)).toBeVisible();
  185 |   });
  186 | 
  187 |   test('TC-137 editing the password hides the mismatch message', async ({ page }) => {
  188 |     const user = await createVerifiedUser();
  189 |     await page.goto('/sign-in');
  190 |     await fillSignIn(page, user.email, WRONG_PASSWORD);
  191 |     await expect(mismatchAlert(page)).toBeVisible();
  192 |     await authForm(page).password.fill(`${WRONG_PASSWORD.slice(0, -1)}1`);
  193 |     await expect(mismatchAlert(page)).toHaveCount(0);
  194 |   });
  195 | 
  196 |   test('TC-139 the show-password button', async ({ page }) => {
  197 |     await page.goto('/sign-in');
  198 |     const password = authForm(page).password;
  199 |     await password.fill(PASSWORD);
  200 |     const toggle = page.getByRole('button', { name: 'Show password' });
  201 |     await toggle.click();
  202 |     await expect(password).toHaveAttribute('type', 'text');
  203 |     await toggle.click();
  204 |     await expect(password).toHaveAttribute('type', 'password');
  205 |   });
  206 | 
  207 |   test('TC-140 row 1: Google configured shows Continue with Google', async ({ page }) => {
  208 |     await page.goto('/sign-in');
  209 |     await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  210 |   });
  211 | 
  212 |   test('TC-140 row 2: Google not configured hides Continue with Google', async ({ page }) => {
  213 |     // This server starts with empty GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
  214 |     await page.goto(`${originOf(E2E_SERVERS.withoutGoogle)}/sign-in`);
  215 |     await expect(authForm(page).email).toBeVisible();
  216 |     await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0);
  217 |   });
  218 | 
  219 |   for (const [row, error] of [
  220 |     [1, 'access_denied'],
  221 |     [2, 'server_error'],
  222 |   ] as const) {
  223 |     test(`TC-141 row ${String(row)}: Google returns ${error}`, async ({ page }) => {
  224 |       await page.route('https://accounts.google.com/**', (route) => {
  225 |         const state = new URL(route.request().url()).searchParams.get('state') ?? '';
  226 |         return route.fulfill({
  227 |           status: 302,
  228 |           headers: {
  229 |             location: `http://localhost:5173/api/auth/callback/google?error=${error}&state=${encodeURIComponent(state)}`,
  230 |           },
  231 |         });
  232 |       });
  233 |       await page.goto('/sign-in');
  234 |       await authForm(page).email.fill('an@example.com');
  235 |       await page.getByRole('button', { name: 'Continue with Google' }).click();
  236 | 
  237 |       await expect(page.getByRole('alert').filter({ hasText: /Google/ })).toBeVisible();
> 238 |       await expect(authForm(page).email).toHaveValue('an@example.com');
      |                                          ^ Error: expect(locator).toHaveValue(expected) failed
  239 |       expect(await sessionEmail(page.request)).toBeNull();
  240 |     });
  241 |   }
  242 | 
  243 |   const retryHint = (page: Page) => page.getByRole('alert').filter({ hasText: /try again/i });
  244 | 
  245 |   test('TC-142 row 1: Sign in without network', async ({ page }) => {
  246 |     await page.goto('/sign-in');
  247 |     await page.route('**/api/auth/sign-in/email', (route) => route.abort('internetdisconnected'));
  248 |     await fillSignIn(page, 'an@example.com', PASSWORD);
  249 |     await expect(retryHint(page)).toBeVisible();
  250 |     await expect(authForm(page).email).toHaveValue('an@example.com');
  251 |     await expect(authForm(page).password).toHaveValue(PASSWORD);
  252 |   });
  253 | 
  254 |   test('TC-142 row 2: Create account when the API answers 500', async ({ page }) => {
  255 |     const user = newUser('server-error');
  256 |     await page.goto('/sign-up');
  257 |     await page.route('**/api/auth/sign-up/email', (route) =>
  258 |       route.fulfill({ status: 500, body: '{}' }),
  259 |     );
  260 |     await fillSignUp(page, user);
  261 |     await expect(retryHint(page)).toBeVisible();
  262 |     await expect(createHeading(page)).toBeVisible();
  263 |     await expect(authForm(page).name).toHaveValue(user.name);
  264 |     await expect(authForm(page).email).toHaveValue(user.email);
  265 |     await expect(authForm(page).password).toHaveValue(user.password);
  266 |   });
  267 | 
  268 |   test('TC-142 row 3: Send reset link without network', async ({ page }) => {
  269 |     await page.goto('/forgot-password');
  270 |     await page.route('**/api/auth/request-password-reset', (route) =>
  271 |       route.abort('internetdisconnected'),
  272 |     );
  273 |     await authForm(page).email.fill('an@example.com');
  274 |     await authForm(page).sendReset.click();
  275 |     await expect(retryHint(page)).toBeVisible();
  276 |     await expect(authForm(page).email).toHaveValue('an@example.com');
  277 |   });
  278 | 
  279 |   test('TC-142 row 4: save the new password when the API answers 500', async ({ page }) => {
  280 |     const user = await createVerifiedUser();
  281 |     await page.goto(await resetLink(user.email));
  282 |     await page.route('**/api/auth/reset-password', (route) =>
  283 |       route.fulfill({ status: 500, body: '{}' }),
  284 |     );
  285 |     await authForm(page).newPassword.fill('New-Horse-92');
  286 |     await authForm(page).confirmPassword.fill('New-Horse-92');
  287 |     await authForm(page).saveNewPassword.click();
  288 |     await expect(retryHint(page)).toBeVisible();
  289 |     await expect(authForm(page).newPassword).toHaveValue('New-Horse-92');
  290 |     await expect(authForm(page).confirmPassword).toHaveValue('New-Horse-92');
  291 |   });
  292 | 
  293 |   test('TC-142 row 5: Resend the link without network', async ({ page }) => {
  294 |     await page.goto('/sign-up');
  295 |     await fillSignUp(page, newUser('offline'));
  296 |     await expect(checkEmailHeading(page)).toBeVisible();
  297 |     await page.route('**/api/auth/send-verification-email', (route) =>
  298 |       route.abort('internetdisconnected'),
  299 |     );
  300 |     await page.getByRole('button', { name: /resend the link/i }).click();
  301 |     await expect(retryHint(page)).toBeVisible();
  302 |     await expect(checkEmailHeading(page)).toBeVisible();
  303 |   });
  304 | 
  305 |   test('TC-143 row 1: /sign-in without a session shows the form', async ({ page }) => {
  306 |     await page.goto('/sign-in');
  307 |     await expect(authForm(page).signIn).toBeVisible();
  308 |   });
  309 | 
  310 |   test('TC-143 row 2: /sign-in with a session opens Realtime', async ({ page, context }) => {
  311 |     await signInAs(context, await createVerifiedUser());
  312 |     await page.goto('/sign-in');
  313 |     await expect(realtimeHeading(page)).toBeVisible();
  314 |   });
  315 | 
  316 |   test('TC-143 row 3: a valid reset link with a session shows the form', async ({
  317 |     page,
  318 |     context,
  319 |   }) => {
  320 |     const user = await createVerifiedUser();
  321 |     await signInAs(context, user);
  322 |     await page.goto(await resetLink(user.email));
  323 |     await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  324 |   });
  325 | 
  326 |   test('TC-144 a Full name of spaces only', async ({ page }) => {
  327 |     await signUpWithName(page, '   ');
  328 |     expect(await fieldError(authForm(page).name)).toBe(MESSAGES.nameRequired);
  329 |     await authForm(page).name.fill('An Nguyen');
  330 |     await authForm(page).createAccount.click();
  331 |     await expect(checkEmailHeading(page)).toBeVisible();
  332 |   });
  333 | });
  334 | 
  335 | test.describe('Sign in result by account (UI)', () => {
  336 |   const noMatchRows: [number, string][] = [
  337 |     [1, 'no account'],
  338 |     [2, 'Google-only account'],
```