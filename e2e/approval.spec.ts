import { test, expect, zh } from './fixtures';

const copy = zh.exampleApproval;

test('approval flow approves, rejects with a reason and resubmits', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/approval');
  const list = page.getByRole('navigation', { name: copy.listLabel });
  await expect(list.getByRole('button')).toHaveCount(4);
  const steps = page.getByRole('list', { name: copy.stepsLabel });
  await expect(steps.locator('[aria-current="step"]')).toContainText(copy.node.manager);

  await page.getByRole('button', { name: copy.decide.approve, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: copy.decide.approve, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(steps.locator('[aria-current="step"]')).toContainText(copy.node.finance);

  await page.getByRole('button', { name: copy.decide.reject, exact: true }).click();
  await dialog.getByRole('button', { name: copy.decide.reject, exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText(copy.validation.commentRequired);
  await expect(dialog.getByRole('textbox')).toBeFocused();
  await dialog.getByRole('textbox').fill('预算需要再压缩一些');
  await dialog.getByRole('button', { name: copy.decide.reject, exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(steps.locator('[data-state="rejected"]')).toContainText(copy.node.finance);
  await expect(page.getByRole('list', { name: copy.history })).toContainText('预算需要再压缩一些');

  await page.getByRole('button', { name: copy.decide.resubmit, exact: true }).click();
  await dialog.getByRole('textbox').fill('已按意见调整明细');
  await dialog.getByRole('button', { name: copy.decide.resubmit, exact: true }).click();
  await expect(steps.locator('[aria-current="step"]')).toContainText(copy.node.manager);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
});

test('viewers can read approvals but not decide', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/approval');
  await expect(page.getByText(copy.readOnly)).toBeVisible();
  await expect(page.locator('[data-slot="approval-actions"]')).toHaveCount(0);
});
