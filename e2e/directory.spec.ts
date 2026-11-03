import { test, expect, zh } from './fixtures';
import { seedText } from '../src/i18n/locales/zh-CN/seed';

const node = (index: number) => seedText.directory.folderNames[index - 1];

test('nested folder includes only its subtree and breadcrumb ancestors navigate', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/directory');
  const tree = page.getByRole('tree', { name: zh.directory.treeLabel });
  await tree.getByRole('treeitem', { name: node(2), exact: true }).click();
  await expect(page).toHaveURL(/\?folder=folder-02$/);
  const crumbs = page.getByRole('navigation', { name: zh.directory.breadcrumb });
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(node(2));
  const table = page.getByRole('table');
  await expect(table.locator('[data-row-key]').first()).toBeVisible();
  const ids = await table.locator('[data-row-key]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-row-key')));
  const allowed = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('pilot-admin:mock-db:v7')!);
    return db.exampleDocuments.filter((document: { folder_id: string }) => ['folder-02', 'folder-03', 'folder-04'].includes(document.folder_id)).map((document: { id: string }) => document.id);
  });
  expect(ids.every((id) => allowed.includes(id))).toBe(true);
  await expect(page.getByText(zh.directory.total.replace('{count}', '160'), { exact: true })).toBeVisible();
  await crumbs.getByRole('button', { name: node(1), exact: true }).click();
  await expect(page).toHaveURL(/\?folder=folder-01$/);
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(node(1));
  await expect(tree.getByRole('treeitem', { name: node(1), exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('tree supports roving focus, expansion, parent movement, Home/End and explicit selection', async ({ page, loginAs }) => {
  await loginAs('operator');
  await page.goto('examples/directory');
  const tree = page.getByRole('tree');
  const all = tree.getByRole('treeitem', { name: zh.directory.allDocuments, exact: true });
  await all.focus();
  await all.press('ArrowRight');
  const resources = tree.getByRole('treeitem', { name: node(1), exact: true });
  await expect(resources).toBeFocused();
  await resources.press('ArrowLeft');
  await expect(resources).toHaveAttribute('aria-expanded', 'false');
  await resources.press('ArrowRight');
  await expect(resources).toHaveAttribute('aria-expanded', 'true');
  await resources.press('ArrowRight');
  const guides = tree.getByRole('treeitem', { name: node(2), exact: true });
  await expect(guides).toBeFocused();
  await guides.press('Enter');
  await expect(guides).toHaveAttribute('aria-selected', 'true');
  await guides.press('ArrowRight');
  const started = tree.getByRole('treeitem', { name: node(3), exact: true });
  await expect(started).toBeFocused();
  await started.press(' ');
  await expect(page).toHaveURL(/folder=folder-03$/);
  await started.press('ArrowLeft');
  await expect(guides).toBeFocused();
  await guides.press('End');
  await expect(tree.getByRole('treeitem', { name: node(18), exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(all).toBeFocused();
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
});

test('tree filtering keeps matching ancestors and distinguishes unmatched document search', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/directory');
  const filter = page.getByRole('textbox', { name: zh.directory.treeSearch, exact: true });
  await filter.fill(node(3));
  const tree = page.getByRole('tree');
  await expect(tree.getByRole('treeitem')).toHaveCount(4);
  await expect(tree.getByRole('treeitem', { name: node(1), exact: true })).toBeVisible();
  await tree.getByRole('treeitem', { name: node(3), exact: true }).click();
  const search = page.getByRole('textbox', { name: zh.directory.documentSearch, exact: true });
  await search.fill('no-such-document');
  await expect(page.getByText(zh.directory.empty.search, { exact: true })).toBeVisible();
  await expect(page.getByRole('table').locator('[data-row-key]')).toHaveCount(0);
});

test('folder deep link survives reload and browser back/forward', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/directory?folder=folder-03');
  await page.reload();
  const tree = page.getByRole('tree');
  await expect(tree.getByRole('treeitem', { name: node(3), exact: true })).toHaveAttribute('aria-selected', 'true');
  await tree.getByRole('treeitem', { name: node(4), exact: true }).click();
  await expect(page).toHaveURL(/folder=folder-04$/);
  await page.goBack();
  await expect(tree.getByRole('treeitem', { name: node(3), exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.goForward();
  await expect(tree.getByRole('treeitem', { name: node(4), exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('empty folder and unknown folder have distinct inline states', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/directory?folder=folder-12');
  await expect(page.getByText(zh.directory.empty.folder, { exact: true })).toBeVisible();
  await expect(page.getByText(zh.directory.total.replace('{count}', '0'), { exact: true })).toBeVisible();
  await page.goto('examples/directory?folder=unknown');
  await expect(page.getByText(zh.directory.unknownFolder, { exact: true })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: zh.directory.allDocuments, exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(zh.directory.total.replace('{count}', '300'), { exact: true })).toBeVisible();
});

test('long folder appends through the table scroller and keeps a bounded mounted window', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/directory?folder=folder-03');
  const table = page.getByRole('table');
  await expect(table.locator('[data-row-key="document-001"]')).toBeVisible();
  // 等待每轮真实分页，直到最后一条进入已加载的虚拟窗口。
  await expect(async () => {
    await table.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect(table.locator('[data-row-key="document-140"]')).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 20_000 });
  expect(await table.locator('[data-row-key]').count()).toBeLessThan(50);
  expect(await table.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => ({ y: scrollY, overflow: document.documentElement.scrollHeight - innerHeight }))).toEqual({ y: 0, overflow: 0 });
});

test('fast folder switching discards late rows from the previous scope', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/directory');
  const tree = page.getByRole('tree');
  await tree.getByRole('treeitem', { name: node(3), exact: true }).click();
  await tree.getByRole('treeitem', { name: node(12), exact: true }).click();
  await expect(page.getByText(zh.directory.empty.folder, { exact: true })).toBeVisible();
  await expect(page.getByRole('table').locator('[data-row-key]')).toHaveCount(0);
});

test('viewer opens directory read-only from navigation and global search', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.getByRole('link', { name: zh.menu.directoryExample, exact: true }).click();
  await expect(page.getByRole('tree')).toBeVisible();
  await expect(page.getByRole('table').locator('[data-row-key]').first()).toBeVisible();
  for (const label of [zh.common.actions.edit, zh.common.actions.delete, zh.common.actions.create]) {
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveCount(0);
  }
  await page.keyboard.press('ControlOrMeta+k');
  const query = page.getByRole('combobox', { name: zh.search.label });
  await query.fill(zh.menu.directoryExample);
  await expect(page.getByRole('option').filter({ hasText: '/examples/directory' })).toBeVisible();
});
