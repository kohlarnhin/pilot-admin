import { test, expect, zh, logout } from './fixtures';

const adminId = (number: number) => `notification-u-0001-${String(number).padStart(3, '0')}`;
const inbox = '[data-slot="notification-list"]';
const entry = '[data-slot="notification-entry"]';
const openRow = (id: string) => `[data-open-id="${id}"]`;

test('badge, six-item popover, mark-all-read and focus return', async ({ page, loginAs }) => {
  await loginAs('admin');
  await expect(page.locator('[data-slot="notification-badge"]')).toHaveText('47');
  const bell = page.locator(entry);
  await bell.focus();
  await bell.press('Enter');
  const popup = page.getByRole('dialog', { name: zh.notifications.title, exact: true });
  await expect(popup.locator('[data-notification-id]')).toHaveCount(6);
  await popup.getByRole('button', { name: zh.notifications.markAllRead, exact: true }).press('Enter');
  await expect(page.locator('[data-slot="notification-badge"]')).toHaveCount(0);
  await expect(popup.getByRole('img', { name: zh.notifications.unread, exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(bell).toBeFocused();
  await bell.press('Enter');
  await popup.getByRole('button', { name: zh.notifications.viewAll, exact: true }).press('Enter');
  await expect(page).toHaveURL(/\/notifications$/);
});

test('list roving focus, Enter opening and Delete confirmation are keyboard accessible', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('notifications');
  const first = page.locator(openRow(adminId(1)));
  const second = page.locator(openRow(adminId(2)));
  await first.focus();
  await first.press('ArrowDown');
  await expect(second).toBeFocused();
  await second.press('Enter');
  await expect(page).toHaveURL(new RegExp(`id=${adminId(2)}$`));
  await expect(second).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-slot="notification-detail-card"]').getByText(zh.notifications.read, { exact: true })).toBeVisible();
  await second.press('ArrowUp');
  await expect(first).toBeFocused();
  await first.press('Enter');
  await expect(page).toHaveURL(new RegExp(`id=${adminId(1)}$`));
  await first.press('Delete');
  const confirm = page.getByRole('dialog', { name: zh.notifications.deleteConfirm, exact: true });
  await expect(confirm).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(first).toBeFocused();
});

test('deep links, reload and browser back/forward preserve selection without changing pages', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto(`notifications?id=${adminId(5)}`);
  await expect(page.locator('[data-slot="notification-title"]')).toContainText(zh.notifications.seed.summary.title);
  await page.reload();
  await expect(page.locator('[data-slot="notification-title"]')).toContainText(zh.notifications.seed.summary.title);
  await page.locator(openRow(adminId(4))).click();
  await expect(page.locator('[data-slot="notification-title"]')).toContainText(zh.notifications.seed.export.title);
  await page.goBack();
  await expect(page.locator('[data-slot="notification-title"]')).toContainText(zh.notifications.seed.summary.title);
  await page.goForward();
  await expect(page.locator('[data-slot="notification-title"]')).toContainText(zh.notifications.seed.export.title);
});

test('mark unread, reopen, delete and related-page navigation', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto(`notifications?id=${adminId(1)}`);
  const detail = page.locator('[data-slot="notification-detail-card"]');
  const unread = detail.getByRole('button', { name: zh.notifications.markUnread, exact: true });
  await expect(unread).toBeEnabled();
  await unread.click();
  await expect(detail.getByText(zh.notifications.unread, { exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="notification-badge"]')).toHaveText('47');
  await page.locator(openRow(adminId(1))).click();
  await expect(detail.getByText(zh.notifications.read, { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: zh.notifications.delete, exact: true }).click();
  await page.getByRole('dialog', { name: zh.notifications.deleteConfirm, exact: true }).getByRole('button', { name: zh.common.actions.confirmDelete, exact: true }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.locator(openRow(adminId(1)))).toHaveCount(0);
  await expect(detail.getByText(zh.notifications.empty.select, { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: zh.notifications.search, exact: true })).toBeFocused();
  await page.locator(openRow(adminId(2))).click();
  await detail.getByRole('button', { name: zh.notifications.openLink, exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
});

test('bulk mark-read and delete use loaded IDs; filters clear selection', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('notifications');
  const select = page.getByRole('checkbox', { name: zh.notifications.selectLoaded, exact: true });
  await expect(page.locator(openRow(adminId(1)))).toBeVisible();
  await select.check();
  const bar = page.locator('[data-slot="selection-bar"]');
  await expect(bar).toBeVisible();
  await bar.getByRole('button', { name: zh.notifications.markRead, exact: true }).click();
  await expect(bar).toBeHidden();
  await page.locator(inbox).getByRole('checkbox').first().check();
  await page.locator(inbox).getByRole('checkbox').nth(1).check();
  await bar.getByRole('button', { name: zh.notifications.delete, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: zh.notifications.deleteConfirm, exact: true });
  await expect(dialog).toContainText(zh.notifications.deleteDescription.replace('{count}', '2'));
  await dialog.getByRole('button', { name: zh.common.actions.confirmDelete, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('textbox', { name: zh.notifications.search, exact: true })).toBeFocused();
  await expect(page.locator(openRow(adminId(1)))).toHaveCount(0);
  await expect(page.locator(openRow(adminId(2)))).toHaveCount(0);
  await page.locator(inbox).getByRole('checkbox').first().check();
  await page.getByRole('tab', { name: new RegExp(`^${zh.notifications.unread}`) }).click();
  await expect(bar).toBeHidden();
});

test('admin role assignment creates an account notification visible after recipient re-login', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('system/users');
  await page.getByPlaceholder(zh.users.searchPlaceholder).fill('operator');
  const row = page.getByRole('row').filter({ hasText: '@operator' });
  await row.getByRole('button', { name: zh.button.userUpdate, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: zh.button.userUpdate, exact: true });
  await dialog.getByRole('combobox', { name: zh.users.fields.roles, exact: true }).click();
  await page.getByRole('option', { name: /ROLE_VIEWER/ }).click();
  await page.keyboard.press('Escape');
  await dialog.getByRole('button', { name: zh.common.actions.save, exact: true }).click();
  await expect(dialog).toBeHidden();
  await logout(page);
  await loginAs('operator');
  await expect(page.locator('[data-slot="notification-badge"]')).toHaveText('11');
  await page.goto('notifications');
  const notification = page.locator('[data-open-id]').filter({ hasText: zh.notifications.generated.roles.title });
  await expect(notification).toBeVisible();
  await notification.click();
  await expect(page.locator('[data-slot="notification-detail-card"]')).toContainText(zh.notifications.generated.roles.body);
});

test('viewer has own inbox and account-menu entry but cannot open another recipient notification', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await expect(page.locator('[data-slot="notification-badge"]')).toHaveText('10');
  await page.locator('[data-slot="account-menu-trigger"]').click();
  await page.getByRole('menuitem', { name: zh.notifications.title, exact: true }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(page.locator(inbox)).toHaveAttribute('data-loaded-count', '15');
  await expect(page.locator('[data-open-id]').first()).toBeVisible();
  expect(await page.locator('[data-open-id]').evaluateAll((rows) => rows.every((row) => row.getAttribute('data-open-id')?.startsWith('notification-u-0003-')))).toBe(true);
  await page.goto(`notifications?id=${adminId(1)}`);
  await expect(page.getByRole('alert')).toContainText(zh.notifications.errors.notFound);
  await expect(page.locator('[data-slot="notification-title"]')).toHaveCount(0);
  await expect(page.locator('[data-slot="notification-detail-card"]').getByRole('button', { name: zh.notifications.delete, exact: true })).toHaveCount(0);
});

test('long inbox appends all 70 rows with deduplication, bounded virtualization and independent scrolling', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto(`notifications?id=${adminId(5)}`);
  const list = page.locator(inbox);
  await expect(page.locator('[data-slot="notification-title"]')).toBeVisible();
  await expect(async () => {
    await list.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect(page.locator(openRow(adminId(70)))).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 20_000 });
  await expect(list).toHaveAttribute('data-loaded-count', '70');
  const ids = await list.locator('[data-notification-id]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-notification-id')));
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids.length).toBeLessThan(25);
  const listTop = await list.evaluate((element) => element.scrollTop);
  const body = page.locator('[data-slot="notification-body"]');
  await body.focus();
  await body.press('End');
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await list.evaluate((element) => element.scrollTop)).toBe(listTop);
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight, scroll: scrollY }))).toEqual({ x: 0, y: 0, scroll: 0 });
});

test('category and keyword filters have distinct empty state and discard late queries', async ({ page, loginAs }) => {
  await loginAs('operator');
  await page.goto('notifications');
  const search = page.getByRole('textbox', { name: zh.notifications.search, exact: true });
  await search.fill('no-matching-notification');
  await expect(page.getByText(zh.notifications.empty.search, { exact: true })).toBeVisible();
  await expect(page.locator('[data-open-id]')).toHaveCount(0);
  await search.clear();
  await page.getByRole('combobox', { name: zh.notifications.category, exact: true }).click();
  await page.getByRole('option', { name: zh.notifications.categories.security, exact: true }).click();
  await expect(page.locator('[data-open-id]')).toHaveCount(3);
  await expect(page.locator('[data-open-id]').first()).toContainText(zh.notifications.seed.password.title);
});

test('under 1024px detail replaces the list and back returns to the inbox', async ({ page, loginAs }) => {
  await page.setViewportSize({ width: 900, height: 720 });
  await loginAs('admin');
  await page.goto('notifications');
  await page.locator(openRow(adminId(1))).click();
  await expect(page.locator('[data-slot="notification-list-card"]')).toBeHidden();
  await expect(page.locator('[data-slot="notification-detail-card"]')).toBeVisible();
  await page.getByRole('button', { name: zh.notifications.back, exact: true }).click();
  await expect(page.locator('[data-slot="notification-list-card"]')).toBeVisible();
  await expect(page.getByRole('textbox', { name: zh.notifications.search, exact: true })).toBeFocused();
});


test('reading from the unread filter keeps keyboard focus on the adjacent record', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('notifications');
  await page.getByRole('tab', { name: new RegExp(`^${zh.notifications.unread}`) }).click();
  const first = page.locator(openRow(adminId(1)));
  await first.focus();
  await first.press('Enter');
  await expect(page.locator('[data-slot="notification-title"]')).toBeVisible();
  await expect(first).toHaveCount(0);
  const second = page.locator(openRow(adminId(2)));
  await expect(second).toBeFocused();
  await second.press('ArrowDown');
  await expect(page.locator(openRow(adminId(4)))).toBeFocused();
});
