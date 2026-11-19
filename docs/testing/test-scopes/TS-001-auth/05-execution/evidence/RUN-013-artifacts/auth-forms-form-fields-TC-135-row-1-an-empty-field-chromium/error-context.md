# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\forms.spec.ts >> form fields >> TC-135 row 1: an empty field
- Location: e2e\auth\forms.spec.ts:153:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Fill in both fields.')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Fill in both fields.') with timeout 10000ms
  - waiting for getByText('Fill in both fields.')

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
  - region "Choose a new password":
    - heading "Choose a new password" [level=1]
    - text: New password
    - textbox "New password" [invalid]
    - button "Show password": Show
    - text: Use at least 8 characters. Confirm new password
    - textbox "Confirm new password" [invalid]: New-Horse-92
    - button "Show password": Show
    - text: The two passwords don’t match.
    - button "Save new password"
- region "Notifications alt+T"
```

# Test source

```ts
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
  83  |         expect(await fieldError(authForm(page).name)).toBe(message);
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
> 159 |       await expect(page.getByText(message ?? '')).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
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
  238 |       await expect(authForm(page).email).toHaveValue('an@example.com');
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
```