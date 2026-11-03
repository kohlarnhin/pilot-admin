import { readFile } from 'node:fs/promises';
import { test, expect, zh } from './fixtures';

test('operator imports mixed CSV and downloads skipped and failed rows with machine headers', async ({ page, loginAs }) => {
  await loginAs('operator');
  await page.goto('examples/crud');
  await page.getByRole('button', { name: zh.exampleProjects.import.title, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: zh.exampleProjects.import.title, exact: true });
  const text = 'name,code,owner,status,description\r\nImported one,IMPORT-ONE,Alice,active,First\r\nInvalid,invalid,Alice,active,Bad\r\nDuplicate,IMPORT-ONE,Alice,active,Duplicate\r\nExisting,PRJ-001,Alice,active,Existing\r\nImported two,IMPORT-TWO,Bob,paused,Second\r\n';
  await dialog.locator('input[type=file]').setInputFiles({ name: 'mixed.csv', mimeType: 'text/csv', buffer: Buffer.from(text) });
  await expect(dialog.getByText('共 5 · 有效 3 · 无效 2', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: zh.exampleProjects.import.start, exact: true }).click();
  await expect(dialog.getByText(zh.exampleProjects.import.states.complete, { exact: true })).toBeVisible();
  await expect(dialog.getByText('已处理 5/5 · 创建 2 · 跳过 2 · 失败 1', { exact: true })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await dialog.getByRole('button', { name: zh.exampleProjects.import.downloadFailed, exact: true }).click();
  const download = await downloadEvent;
  const bytes = await readFile((await download.path())!);
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const csv = bytes.toString('utf8');
  expect(csv.split('\r\n')[0]).toBe('\uFEFF"name","code","owner","status","description","reason"');
  expect(csv).toContain('"active"');
  expect(csv).toContain(zh.exampleProjects.import.errors.duplicate);
  expect(csv).toContain(zh.serverErrors.example.codeExists);
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(4);
  await dialog.getByRole('button', { name: zh.exampleProjects.import.done, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('共 82 个项目', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Imported one', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Imported two', exact: true })).toBeVisible();
});

test('native GB18030 decoding and explicit UTF-8 override', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/crud');
  await page.getByRole('button', { name: zh.exampleProjects.import.title, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: zh.exampleProjects.import.title, exact: true });
  const bytes = Buffer.concat([Buffer.from('name,code,owner,status\n'), Buffer.from([0xb2, 0xe2, 0xca, 0xd4]), Buffer.from(',GB-TEST,Alice,active\n')]);
  await dialog.locator('input[type=file]').setInputFiles({ name: 'gb18030.csv', mimeType: 'text/csv', buffer: bytes });
  const encoding = dialog.getByRole('combobox', { name: zh.exampleProjects.import.encoding, exact: true });
  await expect(encoding).toHaveText('GB18030');
  await expect(dialog.getByRole('cell', { name: '测试', exact: true })).toBeVisible();
  await expect(dialog.getByText(zh.exampleProjects.import.detectedFallback, { exact: true })).toBeVisible();
  await encoding.click();
  await page.getByRole('option', { name: 'UTF-8', exact: true }).click();
  await expect(dialog.getByText(zh.exampleProjects.import.errors.encoding, { exact: true })).toBeVisible();
  await expect(dialog.getByText(zh.exampleProjects.import.detectedFallback, { exact: true })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: zh.exampleProjects.import.start, exact: true })).toBeDisabled();
  await encoding.click();
  await page.getByRole('option', { name: 'GB18030', exact: true }).click();
  await expect(dialog.getByRole('cell', { name: '测试', exact: true })).toBeVisible();
});

test('viewer has no import entry', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/crud');
  await expect(page.getByRole('heading', { name: zh.menu.crudExample, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: zh.exampleProjects.import.title, exact: true })).toHaveCount(0);
});

test('import dialog traps keyboard focus and restores its trigger', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/crud');
  const trigger = page.getByRole('button', { name: zh.exampleProjects.import.title, exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: zh.exampleProjects.import.title, exact: true });
  await expect(dialog).toBeFocused();
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
