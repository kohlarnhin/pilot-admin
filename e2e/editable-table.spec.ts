import { test, expect, zh } from './fixtures';

test('editable table validates, saves, discards and remembers hidden columns', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/editable-table');
  const table = page.getByRole('table', { name: zh.exampleTable.tableLabel });
  await expect(table.getByRole('row')).toHaveCount(13);
  const save = page.getByRole('button', { name: zh.exampleTable.actions.save, exact: true });
  await expect(save).toBeDisabled();

  const names = table.getByRole('textbox', { name: new RegExp(`^${zh.exampleTable.columns.name} · `) });
  const firstName = names.first();
  await firstName.fill('');
  await page.getByRole('button', { name: zh.exampleTable.actions.add, exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(14);
  await expect(names.last()).toBeFocused();
  await save.click();
  await expect(page.getByRole('alert').filter({ hasText: zh.exampleTable.validation.summary.replace('{count}', '3') })).toBeVisible();
  await expect(firstName).toBeFocused();
  await expect(firstName).toHaveAttribute('aria-invalid', 'true');

  await firstName.fill('Keyboard');
  await names.last().fill('Stand');
  await table.getByRole('textbox', { name: `${zh.exampleTable.columns.price} · Stand`, exact: true }).fill('12');
  await save.click();
  await expect(page.locator('[data-slot="change-summary"]')).toContainText(zh.exampleTable.savedAt.split('{')[0]);
  await expect(save).toBeDisabled();

  await table.getByRole('checkbox', { name: zh.exampleTable.actions.selectAll }).check();
  await page.getByRole('button', { name: zh.exampleTable.actions.batchRemove, exact: true }).click();
  await expect(page.getByText(zh.exampleTable.empty)).toBeVisible();
  await page.getByRole('button', { name: zh.exampleTable.actions.discard, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: zh.exampleTable.discardDialog.ok, exact: true }).click();
  await expect(table.getByRole('row')).toHaveCount(14);

  await page.getByRole('button', { name: zh.exampleTable.actions.columnSettings, exact: true }).click();
  await page.getByRole('menuitemcheckbox', { name: zh.exampleTable.columns.stock, exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(table.getByRole('columnheader', { name: zh.exampleTable.columns.stock, exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('table', { name: zh.exampleTable.tableLabel }).getByRole('columnheader', { name: zh.exampleTable.columns.stock, exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
});
