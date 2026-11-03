import type { Page } from '@playwright/test';
import { test, expect, zh, en, logout } from './fixtures';

async function switchLanguage(page: Page, language: 'English' | '简体中文') {
  await page.locator('[data-slot="account-menu-trigger"]').click();
  await page.getByRole('menuitem', { name: new RegExp(`${zh.layout.language}|${en.layout.language}`) }).hover();
  await page.getByRole('menuitemradio', { name: language, exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', language === 'English' ? 'en-US' : 'zh-CN');
}

for (const route of ['system/users', 'examples/crud', 'system/audit-logs'] as const) {
  test(`memoized ${route} rows follow locale and live permission changes`, async ({ page, loginAs }) => {
    test.setTimeout(60_000);
    await loginAs('admin');
    // Prepare a real read-only role through the UI. The assistant can apply it
    // to the current user without navigating away from the mounted list.
    await page.goto('system/roles');
    await page.getByRole('button', { name: zh.button.roleCreate, exact: true }).click();
    const add = page.getByRole('dialog', { name: zh.button.roleCreate, exact: true });
    await add.getByRole('textbox', { name: zh.roles.fields.name, exact: true }).fill('Perf reader');
    await add.getByRole('textbox', { name: new RegExp(`^${zh.roles.fields.code}`) }).fill('PERF_READER');
    await add.getByRole('button', { name: zh.common.actions.create, exact: true }).click();
    await expect(add).toBeHidden();
    await page.getByRole('row').filter({ hasText: 'PERF_READER' }).getByRole('button', { name: zh.button.rolePermissions, exact: true }).click();
    const permissions = page.getByRole('dialog', { name: zh.roles.permissionDialog.title, exact: true });
    for (const name of [zh.menu.users, zh.menu.crudExample, zh.menu.auditLogs, zh.button.agentUse]) {
      await permissions.getByRole('checkbox', { name, exact: true }).check();
    }
    await permissions.getByRole('button', { name: zh.roles.permissionDialog.save, exact: true }).click();
    await expect(permissions).toBeHidden();
    await page.goto(route);
    const table = page.getByRole('table');
    await expect(table.locator('[data-row-key]').first()).toBeVisible();
    const rowAction = route === 'system/users' ? 'userUpdate' : route === 'examples/crud' ? 'exampleUpdate' : null;
    await switchLanguage(page, 'English');
    await expect(table.getByRole('columnheader', { name: en.common.columns.actions, exact: true })).toBeVisible();
    await expect(table.getByRole('button', { name: rowAction ? en.button[rowAction] : en.audit.viewDetail, exact: true }).first()).toBeVisible();
    if (route === 'examples/crud') await expect(table.locator('[data-row-key]').first()).toContainText(/Active|Paused|Archived/);
    if (route === 'system/audit-logs') await expect(table.locator('[data-row-key]').first()).toContainText(/Success|Failure/);
    await switchLanguage(page, '简体中文');
    await expect(table.getByRole('button', { name: rowAction ? zh.button[rowAction] : zh.audit.viewDetail, exact: true }).first()).toBeVisible();
    // Retain an actual DOM reference: a route reload could mask a stale memo.
    await table.evaluate((element) => { (window as unknown as { perfTable: Element }).perfTable = element; });
    await page.getByRole('button', { name: zh.layout.assistant, exact: true }).click();
    const panel = page.locator('#ai-assistant-panel');
    const composer = panel.getByRole('textbox', { name: zh.assistant.composer.messageLabel });
    await composer.fill(zh.agentCommands.assignRoles.primary);
    await composer.press('Enter');
    await panel.getByRole('button', { name: zh.assistant.pageAction.openPanel, exact: true }).click();
    const assign = page.getByRole('dialog', { name: zh.agentCommands.assignRoles.primary, exact: true });
    await assign.getByRole('combobox', { name: zh.assistant.assignRoles.targetRole, exact: true }).click();
    await page.getByRole('option', { name: 'Perf reader', exact: true }).click();
    await assign.getByRole('textbox', { name: zh.assistant.assignRoles.searchLabel }).fill('admin');
    await expect(assign.getByRole('checkbox')).toHaveCount(1);
    await assign.getByRole('checkbox').first().check();
    await assign.getByRole('button', { name: zh.assistant.assignRoles.save, exact: true }).click();
    await expect(assign).toBeHidden();
    await panel.getByRole('button', { name: zh.assistant.header.close, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${route}$`));
    expect(await table.evaluate((element) => (window as unknown as { perfTable: Element }).perfTable === element)).toBe(true);
    if (route === 'system/users') {
      await expect(table.getByRole('button', { name: zh.button.userUpdate, exact: true })).toHaveCount(0);
      await expect(table.getByRole('button', { name: zh.button.userDelete, exact: true })).toHaveCount(0);
      await expect(table.getByRole('switch').first()).toBeDisabled();
    } else if (route === 'examples/crud') {
      await expect(table.getByRole('columnheader', { name: zh.common.columns.actions, exact: true })).toHaveCount(0);
      await expect(table.getByRole('checkbox')).toHaveCount(0);
    } else {
      await expect(page.getByRole('button', { name: zh.button.auditLogExport, exact: true })).toHaveCount(0);
      await table.getByRole('button', { name: zh.audit.viewDetail, exact: true }).first().click();
      await expect(page.getByRole('dialog', { name: zh.audit.detail, exact: true })).toBeVisible();
    }
  });
}

test('assistant stream stop, host switching, shared draft and account isolation', async ({ page, loginAs }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await loginAs('admin');
  await page.getByRole('button', { name: zh.layout.assistant, exact: true }).focus();
  await page.keyboard.press('Control+j');
  const panel = page.locator('#ai-assistant-panel');
  const composer = panel.getByRole('textbox', { name: zh.assistant.composer.messageLabel });
  // Resolve the cold host first; pausing the browser clock must not also hold
  // React's Suspense reveal timer while checking a live stream's lifetime.
  await expect(composer).toBeEnabled();
  await panel.getByRole('button', { name: zh.agentEntry.agent, exact: true }).click();
  const workspace = page.getByRole('main', { name: zh.agentMode.workspaceLabel });
  const agentComposer = workspace.getByRole('textbox', { name: zh.assistant.composer.messageLabel });
  await expect(agentComposer).toBeEnabled();
  await page.getByRole('link', { name: zh.agentMode.console, exact: true }).click();
  await page.getByRole('button', { name: zh.layout.assistant, exact: true }).click();
  await expect(composer).toBeEnabled();
  // Hold the real mock engine between deltas so a fast reply cannot finish
  // while Playwright moves between hosts; no service or data is stubbed.
  await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 60_000);
  await composer.fill('help');
  await composer.press('Enter');
  for (let step = 0; step < 20; step += 1) {
    await page.clock.runFor(100);
    if (await panel.getByRole('article').count() === 2) break;
  }
  await expect(panel.getByRole('article')).toHaveCount(2);
  await expect(panel.getByRole('button', { name: zh.assistant.composer.stop, exact: true })).toBeVisible();
  // Switch hosts during the live stream; the receiving host must retain Stop.
  await panel.getByRole('button', { name: zh.agentEntry.agent, exact: true }).click();
  await expect(page).toHaveURL(/\/agent$/);
  await page.clock.runFor(16);
  await workspace.getByRole('button', { name: zh.assistant.composer.stop, exact: true }).click();
  await expect(workspace.getByText(zh.assistant.messages.stopped, { exact: true })).toBeVisible();
  await page.clock.resume();
  await expect(agentComposer).toBeEnabled();
  const messages = await workspace.getByRole('article').allTextContents();
  await agentComposer.fill('draft edited in Agent');
  await page.getByRole('link', { name: zh.agentMode.console, exact: true }).click();
  await page.getByRole('button', { name: zh.layout.assistant, exact: true }).focus();
  await page.keyboard.press('Meta+j');
  await expect(composer).toHaveValue('draft edited in Agent');
  await expect(panel.getByRole('article')).toHaveText(messages);
  await composer.fill('admin private draft');
  await panel.getByRole('button', { name: zh.agentEntry.agent, exact: true }).click();
  await expect(agentComposer).toHaveValue('admin private draft');
  await page.getByRole('link', { name: zh.agentMode.console, exact: true }).click();
  await page.getByRole('button', { name: zh.layout.assistant, exact: true }).click();
  await expect(composer).toHaveValue('admin private draft');
  await panel.getByRole('button', { name: zh.assistant.header.close, exact: true }).click();
  await logout(page);
  await loginAs('operator');
  await page.getByRole('button', { name: zh.layout.assistant, exact: true }).click();
  await expect(composer).toHaveValue('');
  await expect(panel.getByRole('article')).toHaveCount(0);
  await composer.fill('operator private draft');
  await panel.getByRole('button', { name: zh.assistant.header.close, exact: true }).click();
  await logout(page);
  await loginAs('admin');
  await page.getByRole('button', { name: zh.layout.assistant, exact: true }).click();
  await expect(composer).toHaveValue('admin private draft');
  await expect(panel).not.toContainText('operator private draft');
});

test('Latin font preloads and live reduced-motion changes on login', async ({ page, context }, testInfo) => {
  const scripts: string[] = [];
  page.on('request', (request) => { if (request.resourceType() === 'script') scripts.push(request.url()); });
  await page.addInitScript(() => {
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    (window as unknown as { particleFrames: number }).particleFrames = 0;
    CanvasRenderingContext2D.prototype.clearRect = function (...args: Parameters<typeof clear>) {
      (window as unknown as { particleFrames: number }).particleFrames++;
      return clear.apply(this, args);
    };
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await page.goto('login');
  const preloads = page.locator('link[rel="preload"][as="font"]');
  await expect(preloads).toHaveCount(2);
  for (const font of await preloads.evaluateAll((links) => links.map((element) => ({ href: (element as HTMLLinkElement).href, cross: element.getAttribute('crossorigin'), type: element.getAttribute('type') })))) {
    expect(font.href).toMatch(/\/(open-sans-latin-wght|jetbrains-mono-latin-400)-normal-[^/]+\.woff2$/);
    expect(font.cross).toBe('');
    expect(font.type).toBe('font/woff2');
  }
  const frames = () => page.evaluate(() => (window as unknown as { particleFrames: number }).particleFrames);
  await expect.poll(frames).toBeGreaterThan(3);
  const running = await frames();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await page.waitForTimeout(300);
  const stopped = await frames();
  await page.waitForTimeout(300);
  expect(await frames()).toBe(stopped);
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await expect.poll(frames).toBeGreaterThan(stopped + 3);
  expect(scripts.filter((url) => /Assistant(Runtime|UI|LoadState)-|assistant(Resources|Context|Utils)-|IdentitySection-|PromptsSection-|CommandsSection-|AgentConfigPanel-|vendor-virtual-/.test(url))).toEqual([]);
  await testInfo.attach('particle-motion-frames', { body: JSON.stringify({ running, reduced: stopped, resumed: await frames(), reducedDelta: 0 }), contentType: 'application/json' });
  await testInfo.attach('login-script-requests', { body: JSON.stringify(scripts, null, 2), contentType: 'application/json' });
});
