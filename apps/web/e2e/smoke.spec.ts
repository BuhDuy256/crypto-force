// Smoke test in the browser: create an account, open the verification link from the server
// console, then sign in. When it fails, the E2E servers or the auth screens do not work, and the
// failures of the other specs say nothing about single features: fix this first.
import {
  authForm,
  expect,
  fillSignUp,
  newUser,
  realtimeHeading,
  test,
  verificationLink,
} from './auth/fixtures';

test('create an account, confirm the email, then sign in', async ({ page, browser }) => {
  const user = newUser('smoke');
  await page.goto('/sign-up');
  await fillSignUp(page, user);
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

  // The link opens in another browser, so this one still has to sign in.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto(await verificationLink(user.email));
  await expect(realtimeHeading(otherPage)).toBeVisible();
  await other.close();

  await page.getByRole('button', { name: /I’ve confirmed, continue to Realtime/ }).click();
  await expect(authForm(page).email).toHaveValue(user.email);
  await authForm(page).password.fill(user.password);
  await authForm(page).signIn.click();
  await expect(realtimeHeading(page)).toBeVisible();
});
