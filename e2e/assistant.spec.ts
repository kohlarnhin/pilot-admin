import { test, expect, zh } from './fixtures';

for (const viewport of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
  test(`assistant shortcut, focus, help and Escape at ${viewport.width}x${viewport.height}`, async ({ page, loginAs }) => {
    await page.setViewportSize(viewport);
    await loginAs('admin');
    const trigger = page.getByRole('button', { name: zh.layout.assistant, exact: true });
    await trigger.focus();
    await page.keyboard.press('ControlOrMeta+j');
    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('width', '440px');
    await expect(panel).toHaveCSS('height', `${Math.min(760, viewport.height - 48)}px`);
    await expect.poll(async () => {
      const bounds = await panel.boundingBox();
      return bounds && Math.round(bounds.x + bounds.width);
    }).toBe(viewport.width - 24);
    await expect.poll(async () => {
      const bounds = await panel.boundingBox();
      return bounds && Math.round(bounds.y + bounds.height);
    }).toBe(viewport.height - 24);
    const composer = panel.getByRole('textbox', { name: zh.assistant.composer.messageLabel });
    await expect(composer).toBeFocused();
    await composer.fill('help');
    await composer.press('Enter');
    await expect(panel.getByRole('heading', { name: zh.agentTools.help.reply.split('\n')[0].replace('## ', ''), exact: true })).toBeVisible();
    await expect(composer).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test('account-audit stop completes the current step, resume finishes, and Agent shares the session', async ({ page, loginAs }) => {
  test.setTimeout(60_000);
  await loginAs('admin');
  await page.getByRole('button', { name: zh.layout.assistant, exact: true }).click();
  const panel = page.getByRole('dialog');
  const composer = panel.getByRole('textbox', { name: zh.assistant.composer.messageLabel });
  await composer.fill(zh.agentCommands.accountAudit.primary);
  await composer.press('Enter');
  const plan = page.getByRole('region', { name: zh.assistant.plan.region });
  await expect(plan.getByRole('status')).toHaveText(zh.assistant.plan.status.proposed);
  await expect(composer).toBeEnabled();
  await plan.getByRole('button', { name: zh.assistant.plan.confirm, exact: true }).click();
  const steps = plan.getByRole('listitem');
  await expect(steps.nth(0)).toContainText(zh.common.status.running);
  await plan.getByRole('button', { name: zh.assistant.plan.stop, exact: true }).click();
  await expect(steps.nth(0)).toContainText(zh.common.status.completed, { timeout: 15_000 });
  await expect(plan.getByRole('status')).toHaveText(zh.common.status.stopped);
  for (const index of [1, 2, 3]) await expect(steps.nth(index)).toContainText(zh.common.status.stopped);
  await plan.getByRole('button', { name: zh.assistant.plan.resume, exact: true }).click();
  await expect(plan.getByRole('status')).toHaveText(zh.common.status.completed, { timeout: 30_000 });
  for (const index of [0, 1, 2, 3]) await expect(steps.nth(index)).toContainText(zh.common.status.completed);
  const reportTitle = zh.agentTools.accountAudit.report.split('\n')[0].replace('## ', '');
  await expect(panel.getByRole('heading', { name: reportTitle, exact: true })).toBeVisible();
  await expect(composer).toBeEnabled();
  const messages = await panel.getByRole('article').allTextContents();
  expect(messages.length).toBeGreaterThan(1);
  await panel.getByRole('button', { name: zh.agentEntry.agent, exact: true }).click();
  await expect(page).toHaveURL(/\/agent$/);
  const workspace = page.getByRole('main', { name: zh.agentMode.workspaceLabel });
  await expect(workspace.getByRole('heading', { name: reportTitle, exact: true })).toBeVisible();
  await expect(workspace.getByRole('article')).toHaveText(messages);
  await expect(workspace.getByRole('region', { name: zh.assistant.plan.region }).getByRole('status')).toHaveText(zh.common.status.completed);
});
