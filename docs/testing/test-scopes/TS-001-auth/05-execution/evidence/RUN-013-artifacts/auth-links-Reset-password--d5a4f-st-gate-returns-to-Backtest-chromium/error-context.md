# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\links.spec.ts >> Reset password flows >> TC-187 Reset password from the Backtest gate returns to Backtest
- Location: e2e\auth\links.spec.ts:350:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Backtest', exact: true, level: 1 })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Backtest', exact: true, level: 1 }) with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Backtest', exact: true, level: 1 })
    - waiting for "http://localhost:5173/realtime" navigation to finish...
    - navigated to "http://localhost:5173/realtime"

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- banner:
  - link "Crypto Force":
    - /url: /
  - navigation "Main":
    - link "Realtime":
      - /url: /realtime
    - link "Strategy Engine":
      - /url: /strategy
    - link "Discovery":
      - /url: /discovery
    - link "Backtest":
      - /url: /backtest
    - link "News":
      - /url: /news
  - button "E2E User verified-c44c4227-dab4-460b-bc61-326df8663812@example.com"
- main:
  - heading "Realtime" [level=1]
  - paragraph: This screen is not built yet.
- region "Notifications alt+T"
```

# Test source

```ts
  262 |   test('TC-076 the link of a verified B while signed in as A', async ({
  263 |     page,
  264 |     context,
  265 |     browser,
  266 |   }) => {
  267 |     const b = await createUnverifiedUser('b');
  268 |     const link = await verificationLink(b.email);
  269 |     const other = await contextWithIp(browser);
  270 |     await (await other.newPage()).goto(link);
  271 |     await other.close();
  272 |     const a = await createVerifiedUser('a');
  273 |     await signInAs(context, a);
  274 | 
  275 |     await page.goto(link);
  276 |     await expect(realtimeHeading(page)).toBeVisible();
  277 |     expect(await sessionEmail(page.request)).toBe(a.email);
  278 |   });
  279 | 
  280 |   for (const [row, owner] of [
  281 |     [1, 'B'],
  282 |     [2, 'A'],
  283 |   ] as const) {
  284 |     test(`TC-078 row ${String(row)}: an expired link with the session of ${owner}`, async ({
  285 |       page,
  286 |       context,
  287 |     }) => {
  288 |       const b = await createUnverifiedUser('b');
  289 |       const expired = await expiredVerificationLink(await verificationLink(b.email));
  290 |       const signedIn = owner === 'B' ? b : await createVerifiedUser('a');
  291 |       if (owner === 'B') {
  292 |         await query('UPDATE "user" SET email_verified = true WHERE email = $1', [b.email]);
  293 |       }
  294 |       await signInAs(context, signedIn);
  295 |       await page.goto(expired);
  296 | 
  297 |       await verificationLinkError(page);
  298 |       expect(await sessionEmail(page.request)).toBe(signedIn.email);
  299 |     });
  300 |   }
  301 | 
  302 |   test('TC-145 a changed token in the verification link', async ({ page, browser }) => {
  303 |     const b = await createUnverifiedUser();
  304 |     await page.goto(tamperToken(await verificationLink(b.email), 'query'));
  305 |     await verificationLinkError(page);
  306 |     expect(await sessionEmail(page.request)).toBeNull();
  307 | 
  308 |     const other = await contextWithIp(browser);
  309 |     const otherPage = await other.newPage();
  310 |     await otherPage.goto('/sign-in');
  311 |     await fillSignIn(otherPage, b.email, b.password);
  312 |     await expect(
  313 |       otherPage.getByRole('alert').filter({ hasText: 'Confirm your email first' }),
  314 |     ).toBeVisible();
  315 |     await other.close();
  316 |   });
  317 | 
  318 |   test('TC-146 a changed token in the reset link', async ({ page }) => {
  319 |     const user = await createVerifiedUser();
  320 |     await page.goto(tamperToken(await resetLink(user.email), 'path'));
  321 |     await expectExpiredScreen(page);
  322 |     expect(await passwordWorks(user.email, user.password)).toBe(true);
  323 |   });
  324 | });
  325 | 
  326 | test.describe('Reset password flows', () => {
  327 |   test('TC-186 Reset password from Sign in', async ({ page, browser }) => {
  328 |     const user = await createVerifiedUser();
  329 |     await page.goto('/sign-in');
  330 |     await authForm(page).email.fill(user.email);
  331 |     await page.getByRole('link', { name: 'Forgot password?' }).click();
  332 |     await authForm(page).sendReset.click();
  333 |     await expect(page.getByText(/If an account exists for/)).toBeVisible();
  334 |     await page.goto(linkIn(await waitForEmail(user.email, 'Reset')));
  335 |     await saveNewPassword(page, NEW_PASSWORD);
  336 |     await expect(passwordUpdated(page)).toBeVisible();
  337 |     await page.getByRole('link', { name: 'Sign in' }).click();
  338 |     await fillSignIn(page, user.email, NEW_PASSWORD);
  339 |     await expect(realtimeHeading(page)).toBeVisible();
  340 |     await signOutFromMenu(page, user.email);
  341 | 
  342 |     const fresh = await contextWithIp(browser);
  343 |     const freshPage = await fresh.newPage();
  344 |     await freshPage.goto('/sign-in');
  345 |     await fillSignIn(freshPage, user.email, user.password);
  346 |     await expect(freshPage.getByRole('alert').filter({ hasText: MESSAGES.mismatch })).toBeVisible();
  347 |     await fresh.close();
  348 |   });
  349 | 
  350 |   test('TC-187 Reset password from the Backtest gate returns to Backtest', async ({ page }) => {
  351 |     const user = await createVerifiedUser();
  352 |     await page.goto('/backtest');
  353 |     await page.getByRole('link', { name: 'Sign in to continue' }).click();
  354 |     await authForm(page).email.fill(user.email);
  355 |     await page.getByRole('link', { name: 'Forgot password?' }).click();
  356 |     await authForm(page).sendReset.click();
  357 |     await expect(page.getByText(/If an account exists for/)).toBeVisible();
  358 |     await page.goto(linkIn(await waitForEmail(user.email, 'Reset')));
  359 |     await saveNewPassword(page, NEW_PASSWORD);
  360 |     await page.getByRole('link', { name: 'Sign in' }).click();
  361 |     await fillSignIn(page, user.email, NEW_PASSWORD);
> 362 |     await expect(backtestHeading(page)).toBeVisible();
      |                                         ^ Error: expect(locator).toBeVisible() failed
  363 |   });
  364 | 
  365 |   test('TC-188 a reset link opened while signed in', async ({ page, context }) => {
  366 |     const user = await createVerifiedUser();
  367 |     await signInAs(context, user);
  368 |     await page.goto(await resetLink(user.email));
  369 |     await expect(chooseHeading(page)).toBeVisible();
  370 |     await saveNewPassword(page, NEW_PASSWORD);
  371 |     await expect(passwordUpdated(page)).toBeVisible();
  372 |     expect(await sessionEmail(page.request)).toBeNull();
  373 |   });
  374 | 
  375 |   test('TC-189 Forgot password for an email without an account', async ({ page }) => {
  376 |     await page.goto('/forgot-password');
  377 |     await authForm(page).email.fill('none@example.test');
  378 |     await authForm(page).sendReset.click();
  379 |     await expect(page.getByText('If an account exists for none@example.test')).toBeVisible();
  380 |     await page.waitForTimeout(2_000);
  381 |     expect(emailsTo('none@example.test')).toEqual([]);
  382 |   });
  383 | 
  384 |   test('TC-190 a used link: Send a new link opens Forgot password', async ({ page }) => {
  385 |     const user = await createVerifiedUser();
  386 |     const link = await resetLink(user.email);
  387 |     await useResetLinkByApi(page, link, NEW_PASSWORD);
  388 |     await page.goto(link);
  389 |     await page.getByRole('link', { name: 'Send a new link' }).click();
  390 |     await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  391 |     await expect(authForm(page).email).toBeVisible();
  392 |   });
  393 | 
  394 |   test('TC-191 an expired link: Back to sign in opens Sign in', async ({ page }) => {
  395 |     const user = await createVerifiedUser();
  396 |     const link = await resetLink(user.email);
  397 |     await expireResetLink(link);
  398 |     await page.goto(link);
  399 |     await page.getByRole('link', { name: 'Back to sign in' }).click();
  400 |     await expect(authForm(page).signIn).toBeVisible();
  401 |   });
  402 | });
  403 | 
```