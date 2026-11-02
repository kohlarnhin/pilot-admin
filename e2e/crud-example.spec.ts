import { readFile } from 'node:fs/promises';
import { test, expect, zh } from './fixtures';

test('project filters combine status and keyword', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/crud');
  const status = page.getByRole('combobox', { name: zh.common.columns.status, exact: true });
  await status.click();
  await page.getByRole('option', { name: zh.exampleProjects.status.active, exact: true }).click();
  const search = page.getByRole('textbox', { name: zh.exampleProjects.filters.search });
  await search.fill('PRJ-001');
  await search.press('Enter');
  const table = page.getByRole('table');
  await expect(table.locator('[data-row-key]')).toHaveCount(1);
  await expect(table.getByRole('row').filter({ hasText: 'PRJ-001' })).toContainText(zh.exampleProjects.status.active);
  await status.click();
  await page.getByRole('option', { name: zh.exampleProjects.status.archived, exact: true }).click();
  await expect(table.locator('[data-row-key]')).toHaveCount(0);
  await expect(page.getByText(zh.exampleProjects.empty.title, { exact: true })).toBeVisible();
});

test('project duplicate validation, create, edit, CSV download and confirmed delete', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/crud');
  await page.getByRole('button', { name: zh.button.exampleCreate, exact: true }).click();
  const create = page.getByRole('dialog', { name: zh.button.exampleCreate, exact: true });
  await create.getByRole('textbox', { name: zh.exampleProjects.fields.name, exact: true }).fill('E2E project');
  const code = create.getByRole('textbox', { name: zh.exampleProjects.fields.code, exact: true });
  await code.fill('PRJ-001');
  await create.getByRole('textbox', { name: zh.exampleProjects.fields.owner, exact: true }).fill('E2E owner');
  await create.getByRole('button', { name: zh.common.actions.create, exact: true }).click();
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  await expect(code).toHaveAccessibleDescription(new RegExp(zh.serverErrors.example.codeExists));
  await expect(create.getByRole('textbox', { name: zh.exampleProjects.fields.name, exact: true })).toHaveValue('E2E project');
  await code.fill('E2E-PROJECT');
  await create.getByRole('button', { name: zh.common.actions.create, exact: true }).click();
  await expect(create).toBeHidden();
  const search = page.getByRole('textbox', { name: zh.exampleProjects.filters.search });
  await search.fill('E2E-PROJECT');
  await search.press('Enter');
  const row = page.getByRole('row').filter({ hasText: 'E2E-PROJECT' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: zh.button.exampleUpdate, exact: true }).click();
  const edit = page.getByRole('dialog', { name: zh.button.exampleUpdate, exact: true });
  await edit.getByRole('textbox', { name: zh.exampleProjects.fields.name, exact: true }).fill('E2E edited project');
  await edit.getByRole('button', { name: zh.common.actions.save, exact: true }).click();
  await expect(edit).toBeHidden();
  await expect(row).toContainText('E2E edited project');

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: zh.exampleProjects.actions.export, exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const csv = await readFile(downloadPath!);
  expect([...csv.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(csv.toString('utf8')).toContain('E2E edited project');

  await row.getByRole('button', { name: zh.button.exampleDelete, exact: true }).click();
  await expect(row).toBeVisible();
  await page.getByRole('button', { name: zh.common.actions.confirmDelete, exact: true }).click();
  await expect(row).toHaveCount(0);
  await expect(page.getByText(zh.exampleProjects.empty.title, { exact: true })).toBeVisible();
});
