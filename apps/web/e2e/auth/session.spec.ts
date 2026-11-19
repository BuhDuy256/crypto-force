// Sessions in the browser: the session cookie with and without "Keep me signed in", the gate on
// workspace pages when there is no session (also after the session ends in another tab), and the
// Sign out flows, also when the request fails.
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
  authForm,
  backtestHeading,
  createVerifiedUser,
  expect,
  fillSignIn,
  gateHeading,
  realtimeHeading,
  sessionAcceptedFor,
  sessionCookie,
  sessionEmail,
  signInAs,
  signOutFromMenu,
  test,
} from './fixtures';
import type { Page } from '@playwright/test';

/**
 * Sends the events a real browser sends to a tab when the user leaves it for another tab, or comes
 * back to it. Headless Chromium keeps every tab visible, so `bringToFront` alone sends none of them.
 */
async function switchTab(page: Page, direction: 'away' | 'back') {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (hidden ? 'hidden' : 'visible'),
    });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event(hidden ? 'blur' : 'focus'));
  }, direction === 'away');
}

const loadError = 'Couldn’t load your workspace';
const signOutToast = /Couldn’t sign out/;

test.describe('session cookie and Sign out', () => {
  test('TC-030 Keep me signed in on: the cookie lasts 7 days', async ({ page, context }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    const signedInAt = Date.now() / 1000;
    await fillSignIn(page, user.email, user.password, true);
    await expect(realtimeHeading(page)).toBeVisible();

    const cookie = await sessionCookie(context);
    expect(Math.abs((cookie?.expires ?? 0) - (signedInAt + 604_800))).toBeLessThanOrEqual(60);
  });

  test('TC-031 Keep me signed in off: the cookie lasts for the browser session', async ({
    page,
    context,
  }) => {
    const user = await createVerifiedUser();
    await page.goto('/sign-in');
    await fillSignIn(page, user.email, user.password, false);
    await expect(realtimeHeading(page)).toBeVisible();

    expect((await sessionCookie(context))?.expires).toBe(-1);
  });

  for (const [row, remember] of [
    [1, true],
    [2, false],
  ] as const) {
    test(`TC-037 row ${String(row)}: Sign out ends the session`, async ({ page, context }) => {
      const user = await createVerifiedUser();
      await signInAs(context, user, remember);
      const saved = (await sessionCookie(context))?.value ?? '';
      await page.goto('/realtime');
      await signOutFromMenu(page, user.email);

      await expect(page).toHaveURL(/\/$/);
      expect(await sessionCookie(context)).toBeUndefined();
      expect(await sessionAcceptedFor(saved)).toBeNull();
    });
  }

  test('TC-038 a failed Sign out keeps the session and says so', async ({ page, context }) => {
    const user = await createVerifiedUser();
    await signInAs(context, user);
    await page.goto('/realtime');
    await page.route('**/api/auth/sign-out', (route) => route.fulfill({ status: 500, body: '{}' }));
    await signOutFromMenu(page, user.email);

    await expect(page.getByText(signOutToast)).toBeVisible();
    await expect(page).toHaveURL(/\/realtime$/);
    expect(await sessionEmail(page.request)).toBe(user.email);
  });

  for (const [row, remember] of [
    [1, true],
    [2, false],
  ] as const) {
    test(`TC-040 row ${String(row)}: close and reopen the browser`, async ({ browser }) => {
      const user = await createVerifiedUser();
      const first = await browser.newContext();
      await signInAs(first, user, remember);
      const kept = (await first.cookies()).filter((cookie) => cookie.expires > 0);
      await first.close();

      const reopened = await browser.newContext();
      await reopened.addCookies(kept);
      const page = await reopened.newPage();
      await page.goto('/realtime');
      if (remember) await expect(realtimeHeading(page)).toBeVisible();
      else await expect(gateHeading(page, 'Realtime')).toBeVisible();
      await reopened.close();
    });
  }
});

test.describe('sign-in gate', () => {
  test('TC-120 with a session: switch screens, then Sign out', async ({ page, context }) => {
    const user = await createVerifiedUser();
    await signInAs(context, user);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/backtest');
    await expect(backtestHeading(page)).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Realtime' })
      .click();
    await expect(realtimeHeading(page)).toBeVisible();
    await signOutFromMenu(page, user.email);
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-121 without a session: the gate leads to Sign in and back to Backtest', async ({
    page,
  }) => {
    const user = await createVerifiedUser();
    await page.goto('/backtest');
    await expect(gateHeading(page, 'Backtest')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible();
    await page.getByRole('link', { name: 'Sign in to continue' }).click();

    await expect(
      page.getByRole('status').filter({ hasText: /continue to Backtest/ }),
    ).toBeVisible();
    await fillSignIn(page, user.email, user.password);
    await expect(backtestHeading(page)).toBeVisible();
  });

  test('TC-122 Back to home opens Landing', async ({ page }) => {
    await page.goto('/backtest');
    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('TC-123 a failed session check shows a load error until the API answers', async ({
    page,
    context,
  }) => {
    await signInAs(context, await createVerifiedUser());
    await page.route('**/api/auth/get-session**', (route) =>
      route.fulfill({ status: 500, body: '{}' }),
    );
    await page.goto('/backtest');
    await expect(page.getByRole('heading', { name: loadError })).toBeVisible();
    await expect(gateHeading(page, 'Backtest')).toHaveCount(0);

    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { name: loadError })).toBeVisible();

    await page.unroute('**/api/auth/get-session**');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(backtestHeading(page)).toBeVisible();
  });

  test('TC-124 retry after the API answers, without a session, shows the gate', async ({
    page,
  }) => {
    await page.route('**/api/auth/get-session**', (route) =>
      route.fulfill({ status: 500, body: '{}' }),
    );
    await page.goto('/backtest');
    await expect(page.getByRole('heading', { name: loadError })).toBeVisible();
    await page.unroute('**/api/auth/get-session**');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(gateHeading(page, 'Backtest')).toBeVisible();
  });

  test('TC-125 a session ended in another tab: switching screen shows the gate', async ({
    page,
    context,
  }) => {
    const user = await createVerifiedUser();
    await signInAs(context, user);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/realtime');
    const tab2 = await context.newPage();
    await tab2.goto('/backtest');
    await signOutFromMenu(tab2, user.email);
    await expect(tab2).toHaveURL(/\/$/);

    await page.bringToFront();
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: /Strategy/ })
      .click();
    await expect(gateHeading(page, 'Strategy')).toBeVisible();
  });

  test('TC-126 a session ended in another tab: returning to the tab shows the gate', async ({
    page,
    context,
  }) => {
    const user = await createVerifiedUser();
    await signInAs(context, user);
    await page.goto('/realtime');
    const tab2 = await context.newPage();
    await tab2.bringToFront();
    await switchTab(page, 'away');
    await tab2.goto('/backtest');
    await signOutFromMenu(tab2, user.email);
    await expect(tab2).toHaveURL(/\/$/);

    await page.bringToFront();
    await switchTab(page, 'back');
    await expect(gateHeading(page, 'Realtime')).toBeVisible();
  });
});

test.describe('Sign out flows', () => {
  test('TC-193 Sign out, then Back, shows the gate and no loaded data', async ({ page }) => {
    const user = await createVerifiedUser();
    await page.goto('/backtest');
    await page.getByRole('link', { name: 'Sign in to continue' }).click();
    await fillSignIn(page, user.email, user.password);
    await expect(backtestHeading(page)).toBeVisible();

    await signOutFromMenu(page, user.email);
    await expect(page).toHaveURL(/\/$/);
    expect(await sessionEmail(page.request)).toBeNull();
    await page.goBack();
    await expect(gateHeading(page, 'Backtest')).toBeVisible();
    await expect(backtestHeading(page)).toHaveCount(0);

    await page.goto('/sign-in');
    await expect(authForm(page).email).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /continue to/ })).toHaveCount(0);
  });

  test('TC-194 Sign out when the request fails keeps the user signed in', async ({
    page,
    context,
  }) => {
    const user = await createVerifiedUser();
    await signInAs(context, user);
    await page.goto('/backtest');
    await page.route('**/api/auth/sign-out', (route) => route.fulfill({ status: 500, body: '{}' }));
    await signOutFromMenu(page, user.email);

    await expect(page.getByText(signOutToast)).toBeVisible();
    await expect(page).toHaveURL(/\/backtest$/);
    expect(await sessionEmail(page.request)).toBe(user.email);
  });
});
