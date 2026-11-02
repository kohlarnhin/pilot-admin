import { test, expect, zh } from './fixtures';

test('admin sees all starter menus and create/delete actions', async ({ page, loginAs }) => {
  await loginAs('admin');
  const nav = page.getByRole('navigation');
  for (const title of [zh.menu.dashboard, zh.menu.users, zh.menu.roles, zh.menu.menus, zh.menu.auditLogs,
    zh.menu.settings, zh.menu.assistant, zh.menu.components, zh.menu.crudExample]) {
    await expect(nav.getByRole('link', { name: title, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole('button', { name: zh.layout.assistant, exact: true })).toBeVisible();
  await nav.getByRole('link', { name: zh.menu.users, exact: true }).click();
  await expect(page.getByRole('button', { name: zh.button.userCreate, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: zh.button.userDelete, exact: true }).first()).toBeVisible();
});

test('operator sees users and assistant but no audit logs or delete actions', async ({ page, loginAs }) => {
  await loginAs('operator');
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: zh.menu.auditLogs, exact: true })).toHaveCount(0);
  await expect(nav.getByRole('button', { name: zh.layout.assistant, exact: true })).toBeVisible();
  await nav.getByRole('link', { name: zh.menu.users, exact: true }).click();
  await expect(page.getByRole('button', { name: zh.button.userUpdate, exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: zh.button.userCreate, exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: zh.button.userDelete, exact: true })).toHaveCount(0);
  await nav.getByRole('link', { name: zh.menu.crudExample, exact: true }).click();
  await expect(page.getByRole('button', { name: zh.button.exampleUpdate, exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: zh.button.exampleCreate, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: zh.button.exampleDelete, exact: true })).toHaveCount(0);
});

test('viewer has read-only menus, no assistant, and a direct users URL is forbidden', async ({ page, loginAs }) => {
  await loginAs('viewer');
  const nav = page.getByRole('navigation');
  for (const title of [zh.menu.users, zh.menu.auditLogs]) {
    await expect(nav.getByRole('link', { name: title, exact: true })).toHaveCount(0);
  }
  await expect(nav.getByRole('button', { name: zh.layout.assistant, exact: true })).toHaveCount(0);
  await nav.getByRole('link', { name: zh.menu.crudExample, exact: true }).click();
  await expect(page.getByRole('button', { name: zh.exampleProjects.actions.export, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: zh.button.exampleCreate, exact: true })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: zh.common.columns.actions, exact: true })).toHaveCount(0);
  await page.goto('system/users');
  await expect(page.getByText('403', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: zh.errors.forbiddenTitle, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: zh.menu.users, exact: true })).toHaveCount(0);
});

test('unknown path shows the 404 page', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('does-not-exist');
  await expect(page.getByText('404', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: zh.errors.notFoundTitle, exact: true })).toBeVisible();
});
