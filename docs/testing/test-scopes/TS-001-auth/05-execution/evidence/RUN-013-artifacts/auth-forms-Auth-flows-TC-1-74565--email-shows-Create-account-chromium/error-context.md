# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\forms.spec.ts >> Auth flows >> TC-184 reloading Check your email shows Create account
- Location: e2e\auth\forms.spec.ts:574:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Create your account' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Create your account' }) with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Create your account' })

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
  - region "Check your email":
    - heading "Check your email" [level=1]
    - paragraph:
      - text: We sent a confirmation link to
      - strong: reload-32ff78ff-cf0e-45e0-a1bc-d3b468531dc1@example.com
      - text: . Open it to activate your account. The link expires in 1 hour.
    - button "I’ve confirmed, continue to Realtime"
    - text: Didn’t get it? Check spam, or
    - button "resend the link"
    - button "Use a different email"
- region "Notifications alt+T"
```

# Test source

```ts
  479 |   });
  480 | 
  481 |   test('TC-177 Create account from the Backtest gate', async ({ page, context }) => {
  482 |     const user = newUser('gate-signup');
  483 |     await page.goto('/backtest');
  484 |     await page.getByRole('link', { name: 'Sign in to continue' }).click();
  485 |     await page.getByRole('tab', { name: 'Create account' }).click();
  486 |     await fillSignUp(page, user);
  487 |     await expect(
  488 |       page.getByRole('button', { name: /I’ve confirmed, continue to Backtest/ }),
  489 |     ).toBeVisible();
  490 | 
  491 |     const tab = await context.newPage();
  492 |     await tab.goto(await verificationLink(user.email));
  493 |     await expect(backtestHeading(tab)).toBeVisible();
  494 |   });
  495 | 
  496 |   test('TC-178 the link opened in another browser', async ({ page, browser }) => {
  497 |     const user = newUser('other-browser');
  498 |     await page.goto('/sign-up');
  499 |     await fillSignUp(page, user);
  500 |     await expect(checkEmailHeading(page)).toBeVisible();
  501 |     const other = await contextWithIp(browser);
  502 |     await (await other.newPage()).goto(await verificationLink(user.email));
  503 |     await other.close();
  504 | 
  505 |     await page.getByRole('button', { name: /I’ve confirmed, continue/ }).click();
  506 |     await expect(authForm(page).signIn).toBeVisible();
  507 |     await expect(authForm(page).email).toHaveValue(user.email);
  508 |   });
  509 | 
  510 |   test('TC-179 the link opened in another tab of the same browser', async ({ page, context }) => {
  511 |     const user = newUser('other-tab');
  512 |     await page.goto('/sign-up');
  513 |     await fillSignUp(page, user);
  514 |     await expect(checkEmailHeading(page)).toBeVisible();
  515 |     const tab = await context.newPage();
  516 |     await tab.goto(await verificationLink(user.email));
  517 |     await expect(realtimeHeading(tab)).toBeVisible();
  518 | 
  519 |     await page.bringToFront();
  520 |     await page.getByRole('button', { name: /I’ve confirmed, continue/ }).click();
  521 |     await expect(realtimeHeading(page)).toBeVisible();
  522 |   });
  523 | 
  524 |   test('TC-180 Resend the link', async ({ page, browser }) => {
  525 |     const user = newUser('resend');
  526 |     await page.goto('/sign-up');
  527 |     await fillSignUp(page, user);
  528 |     await expect(checkEmailHeading(page)).toBeVisible();
  529 |     await waitForEmail(user.email, 'Confirm', 1);
  530 |     await page.getByRole('button', { name: /resend the link/i }).click();
  531 | 
  532 |     await expect(page.getByRole('button', { name: 'Sent again' })).toBeDisabled();
  533 |     const other = await contextWithIp(browser);
  534 |     await (await other.newPage()).goto(await verificationLink(user.email, 2));
  535 |     await other.close();
  536 |     expect(await isEmailVerified(user.email)).toBe(true);
  537 |   });
  538 | 
  539 |   test('TC-181 Use a different email', async ({ page }) => {
  540 |     await page.goto('/sign-up');
  541 |     await fillSignUp(page, newUser('different'));
  542 |     await expect(checkEmailHeading(page)).toBeVisible();
  543 |     await page.getByRole('button', { name: 'Use a different email' }).click();
  544 |     await expect(createHeading(page)).toBeVisible();
  545 |     await expect(authForm(page).createAccount).toBeVisible();
  546 |   });
  547 | 
  548 |   test('TC-182 Create account with the email of a verified account', async ({ page }) => {
  549 |     const a = await createVerifiedUser();
  550 |     await page.goto('/sign-up');
  551 |     await fillSignUp(page, { name: 'Someone Else', email: a.email, password: 'Other-Horse-93' });
  552 |     await expect(checkEmailHeading(page)).toBeVisible();
  553 | 
  554 |     const notice = await waitForEmail(a.email, 'already have');
  555 |     expect(notice.text).toMatch(/\/sign-in/);
  556 |     expect(notice.text).toMatch(/\/forgot-password/);
  557 |     expect(await countUsers(a.email)).toBe(1);
  558 |     expect(await passwordWorks(a.email, a.password)).toBe(true);
  559 |   });
  560 | 
  561 |   test('TC-183 Create account with the email of an unverified account', async ({ page }) => {
  562 |     const u = await createUnverifiedUser();
  563 |     await page.goto('/sign-up');
  564 |     await fillSignUp(page, { name: 'Someone Else', email: u.email, password: 'Other-Horse-93' });
  565 |     await expect(checkEmailHeading(page)).toBeVisible();
  566 | 
  567 |     const notice = await waitForEmail(u.email, 'already have');
  568 |     expect(notice.text).toMatch(/\/sign-in/);
  569 |     expect(notice.text).toMatch(/\/forgot-password/);
  570 |     expect(notice.text).toMatch(/confirm/i);
  571 |     expect(await countUsers(u.email)).toBe(1);
  572 |   });
  573 | 
  574 |   test('TC-184 reloading Check your email shows Create account', async ({ page }) => {
  575 |     await page.goto('/sign-up');
  576 |     await fillSignUp(page, newUser('reload'));
  577 |     await expect(checkEmailHeading(page)).toBeVisible();
  578 |     await page.reload();
> 579 |     await expect(createHeading(page)).toBeVisible();
      |                                       ^ Error: expect(locator).toBeVisible() failed
  580 |   });
  581 | });
  582 | 
```