import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page, TestInfo } from '@playwright/test';
import { test, expect, zh, en, signIn } from './fixtures';

const fixedRules = new Set([
  'color-contrast', 'label', 'aria-dialog-name', 'aria-progressbar-name',
  'scrollable-region-focusable', 'aria-required-children', 'aria-allowed-attr',
  'label-content-name-mismatch',
]);

async function settled(page: Page) {
  // Auth restoration can start another lazy chunk after the document loads.
  // Wait for that chain before checking fonts, mock requests and entrances.
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // Scan the rendered state after the existing entrances and mock requests settle.
  await page.waitForTimeout(700);
  await page.waitForFunction(() => document.getAnimations().every((animation) =>
    animation.playState !== 'running' || animation.effect?.getComputedTiming().iterations === Infinity));
}

for (const locale of ['zh-CN', 'en-US'] as const) {
  test(`axe production matrix (${locale})`, async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    await page.addInitScript((value) => localStorage.setItem('pilot-admin:locale:v1', value), locale);
    const copy = locale === 'zh-CN' ? zh : en;
    const reports: Array<{ state: string; violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'] }> = [];
    const scan = async (state: string) => {
      await settled(page);
      const result = await new AxeBuilder({ page }).analyze();
      reports.push({ state, violations: result.violations });
    };
    const dialogState = async (name: string, trigger: Locator, prepare?: (dialog: Locator) => Promise<void>) => {
      await trigger.click();
      const dialog = page.getByRole('dialog').last();
      await expect(dialog).toBeVisible();
      if (prepare) await prepare(dialog);
      await scan(name);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    };

    await page.goto('login');
    await scan('login');
    await page.getByRole('button', { name: copy.auth.login, exact: true }).click();
    await scan('login-error');
    await expect(page.locator('[data-slot="input-wrapper"]').filter({ has: page.locator('#login-name') })).toHaveCSS('border-color', 'rgb(100, 116, 139)');
    await signIn(page, 'admin');
    await expect(page.getByRole('dialog', { name: copy.agentEntry.title })).toBeVisible();
    await scan('entry-dialog');
    await page.getByRole('button', { name: copy.agentEntry.console, exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await scan('dashboard');
    await page.locator('button[data-slot="account-menu-trigger"]').click();
    await scan('account-menu-expanded');
    await page.keyboard.press('Escape');

    await page.goto('system/users');
    await scan('users');
    await dialogState('user-create', page.getByRole('button', { name: copy.button.userCreate, exact: true }), async (dialog) => {
      await dialog.getByRole('button', { name: copy.common.actions.create, exact: true }).click();
      const invalidInput = dialog.getByRole('textbox', { name: copy.users.fields.loginName, exact: true });
      await expect(invalidInput).toBeFocused();
      await expect(invalidInput).toHaveCSS('border-color', 'rgb(100, 116, 139)');
    });
    await dialogState('user-roles-select', page.getByRole('button', { name: copy.button.userCreate, exact: true }), async (dialog) => {
      const select = dialog.getByRole('combobox', { name: copy.users.fields.roles });
      await select.press('Enter');
      await scan('user-roles-popup');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('option', { selected: true })).toHaveCount(1);
      await page.keyboard.press('Escape');
      await expect(select).toBeFocused();
    });
    await dialogState('user-edit', page.getByRole('button', { name: copy.button.userUpdate, exact: true }).first());

    await page.goto('system/roles');
    await scan('roles');
    await dialogState('role-permissions', page.getByRole('button', { name: copy.button.rolePermissions, exact: true }).first());
    await page.goto('system/menus');
    await expect(page.getByText(copy.menus.empty.noActions, { exact: true })).toBeVisible();
    await scan('menus');
    await page.goto('system/audit-logs');
    await scan('audit');
    await dialogState('audit-detail', page.getByRole('button', { name: copy.audit.viewDetail, exact: true }).first());

    for (const [name, route] of [['settings', 'system/settings'], ['profile', 'profile']] as const) {
      await page.goto(route);
      await scan(name);
      const tabs = page.getByRole('tab');
      for (let index = 1; index < await tabs.count(); index += 1) {
        await tabs.nth(index).click();
        await scan(`${name}-tab-${index}`);
      }
    }
    await page.goto('system/assistant');
    await expect(page.locator('[data-row-key="model-demo"]')).toBeVisible();
    await scan('assistant-settings');
    await page.goto('examples/components');
    await scan('components');
    await dialogState('gallery-popover', page.getByRole('button', { name: copy.gallery.overlays.openPopover, exact: true }));

    await page.goto('notifications');
    await scan('notifications-empty-detail');
    await page.locator('[data-open-id]').first().click();
    await expect(page.locator('[data-slot="notification-title"]')).toBeVisible();
    await scan('notifications-detail');
    await dialogState('notifications-delete', page.getByRole('button', { name: copy.notifications.delete, exact: true }));
    await page.locator('[data-slot="notification-entry"]').click();
    await scan('notifications-popover');
    await page.keyboard.press('Escape');
    await page.goto('examples/crud');
    await scan('crud');
    await dialogState('crud-create', page.getByRole('button', { name: copy.button.exampleCreate, exact: true }), async (dialog) => {
      await dialog.getByRole('button', { name: copy.common.actions.create, exact: true }).click();
    });
    await dialogState('crud-edit', page.getByRole('button', { name: copy.button.exampleUpdate, exact: true }).first());
    await dialogState('crud-import', page.getByRole('button', { name: copy.exampleProjects.import.title, exact: true }));
    await dialogState('crud-import-preview', page.getByRole('button', { name: copy.exampleProjects.import.title, exact: true }), async (dialog) => {
      await dialog.locator('input[type=file]').setInputFiles({ name: 'a11y.csv', mimeType: 'text/csv', buffer: Buffer.from('name,code,owner,status,description\nAudit preview,A11Y-PREVIEW,Admin,active,Example\n') });
      await expect(dialog.getByRole('cell', { name: 'A11Y-PREVIEW', exact: true })).toBeVisible();
    });
    await page.locator('main a[href^="/examples/crud/"]').first().click();
    await scan('crud-detail');
    await page.goto('examples/forms/wizard');
    await scan('form-wizard-basic');
    await page.getByLabel(copy.exampleProjects.fields.name, { exact: true }).fill('Accessible project');
    await page.getByLabel(copy.exampleProjects.fields.code, { exact: true }).fill('AXE-WIZARD');
    await expect(page.getByText(copy.exampleForms.wizard.available, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: copy.exampleForms.wizard.next, exact: true }).click();
    await scan('form-wizard-owner');
    await page.getByLabel(copy.exampleProjects.fields.owner, { exact: true }).fill('Alex Morgan');
    await page.getByRole('button', { name: copy.exampleForms.wizard.next, exact: true }).click();
    await scan('form-wizard-review');
    await page.getByRole('button', { name: copy.exampleForms.wizard.submit, exact: true }).click();
    await expect(page.getByRole('heading', { name: copy.exampleForms.wizard.success, exact: true })).toBeVisible();
    await scan('form-wizard-result');
    await page.goto('examples/forms/sections');
    await scan('form-sections');
    await page.getByLabel(copy.exampleForms.fields.organizationName, { exact: true }).fill('');
    await page.getByRole('button', { name: copy.exampleForms.sections.save, exact: true }).click();
    await scan('form-sections-errors');
    // Restore defaults before using a full-document navigation in the matrix.
    await page.getByRole('button', { name: copy.exampleForms.sections.reset, exact: true }).click();
    await page.getByRole('button', { name: copy.common.actions.confirmReset, exact: true }).click();
    await page.goto('examples/results');
    await scan('results');
    await page.getByRole('button', { name: copy.exampleResults.retry, exact: true }).first().click();
    await expect(page.getByRole('heading', { name: copy.exampleResults.connected, exact: true })).toBeVisible();
    await scan('results-reconnected');
    for (const route of ['403', '404', 'agent']) {
      await page.goto(route);
      await scan(route);
      if (route === 'agent') {
        const session = page.getByRole('button').filter({ has: page.locator('time') }).first();
        await session.click();
        await expect(session).toHaveAttribute('aria-current', 'true');
        await scan('agent-active-session');
      }
    }
    await page.goto('dashboard');
    await settled(page);
    await page.keyboard.press('ControlOrMeta+j');
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan('assistant-panel');
    await page.keyboard.press('Escape');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await scan('search');

    await testInfo.attach(`axe-${locale}`, { body: JSON.stringify(reports, null, 2), contentType: 'application/json' });
    const failures = reports.flatMap(({ state, violations }) => violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical' || fixedRules.has(violation.id))
      .map((violation) => ({ state, rule: violation.id, impact: violation.impact, nodes: violation.nodes })));
    expect(failures, 'No serious/critical violations or regressions in the repaired rules').toEqual([]);
  });
}

async function closeAndReturn(page: Page, trigger: Locator, closeBy: 'Escape' | 'button') {
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog').last();
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press('Tab');
    await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  // Leave any focus-triggered tooltip before testing dismissal of the containing modal.
  const closeButton = dialog.getByRole('button', { name: zh.common.actions.close, exact: true }).first();
  await closeButton.focus();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  if (closeBy === 'Escape') await page.keyboard.press('Escape');
  else await dialog.getByRole('button', { name: zh.common.actions.close, exact: true }).first().click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
}

for (const [width, height] of [[1440, 900], [1280, 720]]) {
  test(`keyboard focus, semantics and scrolling (${width}x${height})`, async ({ page, loginAs }, testInfo: TestInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height });
    await loginAs('admin');
    await page.goto('dashboard');
    const skip = page.getByRole('link', { name: zh.layout.skipToContent, exact: true });
    await expect(skip).toBeAttached();
    await settled(page);
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    const group = page.getByRole('button', { name: zh.menu.system, exact: true });
    await group.focus();
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await group.press('Enter');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await group.press('Space');
    await expect(group).toHaveAttribute('aria-expanded', 'true');

    for (const closeBy of ['Escape', 'button'] as const) {
      await page.goto('system/users');
      await closeAndReturn(page, page.getByRole('button', { name: zh.button.userCreate, exact: true }), closeBy);
      await closeAndReturn(page, page.getByRole('button', { name: zh.button.userUpdate, exact: true }).first(), closeBy);
      await page.goto('system/roles');
      await closeAndReturn(page, page.getByRole('button', { name: zh.button.roleCreate, exact: true }), closeBy);
      await closeAndReturn(page, page.getByRole('button', { name: zh.button.roleUpdate, exact: true }).first(), closeBy);
      await closeAndReturn(page, page.getByRole('button', { name: zh.button.rolePermissions, exact: true }).first(), closeBy);
      await page.goto('examples/crud');
      await closeAndReturn(page, page.getByRole('button', { name: zh.button.exampleCreate, exact: true }), closeBy);
      await closeAndReturn(page, page.getByRole('button', { name: zh.button.exampleUpdate, exact: true }).first(), closeBy);
      await closeAndReturn(page, page.getByRole('button', { name: zh.exampleProjects.import.title, exact: true }), closeBy);
    }

    await page.goto('examples/components');
    const tab = page.getByRole('tab').first();
    await tab.focus();
    await tab.press('ArrowRight');
    const selected = page.getByRole('tab', { selected: true });
    await expect(selected).toBeFocused();
    await expect(selected).toHaveCSS('--tw-ring-color', 'rgb(100 116 139 / 1)');
    await expect(selected).toHaveCSS('border-bottom-color', 'rgb(253, 169, 45)');
    await page.screenshot({ path: testInfo.outputPath('gallery-tab-keyboard.png') });

    await page.goto('profile?tab=permissions');
    const permissions = page.getByRole('region', { name: zh.profile.sections.permissions.title, exact: true });
    await expect(permissions.locator('li code').first()).toBeVisible();
    await permissions.focus();
    await permissions.press('PageDown');
    await expect.poll(() => permissions.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await permissions.press('End');
    await expect.poll(() => permissions.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);

    await page.getByRole('button', { name: zh.layout.collapseMenu, exact: true }).click();
    const account = page.getByRole('button', { name: new RegExp(`^${zh.layout.accountMenu}:`) });
    await expect(account).toHaveAttribute('aria-haspopup', 'menu');
    await expect(account).toHaveAttribute('aria-expanded', 'false');
    await account.press('Enter');
    await expect(account).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(account).toBeFocused();
    // Menu items unmount when opening a modal; return to the persistent account button.
    for (const name of [zh.auth.changePassword, zh.agentEntry.preferences]) {
      for (const closeBy of ['Escape', 'button']) {
        await account.press('Enter');
        await page.getByRole('menuitem', { name, exact: true }).press('Enter');
        const dialog = page.getByRole('dialog', { name, exact: true });
        await expect(dialog).toBeVisible();
        if (closeBy === 'Escape') await page.keyboard.press('Escape');
        else await dialog.getByRole('button', { name: zh.common.actions.close, exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(account).toBeFocused();
      }
    }
    await page.goto('agent');
    await expect(page.getByRole('heading', { name: zh.agentMode.title, exact: true })).toBeVisible();
    await settled(page);
    await expect(page.locator('a[href], button, input, textarea, [tabindex="0"]').first()).toHaveAttribute('href', '#agent-main');
    // Agent retains its existing composer autofocus; reverse-Tab reaches the first tab stop.
    for (let index = 0; index < 40 && !await skip.evaluate((element) => element === document.activeElement); index += 1) {
      await page.keyboard.press('Shift+Tab');
    }
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }))).toEqual({ x: 0, y: 0 });
  });
}

test('virtual row modal returns to a stable search input when its opener unmounts', async ({ page, loginAs }) => {
  await loginAs('admin');
  for (const [route, action, placeholder, total] of [
    ['system/users', zh.button.userUpdate, zh.users.searchPlaceholder, '151'],
    ['examples/crud', zh.button.exampleUpdate, zh.exampleProjects.filters.search, '81'],
  ] as const) {
    await page.goto(route);
    const trigger = page.getByRole('button', { name: action, exact: true }).first();
    const table = page.getByRole('table', { includeHidden: true });
    await expect(table).toHaveAttribute('aria-rowcount', total);
    await expect(table.getByRole('row', { includeHidden: true }).first()).toHaveAttribute('aria-rowindex', '1');
    await trigger.focus();
    const opener = await trigger.elementHandle();
    await trigger.press('Enter');
    // Scroll the actual virtual list while the modal is open; no synthetic DOM removal.
    for (let index = 0; index < 5; index += 1) {
      await table.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      await page.waitForTimeout(400);
    }
    await expect.poll(() => opener!.evaluate((element) => element.isConnected)).toBe(false);
    await expect.poll(() => table.locator('[data-row-key]').first().getAttribute('aria-rowindex').then(Number)).toBeGreaterThan(2);
    await expect(table.locator('[role="status"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(placeholder, { exact: true })).toBeFocused();
  }
});

for (const locale of ['zh-CN', 'en-US'] as const) {
  test(`axe directory and assistant settings (${locale})`, async ({ page, loginAs }, testInfo) => {
    test.setTimeout(180_000);
    await page.addInitScript((value) => localStorage.setItem('pilot-admin:locale:v1', value), locale);
    await loginAs('admin');
    const copy = locale === 'zh-CN' ? zh : en;
    const reports: Array<{ state: string; violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'] }> = [];
    const scan = async (state: string) => {
      await settled(page);
      const result = await new AxeBuilder({ page }).analyze();
      reports.push({ state, violations: result.violations });
    };

    await page.goto('examples/directory');
    const tree = page.getByRole('tree', { name: copy.directory.treeLabel });
    const all = tree.getByRole('treeitem', { name: copy.directory.allDocuments, exact: true });
    await expect(tree.getByRole('treeitem')).toHaveCount(19);
    const table = page.getByRole('table');
    await expect(table.locator('[data-row-key]').first()).toBeVisible();
    await expect(table).toHaveAttribute('aria-rowcount', '301');
    await all.focus();
    await all.press('ArrowRight');
    const parent = tree.locator('[data-folder-id="folder-01"]');
    await expect(parent).toBeFocused();
    await expect(parent).toHaveCSS('--tw-ring-color', 'rgb(100 116 139 / 1)');
    await expect(parent).toHaveAttribute('aria-level', '2');
    await scan('directory-focused');
    const nested = tree.locator('[data-folder-id="folder-03"]');
    await parent.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(nested).toBeFocused();
    await nested.press('Enter');
    await expect(nested).toHaveAttribute('aria-selected', 'true');
    await expect(nested).toHaveAttribute('aria-level', '4');
    await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
    await expect(table).toHaveAttribute('aria-rowcount', '141');
    await expect(table.locator('[data-row-key="document-001"]')).toBeVisible();
    await scan('directory-nested');
    await table.focus();
    await table.press('PageDown');
    await expect.poll(() => table.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(async () => {
      await table.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      await expect(table.locator('[data-row-key="document-140"]')).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 20_000 });
    expect(await table.locator('[data-row-key]').count()).toBeLessThan(50);
    await expect(table.locator('[data-row-key="document-140"]')).toHaveAttribute('aria-rowindex', '141');
    await scan('directory-appended');
    await tree.locator('[data-folder-id="folder-12"]').click();
    await expect(page.getByText(copy.directory.empty.folder, { exact: true })).toBeVisible();
    await expect(table.locator('[data-row-key]')).toHaveCount(0);
    await expect(table).toHaveAttribute('aria-rowcount', '1');
    await scan('directory-empty');

    await page.goto('system/assistant?tab=models');
    const rail = page.getByRole('tablist', { name: copy.assistantSettings.workspace.sectionLabel });
    const panel = page.getByRole('tabpanel');
    await expect(panel.getByRole('table').locator('[data-row-key]').first()).toBeVisible();
    await scan('assistant-models');
    const create = panel.getByRole('button', { name: copy.agentConfig.actions.create, exact: true });
    await create.focus();
    await create.press('Enter');
    const dialog = page.getByRole('dialog', { name: copy.agentConfig.form.createTitle, exact: true });
    await expect(dialog).toBeVisible();
    await scan('assistant-model-create');
    await dialog.getByRole('button', { name: copy.common.actions.create, exact: true }).click();
    await expect(dialog.getByRole('combobox', { name: copy.agentConfig.fields.modelCode, exact: true })).toHaveAttribute('aria-invalid', 'true');
    await scan('assistant-model-invalid');
    const modelCode = dialog.getByRole('combobox', { name: copy.agentConfig.fields.modelCode, exact: true });
    await modelCode.focus();
    await expect(dialog.getByRole('listbox')).toBeVisible();
    await scan('assistant-model-picker');
    await modelCode.press('ArrowDown');
    await modelCode.press('Enter');
    await expect(modelCode).toHaveValue('pilot-demo');
    await dialog.getByRole('button', { name: copy.common.actions.close, exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(create).toBeFocused();

    await page.goto('system/assistant?tab=identity');
    const name = page.getByRole('textbox', { name: copy.assistantSettings.greeting.name, exact: true });
    await expect(name).toBeEnabled();
    await scan('assistant-identity');
    const draftName = locale === 'zh-CN' ? '未保存的助手' : 'Unsaved assistant';
    await name.fill(draftName);
    await expect(rail.locator('#assistant-tab-identity')).toContainText(copy.assistantSettings.workspace.unsaved);
    await scan('assistant-identity-dirty');
    await name.fill('');
    await page.getByRole('textbox', { name: copy.assistantSettings.greeting.introduction, exact: true }).fill('');
    await expect(name).toHaveAccessibleDescription(copy.assistantSettings.greeting.nameRequired);
    await scan('assistant-identity-invalid');

    await page.goto('system/assistant?tab=prompts');
    const firstLabel = page.getByRole('textbox', { name: copy.assistantSettings.shortcuts.label.replace('{index}', '1'), exact: true });
    await expect(firstLabel).toBeEnabled();
    await scan('assistant-prompts');
    await firstLabel.fill(locale === 'zh-CN' ? '未保存的提问' : 'Unsaved prompt');
    await expect(rail.locator('#assistant-tab-prompts')).toContainText(copy.assistantSettings.workspace.unsaved);
    await scan('assistant-prompts-dirty');
    await page.getByRole('button', { name: copy.assistantSettings.shortcuts.add, exact: true }).click();
    await expect(panel.getByRole('alert')).toHaveCount(2);
    await scan('assistant-prompts-invalid');

    await page.goto('system/assistant?tab=commands');
    const commands = page.getByRole('region', { name: copy.assistantSettings.commands.title, exact: true });
    await expect(commands.getByRole('listitem').first()).toBeVisible();
    await scan('assistant-commands');
    await commands.focus();
    await commands.press('End');
    await expect.poll(() => commands.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
    await scan('assistant-commands-bottom');

    await testInfo.attach(`axe-new-pages-${locale}`, { body: JSON.stringify(reports, null, 2), contentType: 'application/json' });
    const failures = reports.flatMap(({ state, violations }) => violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical' || fixedRules.has(violation.id))
      .map((violation) => ({ state, rule: violation.id, impact: violation.impact, nodes: violation.nodes })));
    expect(failures, 'New pages retain tree semantics and pass the repaired accessibility rules').toEqual([]);
  });
}

for (const [width, height] of [[1440, 900], [1280, 720]]) {
  test(`directory and assistant keyboard scrolling (${width}x${height})`, async ({ page, loginAs }, testInfo) => {
    await page.setViewportSize({ width, height });
    await loginAs('admin');
    await page.goto('examples/directory?folder=folder-03');
    const tree = page.getByRole('tree', { name: zh.directory.treeLabel });
    const nested = tree.locator('[data-folder-id="folder-03"]');
    await expect(nested).toHaveAttribute('aria-selected', 'true');
    await nested.focus();
    await nested.press('ArrowLeft');
    const parent = tree.locator('[data-folder-id="folder-02"]');
    await expect(parent).toBeFocused();
    await parent.press('ArrowLeft');
    await expect(parent).toHaveAttribute('aria-expanded', 'false');
    await parent.press('ArrowRight');
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await parent.press('ArrowRight');
    await expect(nested).toBeFocused();
    await nested.press('Space');
    await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);
    const table = page.getByRole('table');
    await expect(table.locator('[data-row-key]').first()).toBeVisible();
    await table.focus();
    await table.press('PageDown');
    await expect.poll(() => table.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath('directory-table-keyboard.png') });
    await page.goto('system/assistant?tab=commands');
    const commands = page.getByRole('region', { name: zh.assistantSettings.commands.title, exact: true });
    await expect(commands.getByRole('listitem').first()).toBeVisible();
    await settled(page);
    await commands.focus();
    await commands.press('PageDown');
    await expect.poll(() => commands.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    // Chromium can ignore End during its native PageDown animation. Observe
    // the completed scroll before testing the next independent key action.
    await commands.evaluate(async (element) => {
      let previous = element.scrollTop;
      let stableFrames = 0;
      while (stableFrames < 3) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const next = element.scrollTop;
        stableFrames = next === previous ? stableFrames + 1 : 0;
        previous = next;
      }
    });
    await commands.press('End');
    await expect.poll(() => commands.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
    await page.screenshot({ path: testInfo.outputPath('assistant-commands-keyboard.png') });
    await page.goto('system/assistant?tab=identity');
    const name = page.getByRole('textbox', { name: zh.assistantSettings.greeting.name, exact: true });
    await expect(name).toBeEnabled();
    await name.fill('键盘检查草稿');
    await expect(page.getByRole('status').filter({ hasText: zh.assistantSettings.workspace.unsaved })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('assistant-identity-dirty.png') });
    expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }))).toEqual({ x: 0, y: 0 });
  });
}
