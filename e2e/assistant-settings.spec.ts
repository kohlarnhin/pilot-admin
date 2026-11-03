import { test, expect, zh, en, logout } from './fixtures';
import { grantAssistantReadOnly } from './assistant-settings.helpers';

const copy = zh.assistantSettings;
const tab = (title: string) => new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const label = (index: number) => copy.shortcuts.label.replace('{index}', String(index));
const prompt = (index: number) => copy.shortcuts.prompt.replace('{index}', String(index));
const move = (index: number, direction: string) => copy.shortcuts.moveLabel.replace('{index}', String(index)).replace('{direction}', direction);
const remove = (index: number) => copy.shortcuts.deleteLabel.replace('{index}', String(index));

test('deep link, independent drafts, dirty markers, reset and section-only save survive navigation', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('system/assistant?tab=prompts');
  const rail = page.getByRole('tablist', { name: copy.workspace.sectionLabel });
  await expect(rail.getByRole('tab', { name: tab(copy.shortcuts.title) })).toHaveAttribute('aria-selected', 'true');
  const firstLabel = page.getByRole('textbox', { name: label(1), exact: true });
  await expect(firstLabel).toBeEnabled();
  const originalLabel = await firstLabel.inputValue();
  await firstLabel.fill('Unsubmitted prompt draft');
  await expect(rail.getByRole('tab', { name: tab(copy.shortcuts.title) })).toContainText(copy.workspace.unsaved);

  await rail.getByRole('tab', { name: tab(copy.greeting.title) }).click();
  const name = page.getByRole('textbox', { name: copy.greeting.name, exact: true });
  await name.fill('Saved assistant identity');
  const greeting = page.getByRole('textbox', { name: copy.greeting.introduction, exact: true });
  await greeting.fill('A saved introduction from the identity section.');
  await expect(page.getByRole('heading', { name: 'Saved assistant identity', exact: true })).toBeVisible();
  await expect(rail.getByRole('tab', { name: tab(copy.greeting.title) })).toContainText(copy.workspace.unsaved);
  await rail.getByRole('tab', { name: tab(copy.shortcuts.title) }).click();
  await expect(firstLabel).toHaveValue('Unsubmitted prompt draft');
  await rail.getByRole('tab', { name: tab(copy.greeting.title) }).click();
  await expect(name).toHaveValue('Saved assistant identity');
  await page.getByRole('button', { name: copy.greeting.save, exact: true }).click();
  await expect(page.getByText(zh.common.toast.saved, { exact: true })).toBeVisible();
  await expect(rail.getByRole('tab', { name: tab(copy.greeting.title) })).not.toContainText(copy.workspace.unsaved);
  await expect(rail.getByRole('tab', { name: tab(copy.shortcuts.title) })).toContainText(copy.workspace.unsaved);
  await rail.getByRole('tab', { name: tab(copy.shortcuts.title) }).click();
  await expect(firstLabel).toHaveValue('Unsubmitted prompt draft');
  await page.getByRole('button', { name: copy.workspace.reset, exact: true }).click();
  await expect(firstLabel).toHaveValue(originalLabel);
  await expect(rail.getByRole('tab', { name: tab(copy.shortcuts.title) })).not.toContainText(copy.workspace.unsaved);

  await rail.getByRole('tab', { name: tab(copy.greeting.title) }).click();
  await page.reload();
  await expect(name).toHaveValue('Saved assistant identity');
  await expect(greeting).toHaveValue('A saved introduction from the identity section.');
  await name.fill('');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription(copy.greeting.nameRequired);
  await expect(page.getByRole('button', { name: copy.greeting.save, exact: true })).toBeDisabled();
  await page.getByRole('button', { name: copy.workspace.reset, exact: true }).click();
  await expect(name).toHaveValue('Saved assistant identity');
});

test('quick prompts enforce six rows, support reorder/remove, save and reload', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('system/assistant?tab=prompts');
  const add = page.getByRole('button', { name: copy.shortcuts.add, exact: true });
  await expect(page.getByRole('textbox', { name: label(1), exact: true })).toBeEnabled();
  const inputs = page.getByRole('textbox', { name: /^快捷提问 \d+ 文案$/ });
  const initial = await inputs.count();
  for (let index = initial + 1; index <= 6; index += 1) {
    await add.click();
    await expect(page.getByRole('button', { name: copy.shortcuts.save, exact: true })).toBeDisabled();
    await page.getByRole('textbox', { name: label(index), exact: true }).fill(`Prompt ${index}`);
    await page.getByRole('textbox', { name: prompt(index), exact: true }).fill(`Help with item ${index}`);
  }
  await expect(inputs).toHaveCount(6);
  await expect(add).toBeDisabled();
  const values = await inputs.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value));
  await page.getByRole('button', { name: move(6, copy.shortcuts.moveUp), exact: true }).click();
  await expect(page.getByRole('textbox', { name: label(5), exact: true })).toHaveValue(values[5]);
  await expect(page.getByRole('textbox', { name: label(6), exact: true })).toHaveValue(values[4]);
  await page.getByRole('button', { name: move(5, copy.shortcuts.moveDown), exact: true }).click();
  await expect(page.getByRole('textbox', { name: label(6), exact: true })).toHaveValue(values[5]);
  await expect(page.getByRole('button', { name: move(1, copy.shortcuts.moveUp), exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: move(6, copy.shortcuts.moveDown), exact: true })).toBeDisabled();
  await page.getByRole('button', { name: remove(6), exact: true }).click();
  await expect(inputs).toHaveCount(5);
  await expect(add).toBeEnabled();
  await page.getByRole('button', { name: copy.shortcuts.save, exact: true }).click();
  await expect(page.getByText(zh.common.toast.saved, { exact: true })).toBeVisible();
  await page.reload();
  await expect(inputs).toHaveCount(5);
  await expect(page.getByRole('textbox', { name: label(5), exact: true })).toHaveValue(values[4]);
});

for (const locale of ['zh-CN', 'en-US'] as const) {
  test(`command catalog lists all commands and both trigger dictionaries in ${locale}`, async ({ page, loginAs }) => {
    if (locale === 'en-US') {
      await page.goto('login');
      await page.getByRole('button', { name: zh.layout.switchLanguage }).click();
      await page.getByRole('menuitemradio', { name: 'English', exact: true }).click();
    }
    await loginAs('admin');
    await page.goto('system/assistant?tab=commands');
    const current = locale === 'zh-CN' ? zh : en;
    const list = page.getByRole('list', { name: current.assistantSettings.commands.title, exact: true });
    const commands = Object.keys(zh.agentCommands) as (keyof typeof zh.agentCommands)[];
    await expect(list.getByRole('listitem')).toHaveCount(commands.length);
    for (const id of commands) {
      const item = list.getByRole('listitem').filter({ has: page.getByRole('heading', { name: current.agentCommands[id].primary, exact: true }) });
      await item.scrollIntoViewIfNeeded();
      for (const phrase of [...Object.values(zh.agentCommands[id]), ...Object.values(en.agentCommands[id])]) {
        await expect(item.getByRole('code').filter({ hasText: new RegExp(`^${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })).toBeVisible();
      }
      await expect(item).toContainText('agent:use');
    }
    await expect(list.getByRole('listitem').filter({ hasText: current.agentCommands.createUser.primary })).toContainText('user:create');
    await expect(list.getByText(current.assistantSettings.commands.prefix, { exact: true })).toHaveCount(4);
    await expect(page.getByRole('tabpanel').locator('[data-slot="card-footer"]')).toHaveCount(0);
  });
}

test('read-only role granted through the Roles page sees disabled controls in each editable section', async ({ page, loginAs }) => {
  test.setTimeout(60_000);
  await loginAs('admin');
  await grantAssistantReadOnly(page, zh);
  await logout(page);
  await loginAs('operator');
  await page.goto('system/assistant?tab=identity');
  await expect(page.getByRole('textbox', { name: copy.greeting.name, exact: true })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: copy.greeting.introduction, exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: copy.greeting.save, exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: copy.workspace.reset, exact: true })).toBeDisabled();
  await expect(page.getByText(copy.workspace.readOnly, { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: tab(copy.shortcuts.title) }).click();
  await expect(page.getByRole('textbox', { name: label(1), exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: copy.shortcuts.add, exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: remove(1), exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: copy.shortcuts.save, exact: true })).toBeDisabled();
  await page.getByRole('tab', { name: tab(copy.models.title) }).click();
  await expect(page.getByRole('button', { name: zh.agentConfig.actions.create, exact: true })).toBeDisabled();
  await expect(page.getByRole('switch').first()).toBeDisabled();
  await expect(page.getByRole('button', { name: zh.agentConfig.actions.edit, exact: true }).first()).toBeDisabled();
  await page.getByRole('tab', { name: tab(copy.commands.title) }).click();
  await expect(page.getByRole('list', { name: copy.commands.title, exact: true }).getByRole('listitem')).toHaveCount(Object.keys(zh.agentCommands).length);
});

test('vertical rail supports roving focus, wraparound, Home/End and panel links', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('system/assistant?tab=unknown');
  const rail = page.getByRole('tablist', { name: copy.workspace.sectionLabel });
  const tabs = rail.getByRole('tab');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(0).focus();
  for (const [key, index] of [['ArrowDown', 1], ['End', 3], ['ArrowDown', 0], ['ArrowUp', 3], ['Home', 0]] as const) {
    await page.keyboard.press(key);
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await expect(rail.locator('[tabindex="0"]')).toHaveCount(1);
    const panel = page.getByRole('tabpanel');
    await expect(panel).toHaveAttribute('id', (await tabs.nth(index).getAttribute('aria-controls'))!);
    await expect(panel).toHaveAttribute('aria-labelledby', (await tabs.nth(index).getAttribute('id'))!);
  }
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
});

for (const role of ['operator', 'viewer'] as const) {
  test(`${role} without agent-config:view cannot load assistant settings`, async ({ page, loginAs }) => {
    await loginAs(role);
    await page.goto('system/assistant?tab=identity');
    await expect(page.getByRole('heading', { name: zh.errors.forbiddenTitle, exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: copy.greeting.name, exact: true })).toHaveCount(0);
    await expect(page.getByRole('tablist', { name: copy.workspace.sectionLabel })).toHaveCount(0);
  });
}
