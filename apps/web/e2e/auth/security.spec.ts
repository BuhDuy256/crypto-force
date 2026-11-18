// Security behavior seen through the running app: password fields and password managers, CORS,
// cookie flags, sign-in from another origin, the email printed in development, security headers,
// no caching of Auth responses, and no referrer from the page with a reset token.
//
// How these tests run: Playwright opens the real app in Chromium. `playwright.config.ts` starts
// the E2E servers (see `e2e/environment.ts`): a fresh database, and emails printed to the server
// console instead of sent; `fixtures.ts` reads links from that console. Each test has its own
// client IP (`x-forwarded-for`), because rate limits count requests per IP. Accounts are created
// through the API or the database to save time; only the step under test goes through the UI.
// Run with `pnpm test:e2e` after `pnpm db:up`, with `pnpm dev` stopped.
//
// Expected results come from the test case whose ID (TC-xxx) starts each test title. The cases are
// in docs/testing/test-scopes/TS-001-auth/03-design/output/04-test-cases.md. When a test fails, read its
// test case first: the test checks the requirement, not the current code.
import {
  APP_ORIGIN_HEADERS,
  authForm,
  createVerifiedUser,
  expect,
  fillSignIn,
  fillSignUp,
  newUser,
  PASSWORD,
  realtimeHeading,
  resetLink,
  sessionCookie,
  sessionEmail,
  test,
  waitForEmail,
} from './fixtures';

const EVIL = 'https://evil.example';

test.describe('ASVS checks', () => {
  test('TC-202 password fields accept paste and allow password managers', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const user = await createVerifiedUser();
    const pasteInto = async (field: ReturnType<typeof authForm>['password']) => {
      await page.evaluate((value) => navigator.clipboard.writeText(value), PASSWORD);
      await field.click();
      await page.keyboard.press('ControlOrMeta+V');
      await expect(field).toHaveValue(PASSWORD);
      expect(await field.getAttribute('autocomplete')).not.toBe('off');
    };

    await page.goto('/sign-in');
    await pasteInto(authForm(page).password);
    await page.goto('/sign-up');
    await pasteInto(authForm(page).password);
    await page.goto(await resetLink(user.email));
    await pasteInto(authForm(page).newPassword);
    await pasteInto(authForm(page).confirmPassword);
  });

  test('TC-207 CORS does not allow another origin', async ({ page }) => {
    for (const path of ['/api/auth/get-session', '/api/auth-config']) {
      const response = await page.request.get(path, { headers: { Origin: EVIL } });
      const allowed = response.headers()['access-control-allow-origin'];
      expect([undefined, 'http://localhost:5173'], path).toContain(allowed);
    }
  });
});

test.describe('security configuration', () => {
  test('TC-220 rows 1 and 2: the session cookie is HttpOnly and SameSite=Lax', async ({
    page,
    context,
  }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, user.email, user.password);
    await expect(realtimeHeading(page)).toBeVisible();
    const cookie = await sessionCookie(context);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
  });

  test('TC-221 row 1: a sign-in from another origin is rejected', async ({ page }) => {
    const user = await createVerifiedUser();
    const response = await page.request.post('/api/auth/sign-in/email', {
      data: { email: user.email, password: user.password },
      headers: { Origin: EVIL },
    });
    expect(response.status()).toBe(403);
    expect(await sessionEmail(page.request)).toBeNull();
  });

  test('TC-225 development prints the email with the link to the API console', async ({ page }) => {
    const user = newUser('console');
    await page.goto('/sign-up');
    await fillSignUp(page, user);
    const email = await waitForEmail(user.email, 'Confirm');
    expect(email.text).toMatch(/http:\/\/localhost:5173\/api\/auth\/verify-email\?token=/);
  });

  test('TC-227 security headers on API responses', async ({ page }) => {
    for (const path of ['/api/auth/get-session', '/api/auth-config', '/api/does-not-exist']) {
      const headers = (await page.request.get(path, { headers: APP_ORIGIN_HEADERS })).headers();
      expect(headers['x-content-type-options'], path).toBe('nosniff');
      expect(headers['referrer-policy'], path).toBe('no-referrer');
      expect(headers['content-security-policy'] ?? '', path).toMatch(/frame-ancestors 'none'/);
    }
  });

  test('TC-228 Auth responses are not stored', async ({ page }) => {
    const response = await page.request.get('/api/auth/get-session');
    expect(response.headers()['cache-control'] ?? '').toMatch(/no-store/);
  });

  test('TC-230 the page with a reset token sends no referrer', async ({ page }) => {
    const user = await createVerifiedUser();
    const response = await page.goto(await resetLink(user.email));
    const header = response?.headers()['referrer-policy'];
    const meta = await page
      .locator('meta[name="referrer"]')
      .getAttribute('content')
      .catch(() => null);
    expect([header, meta]).toContain('no-referrer');
  });
});
