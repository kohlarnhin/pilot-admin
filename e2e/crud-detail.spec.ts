import { test, expect, zh } from './fixtures';

test('project name opens detail and back returns to the list', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/crud');
  const name = page.locator('a[href="/examples/crud/project-001"]');
  await expect(name).toBeVisible();
  const title = await name.innerText();
  await name.click();
  await expect(page).toHaveURL(/\/examples\/crud\/project-001$/);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: zh.exampleProjects.detail.metadata, exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: zh.exampleProjects.fields.description, exact: true })).toBeVisible();
  await page.getByRole('button', { name: zh.exampleProjects.detail.back, exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/crud$/);
  await expect(name).toBeVisible();
});

test('project detail supports deep links and reload', async ({ page, loginAs }) => {
  await loginAs('operator');
  await page.goto('examples/crud/project-001');
  await expect(page.getByRole('region', { name: zh.exampleProjects.detail.metadata, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-slot="project-history-scroll"]')).toBeVisible();
  await expect(page.getByRole('button', { name: zh.common.actions.edit, exact: true })).toBeVisible();
});

test('unknown project renders inline not-found and a list return path', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/crud/does-not-exist');
  await expect(page.getByText(zh.exampleProjects.detail.notFound, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: zh.exampleProjects.detail.back, exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/crud$/);
});

test('viewer detail is read-only', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/crud/project-001');
  await expect(page.getByRole('region', { name: zh.exampleProjects.detail.metadata, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: zh.common.actions.edit, exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: zh.common.actions.delete, exact: true })).toHaveCount(0);
});
