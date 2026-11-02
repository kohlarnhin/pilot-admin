import { test as base, expect, type Page } from '@playwright/test';
import zh from '../src/i18n/locales/zh-CN';
import en from '../src/i18n/locales/en-US';

export { expect, zh, en };
export type Role = 'admin' | 'operator' | 'viewer';
type LoginOptions = { entry: 'console' | 'agent'; remember?: boolean };

export async function signIn(page: Page, role: Role) {
  const copy = await page.locator('html').getAttribute('lang') === 'en-US' ? en : zh;
  await page.getByLabel(copy.common.fields.account, { exact: true }).fill(role);
  await page.getByLabel(copy.common.fields.password, { exact: true }).fill(`${role}123`);
  await page.getByRole('button', { name: copy.auth.login, exact: true }).click();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: zh.layout.accountMenu, exact: true }).click();
  await page.getByRole('menuitem', { name: zh.layout.logout, exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: zh.auth.login, exact: true })).toBeVisible();
}

export async function createUser(page: Page, account: string, { validateFirst = false } = {}) {
  await page.getByRole('button', { name: zh.button.userCreate, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: zh.button.userCreate, exact: true });
  if (validateFirst) {
    await dialog.getByRole('button', { name: zh.common.actions.create, exact: true }).click();
    const accountInput = dialog.getByRole('textbox', { name: zh.users.fields.loginName, exact: true });
    await expect(accountInput).toHaveAttribute('aria-invalid', 'true');
    await expect(accountInput).toHaveAccessibleDescription(zh.users.validation.loginRequired);
    await expect(accountInput).toBeFocused();
  }
  await dialog.getByRole('textbox', { name: zh.users.fields.loginName, exact: true }).fill(account);
  await dialog.getByRole('textbox', { name: zh.users.fields.displayName, exact: true }).fill(account);
  await dialog.getByRole('combobox', { name: zh.users.fields.roles }).click();
  await page.getByRole('option', { name: /ROLE_VIEWER/ }).click();
  await page.keyboard.press('Escape');
  await dialog.getByRole('button', { name: zh.common.actions.create, exact: true }).click();
  return page.getByRole('dialog', { name: zh.users.toast.created, exact: true });
}

export const test = base.extend<{
  loginAs: (role: Role, options?: LoginOptions) => Promise<void>;
  browserHealth: void;
}>({
  loginAs: async ({ page }, use) => {
    await use(async (role, { entry, remember } = { entry: 'console' }) => {
      await page.goto('login');
      await signIn(page, role);
      if (role !== 'viewer') {
        const copy = await page.locator('html').getAttribute('lang') === 'en-US' ? en : zh;
        const dialog = page.getByRole('dialog', { name: copy.agentEntry.title });
        await expect(dialog).toBeVisible();
        if (remember) await dialog.getByRole('checkbox', { name: copy.agentEntry.remember }).check();
        await dialog.getByRole('button', { name: entry === 'agent' ? copy.agentEntry.agent : copy.agentEntry.console, exact: true }).click();
      }
      await expect(page).toHaveURL(entry === 'agent' ? /\/agent$/ : /\/dashboard$/);
      await expect(page.getByRole('heading', { name: entry === 'agent'
        ? /Agent/ : new RegExp(`${zh.menu.dashboard}|${en.menu.dashboard}`), exact: true })).toBeVisible();
    });
  },
  browserHealth: [async ({ context, baseURL }, use, testInfo) => {
    const errors: string[] = [];
    const origin = new URL(baseURL!).origin;
    context.on('page', (page) => {
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });
    });
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin || /^\/api(?:\/|$)/.test(url.pathname)) {
        errors.push(`Unexpected request: ${url.href}`);
        await route.abort();
      } else await route.continue();
    });
    await use();
    if (errors.length) await testInfo.attach('browser-errors', { body: errors.join('\n'), contentType: 'text/plain' });
    expect(errors, 'Production preview must have no browser errors or external/backend requests').toEqual([]);
  }, { auto: true }],
});
