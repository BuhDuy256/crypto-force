// End-to-end checks for the workspace shell (docs/design/prototype/docs/requirements/workspace.md).
import { expect, test } from '@playwright/test';
import {
  markEmailVerified,
  newTestUser,
  resetRateLimits,
  signInNewUser,
  submitSignIn,
} from './support';

test.describe('signed out', () => {
  // Workspace screens and their names (docs/design/prototype/docs/requirements/workspace.md).
  const screens = [
    ['/realtime', 'Realtime'],
    ['/strategy', 'Strategy Engine'],
    ['/discovery', 'Discovery'],
    ['/backtest', 'Backtest'],
    ['/news', 'News'],
  ] as const;
  for (const [to, name] of screens) {
    test(`${to} shows the sign-in gate`, async ({ page }) => {
      await page.goto(to);
      await expect(page.getByRole('heading', { name: `Sign in to open ${name}` })).toBeVisible();
    });
  }

  test('the gate returns to the same screen after signing in', async ({ page }) => {
    const user = newTestUser();
    await resetRateLimits();
    await page.request.post('/api/auth/sign-up/email', {
      data: user,
      headers: { Origin: 'http://localhost:5173' },
    });
    await markEmailVerified(user.email);

    await page.goto('/discovery?pair=BTCUSDT');
    await page.getByRole('link', { name: 'Sign in to continue' }).click();
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdiscovery%3Fpair%3DBTCUSDT$/);

    await submitSignIn(page, user);
    await expect(page).toHaveURL(/\/discovery\?pair=BTCUSDT$/);
    await expect(page.getByRole('heading', { name: 'Discovery', level: 1 })).toBeVisible();
  });

  test('Back to home leaves the gate for Landing', async ({ page }) => {
    await page.goto('/backtest');
    await page.getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('a session check that fails shows a load error instead of the gate', async ({ page }) => {
    await page.route('**/api/auth/get-session', (route) => route.abort());
    await page.goto('/realtime');
    await expect(page.getByRole('heading', { name: 'Couldn’t load your workspace' })).toBeVisible();

    await page.unroute('**/api/auth/get-session');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in to open Realtime' })).toBeVisible();
  });
});

test.describe('signed in', () => {
  test('the header shows the account and marks the current tab', async ({ page }) => {
    const user = await signInNewUser(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/realtime');

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Realtime' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('button', { name: new RegExp(user.email) })).toBeVisible();

    await nav.getByRole('link', { name: 'Backtest' }).click();
    await expect(page).toHaveURL(/\/backtest$/);
    await expect(nav.getByRole('link', { name: 'Backtest' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Backtest', level: 1 })).toBeVisible();
  });

  test('the account menu works from the keyboard', async ({ page }) => {
    const user = await signInNewUser(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/realtime');

    const trigger = page.getByRole('button', { name: new RegExp(user.email) });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const items = page.getByRole('menuitem');
    await expect(items.first()).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.getByRole('menuitem', { name: 'Help & FAQ' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(items.first()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('menu')).toBeHidden();
  });

  test('Sign out ends the session and opens Landing', async ({ page }) => {
    const user = await signInNewUser(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/news');

    await page.getByRole('button', { name: new RegExp(user.email) }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Create account' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open workspace' })).toHaveCount(0);

    const session = await page.request.get('/api/auth/get-session');
    expect(await session.json()).toBeNull();

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Sign in to open News' })).toBeVisible();
  });

  test('Landing offers Open workspace instead of Sign in and Create account', async ({ page }) => {
    await signInNewUser(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Open workspace' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create account' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);

    await header.getByRole('link', { name: 'Open workspace' }).click();
    await expect(page).toHaveURL(/\/realtime$/);
  });

  test('a failed Sign out keeps the user signed in and says so', async ({ page }) => {
    const user = await signInNewUser(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/realtime');
    await page.route('**/api/auth/sign-out', (route) => route.abort());

    await page.getByRole('button', { name: new RegExp(user.email) }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(
      page.getByText('Couldn’t sign out. Check your connection and try again.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/realtime$/);
    await expect(page.getByRole('button', { name: new RegExp(user.email) })).toBeVisible();
  });

  test('a session ended in another tab shows the gate when the tab is visible again', async ({
    page,
    context,
  }) => {
    await signInNewUser(page);
    await page.goto('/strategy');
    await expect(page.getByRole('heading', { name: 'Strategy Engine', level: 1 })).toBeVisible();

    const other = await context.newPage();
    await other.request.post('/api/auth/sign-out', {
      data: {},
      headers: { Origin: 'http://localhost:5173' },
    });
    await other.close();

    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(
      page.getByRole('heading', { name: 'Sign in to open Strategy Engine' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/strategy$/);
  });

  test('below lg the tabs and account move into a drawer', async ({ page }) => {
    await signInNewUser(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/realtime');

    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
    const open = page.getByRole('button', { name: 'Open menu' });
    await open.click();

    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('E2E User');

    // Focus stays inside the drawer while it is open.
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(open).toBeFocused();

    await open.click();
    await drawer.getByRole('link', { name: 'Discovery' }).click();
    await expect(page).toHaveURL(/\/discovery$/);
    await expect(drawer).toBeHidden();
  });
});
