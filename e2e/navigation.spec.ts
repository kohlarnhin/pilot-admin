import { test, expect, zh } from './fixtures';

test('sidebar collapse persists across reload', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.getByRole('button', { name: zh.layout.collapseMenu, exact: true }).click();
  await expect(page.getByRole('navigation').first()).toHaveCSS('width', '88px');
  await page.reload();
  await expect(page.getByRole('button', { name: zh.layout.expandMenu, exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation').first()).toHaveCSS('width', '88px');
  await page.getByRole('button', { name: zh.layout.expandMenu, exact: true }).click();
  await expect(page.getByRole('navigation').first()).toHaveCSS('width', '224px');
});

test('keyboard palette finds a page and a user and navigates', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.keyboard.press('ControlOrMeta+k');
  const query = page.getByRole('combobox', { name: zh.search.label });
  await expect(query).toBeFocused();
  await query.fill(zh.menu.roles);
  await expect(page.getByRole('option').filter({ hasText: '/system/roles' })).toBeVisible();
  await query.press('Enter');
  await expect(page).toHaveURL(/\/system\/roles$/);
  await expect(page.getByRole('heading', { name: zh.menu.roles, exact: true })).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  await query.fill('operator');
  const user = page.getByRole('group', { name: zh.search.users, exact: true }).getByRole('option').filter({ hasText: '@operator' });
  await expect(user).toBeVisible();
  await user.click();
  await expect(page).toHaveURL(/\/system\/users\?keyword=operator$/);
  await expect(page.getByPlaceholder(zh.users.searchPlaceholder)).toHaveValue('operator');
  await expect(page.getByRole('row').filter({ hasText: '@operator' })).toBeVisible();
});

test('nested page survives a deep-link reload', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('system/roles');
  await expect(page.getByRole('heading', { name: zh.menu.roles, exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/system\/roles$/);
  await expect(page.getByRole('heading', { name: zh.menu.roles, exact: true })).toBeVisible();
  await expect(page.getByRole('table').getByRole('row').filter({ hasText: 'admin' })).toBeVisible();
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
  test(`users and audit logs scroll inside the table at ${viewport.width}x${viewport.height}`, async ({ page, loginAs }) => {
    await page.setViewportSize(viewport);
    await loginAs('admin');
    for (const route of ['system/users', 'system/audit-logs']) {
      await page.goto(route);
      const table = page.getByRole('table');
      await expect(table.locator('[data-row-key]').first()).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
      const action = table.getByRole('columnheader', { name: zh.common.columns.actions, exact: true });
      await expect(action).toBeInViewport();
      await table.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      await expect.poll(() => table.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    }
  });
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
  test(`sidebar bottom shows the last menu item once at ${viewport.width}x${viewport.height}`, async ({ page, loginAs }) => {
    await page.setViewportSize(viewport);
    await loginAs('admin');
    const nav = page.getByRole('navigation', { name: zh.layout.pageNavigation, exact: true });
    const scroller = page.locator('.scrollbar-hover').filter({ has: nav });
    for (const mode of ['expanded', 'collapsed']) {
      if (mode === 'collapsed') await page.getByRole('button', { name: zh.layout.collapseMenu, exact: true }).click();
      await scroller.hover();
      await scroller.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      // 滚动区只给滑块着色：背景裁成文字会在底部留下同名幽灵文字。
      await expect(scroller).not.toHaveCSS('background-clip', 'text');
      await expect(scroller).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      const last = nav.getByRole('link', { name: zh.menu.resultPages, exact: true });
      await expect(last).toHaveCount(1);
      await expect(last).toBeInViewport({ ratio: 1 });
    }
  });
}

test('narrow viewport keeps the mini sidebar and expands it as an overlay', async ({ page, loginAs }) => {
  await page.setViewportSize({ width: 900, height: 720 });
  await loginAs('admin');
  const sidebar = page.locator('[data-slot="pilot-admin-layout-nav"]');
  const main = page.locator('[data-slot="pilot-admin-layout-main"]');
  const backdrop = page.locator('[data-slot="sidebar-backdrop"]');
  const stored = () => page.evaluate(() => localStorage.getItem('pilot-admin:sidebar-collapsed:v1'));
  const before = await stored();
  await expect.poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().width)).toBe(88);
  await page.getByRole('button', { name: zh.layout.expandMenu, exact: true }).click();
  await expect(backdrop).toHaveCount(1);
  // 浮层展开不推挤内容，也不改写宽屏下保存的折叠偏好。
  await expect.poll(() => main.evaluate((element) => element.getBoundingClientRect().left)).toBe(88);
  expect(await stored()).toBe(before);
  await page.keyboard.press('Escape');
  await expect(backdrop).toHaveCount(0);
  await page.getByRole('button', { name: zh.layout.expandMenu, exact: true }).click();
  await page.getByRole('navigation', { name: zh.layout.pageNavigation, exact: true }).getByRole('link', { name: zh.menu.users, exact: true }).click();
  await expect(backdrop).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
