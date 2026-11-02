import { test, expect, zh, en } from './fixtures';

test('English selected on login persists through sign-in and reload', async ({ page, loginAs }) => {
  await page.goto('login');
  await page.getByRole('button', { name: zh.layout.switchLanguage }).click();
  await page.getByRole('menuitemradio', { name: 'English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.getByRole('button', { name: en.auth.login, exact: true })).toBeVisible();
  await loginAs('admin');
  const users = page.getByRole('navigation').getByRole('link', { name: en.menu.users, exact: true });
  await expect(users).toBeVisible();
  await users.click();
  await expect(page.getByRole('heading', { name: en.menu.users, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  await expect(page.getByRole('heading', { name: en.menu.users, exact: true })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: en.menu.settings, exact: true })).toBeVisible();
});
