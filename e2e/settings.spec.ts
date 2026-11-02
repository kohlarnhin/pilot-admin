import { test, expect, zh, createUser } from './fixtures';

test('admin reset removes a user created earlier in the same browser', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('system/users');
  const account = 'e2e_reset_user';
  const success = await createUser(page, account);
  await expect(success).toBeVisible();
  await success.getByRole('button', { name: zh.common.actions.gotIt, exact: true }).click();
  await page.getByPlaceholder(zh.users.searchPlaceholder).fill(account);
  await page.getByPlaceholder(zh.users.searchPlaceholder).press('Enter');
  await expect(page.getByRole('row').filter({ hasText: `@${account}` })).toBeVisible();
  await page.getByRole('link', { name: zh.menu.settings, exact: true }).click();
  await page.getByRole('tab', { name: new RegExp(zh.settings.sections.demo.title) }).click();
  await page.getByRole('button', { name: zh.button.settingsReset, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: zh.button.settingsReset, exact: true });
  await dialog.getByRole('button', { name: zh.common.actions.confirmReset, exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('link', { name: zh.menu.users, exact: true }).click();
  await page.getByPlaceholder(zh.users.searchPlaceholder).fill(account);
  await page.getByPlaceholder(zh.users.searchPlaceholder).press('Enter');
  await expect(page.getByText(zh.search.noUsers, { exact: true })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: `@${account}` })).toHaveCount(0);
});
