# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\links.spec.ts >> verification link >> TC-071 the link of B while signed in as A
- Location: e2e\auth\links.spec.ts:184:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('b-cdfdca28-1587-484b-a426-2ca72b132835@example.com is verified. You’re still signed in as a-520d3257-7bf4-4940-9160-ac972a21fef9@example.com.')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('b-cdfdca28-1587-484b-a426-2ca72b132835@example.com is verified. You’re still signed in as a-520d3257-7bf4-4940-9160-ac972a21fef9@example.com.') with timeout 10000ms
  - waiting for getByText('b-cdfdca28-1587-484b-a426-2ca72b132835@example.com is verified. You’re still signed in as a-520d3257-7bf4-4940-9160-ac972a21fef9@example.com.')

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
  - button "E2E User b-cdfdca28-1587-484b-a426-2ca72b132835@example.com"
- main:
  - heading "Realtime" [level=1]
  - paragraph: This screen is not built yet.
- region "Notifications alt+T"
```

# Test source

```ts
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
  166 |     await page.goto(link);
  167 |     await expect(chooseHeading(page)).toBeVisible();
  168 |     await expireResetLink(link);
  169 |     await saveNewPassword(page, NEW_PASSWORD);
  170 | 
  171 |     await expectExpiredScreen(page);
  172 |     expect(await passwordWorks(user.email, user.password)).toBe(true);
  173 |   });
  174 | });
  175 | 
  176 | test.describe('verification link', () => {
  177 |   test('TC-070 the first opening verifies the account and opens Realtime', async ({ page }) => {
  178 |     const user = await createUnverifiedUser();
  179 |     await page.goto(await verificationLink(user.email));
  180 |     await expect(realtimeHeading(page)).toBeVisible();
  181 |     expect(await sessionEmail(page.request)).toBe(user.email);
  182 |   });
  183 | 
  184 |   test('TC-071 the link of B while signed in as A', async ({ page, context, browser }) => {
  185 |     const a = await createVerifiedUser('a');
  186 |     const b = await createUnverifiedUser('b');
  187 |     await signInAs(context, a);
  188 |     await page.goto(await verificationLink(b.email));
  189 | 
  190 |     await expect(
  191 |       page.getByText(`${b.email} is verified. You’re still signed in as ${a.email}.`),
> 192 |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  193 |     expect(await sessionEmail(page.request)).toBe(a.email);
  194 |     const other = await contextWithIp(browser);
  195 |     const otherPage = await other.newPage();
  196 |     await otherPage.goto('/sign-in');
  197 |     await fillSignIn(otherPage, b.email, b.password);
  198 |     await expect(realtimeHeading(otherPage)).toBeVisible();
  199 |     await other.close();
  200 |   });
  201 | 
  202 |   test('TC-072 an expired link without a session', async ({ page }) => {
  203 |     const b = await createUnverifiedUser();
  204 |     await page.goto(await expiredVerificationLink(await verificationLink(b.email)));
  205 |     await verificationLinkError(page);
  206 |     expect(await sessionEmail(page.request)).toBeNull();
  207 |     expect(await isEmailVerified(b.email)).toBe(false);
  208 |   });
  209 | 
  210 |   test('TC-073 an older link after the email was verified with a newer one', async ({
  211 |     browser,
  212 |   }) => {
  213 |     const b = await createUnverifiedUser();
  214 |     const l1 = await verificationLink(b.email, 1);
  215 |     const resend = await contextWithIp(browser);
  216 |     await resend.request.post('/api/auth/send-verification-email', {
  217 |       data: { email: b.email, callbackURL: '/sign-in' },
  218 |       headers: APP_ORIGIN_HEADERS,
  219 |     });
  220 |     await resend.close();
  221 |     const l2 = await verificationLink(b.email, 2);
  222 | 
  223 |     const browser1 = await contextWithIp(browser);
  224 |     await (await browser1.newPage()).goto(l2);
  225 |     const browser2 = await contextWithIp(browser);
  226 |     const page2 = await browser2.newPage();
  227 |     await page2.goto(l1);
  228 | 
  229 |     await expect(authForm(page2).signIn).toBeVisible();
  230 |     await expect(page2.getByRole('alert')).toHaveCount(0);
  231 |     expect(await sessionEmail(page2.request)).toBeNull();
  232 |     await browser1.close();
  233 |     await browser2.close();
  234 |   });
  235 | 
  236 |   test('TC-074 a used link opened again without a session', async ({ browser }) => {
  237 |     const b = await createUnverifiedUser();
  238 |     const link = await verificationLink(b.email);
  239 |     const browser1 = await contextWithIp(browser);
  240 |     await (await browser1.newPage()).goto(link);
  241 |     await browser1.close();
  242 | 
  243 |     const browser2 = await contextWithIp(browser);
  244 |     const page2 = await browser2.newPage();
  245 |     await page2.goto(link);
  246 |     await expect(authForm(page2).signIn).toBeVisible();
  247 |     await expect(page2.getByRole('alert')).toHaveCount(0);
  248 |     expect(await sessionEmail(page2.request)).toBeNull();
  249 |     await browser2.close();
  250 |   });
  251 | 
  252 |   test('TC-075 a used link opened again with the session of the same account', async ({ page }) => {
  253 |     const b = await createUnverifiedUser();
  254 |     const link = await verificationLink(b.email);
  255 |     await page.goto(link);
  256 |     await expect(realtimeHeading(page)).toBeVisible();
  257 |     await page.goto(link);
  258 |     await expect(realtimeHeading(page)).toBeVisible();
  259 |     expect(await sessionEmail(page.request)).toBe(b.email);
  260 |   });
  261 | 
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
```