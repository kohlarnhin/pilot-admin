import { test, expect, zh, signIn, logout, type Role } from './fixtures';

test('wrong password has an associated inline error and allows recovery', async ({ page, loginAs }) => {
  await page.goto('login');
  await page.getByLabel(zh.common.fields.account, { exact: true }).fill('admin');
  const password = page.getByLabel(zh.common.fields.password, { exact: true });
  await password.fill('wrong-password');
  await page.getByRole('button', { name: zh.auth.login, exact: true }).click();
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  await expect(password).toHaveAccessibleDescription(zh.serverErrors.auth.invalidCredentials);
  await expect(page.getByText(zh.serverErrors.auth.invalidCredentials, { exact: true })).toBeVisible();
  await expect(password).toBeFocused();
  await loginAs('admin');
});

for (const role of ['admin', 'operator', 'viewer'] as const satisfies readonly Role[]) {
  test(`${role} signs in and logs out`, async ({ page, loginAs }) => {
    await loginAs(role);
    await logout(page);
  });
}

for (const entry of ['console', 'agent'] as const) {
  test(`remembered ${entry} entry is honored on the next login`, async ({ page, loginAs }) => {
    await loginAs('admin', { entry, remember: true });
    if (entry === 'agent') await page.getByRole('link', { name: zh.agentMode.console }).click();
    await logout(page);
    await signIn(page, 'admin');
    await expect(page).toHaveURL(entry === 'agent' ? /\/agent$/ : /\/dashboard$/);
    await expect(page.getByRole('dialog', { name: zh.agentEntry.title })).toHaveCount(0);
  });
}
