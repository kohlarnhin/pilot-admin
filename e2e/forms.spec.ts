import type { Page } from '@playwright/test';
import { test, expect, zh } from './fixtures';

const next = (page: Page) => page.getByRole('button', { name: zh.exampleForms.wizard.next, exact: true });
async function fillBasics(page: Page, code: string) {
  await page.getByLabel(zh.exampleProjects.fields.name, { exact: true }).fill('Example wizard project');
  await page.getByLabel(zh.exampleProjects.fields.code, { exact: true }).fill(code);
  await expect(page.getByText(zh.exampleForms.wizard.available, { exact: true })).toBeVisible();
}
async function review(page: Page, code: string) {
  await fillBasics(page, code);
  await next(page).click();
  await page.getByLabel(zh.exampleProjects.fields.owner, { exact: true }).fill('Alex Morgan');
  await next(page).click();
}

test('wizard keyboard path validates steps, preserves values, reviews and creates exactly once', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/forms/wizard');
  await expect(next(page)).toBeDisabled();
  const steps = page.getByRole('navigation', { name: zh.exampleForms.wizard.stepsLabel });
  const upcoming = steps.getByRole('button').nth(2);
  await upcoming.focus();
  await upcoming.press('Enter');
  await expect(page.getByLabel(zh.exampleProjects.fields.name, { exact: true })).toBeVisible();
  await page.getByLabel(zh.exampleProjects.fields.name, { exact: true }).focus();
  await page.keyboard.type('Keyboard project');
  await page.keyboard.press('Tab');
  await page.keyboard.type('E2E-WIZARD');
  await expect(page.getByText(zh.exampleForms.wizard.available, { exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(next(page)).toBeFocused();
  await page.keyboard.press('Enter');
  const owner = page.getByLabel(zh.exampleProjects.fields.owner, { exact: true });
  await expect(next(page)).toBeDisabled();
  await page.keyboard.press('Tab');
  await expect(owner).toBeFocused();
  await page.keyboard.type('Alex Morgan');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.getByRole('option', { name: zh.exampleProjects.status.paused, exact: true }).press('Enter');
  await next(page).press('Enter');
  await page.getByLabel(zh.exampleProjects.fields.description, { exact: true }).fill('A neutral project created from the wizard.');
  await page.getByRole('link', { name: zh.exampleForms.wizard.editStep.replace('{step}', zh.exampleForms.wizard.basic), exact: true }).press('Enter');
  await expect(page.getByLabel(zh.exampleProjects.fields.name, { exact: true })).toHaveValue('Keyboard project');
  await next(page).press('Enter');
  await expect(owner).toHaveValue('Alex Morgan');
  await next(page).press('Enter');
  await expect(page.getByLabel(zh.exampleProjects.fields.description, { exact: true })).toHaveValue('A neutral project created from the wizard.');
  const submit = page.getByRole('button', { name: zh.exampleForms.wizard.submit, exact: true });
  await submit.press('Enter');
  // 再次触发表单提交也必须共用同一个同步请求锁。
  await page.locator('main form').evaluate((form) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole('heading', { name: zh.exampleForms.wizard.success, exact: true })).toBeVisible();
  const result = await page.evaluate(() => ({
    draft: localStorage.getItem('pilot-admin:form-draft:u-0001:project-wizard'),
    count: JSON.parse(localStorage.getItem('pilot-admin:mock-db:v7')!).exampleProjects.filter((item: { code: string }) => item.code === 'E2E-WIZARD').length,
  }));
  expect(result).toEqual({ draft: null, count: 1 });
  await page.getByRole('link', { name: zh.exampleForms.wizard.view, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keyboard project', exact: true })).toBeVisible();
});

test('wizard taken code blocks next and announces availability after changing it', async ({ page, loginAs }) => {
  await loginAs('operator');
  await page.goto('examples/forms/wizard');
  await page.getByLabel(zh.exampleProjects.fields.name, { exact: true }).fill('Example');
  const code = page.getByLabel(zh.exampleProjects.fields.code, { exact: true });
  await code.fill('PRJ-001');
  await expect(page.locator('#wizard-code-status')).toHaveText(zh.exampleForms.wizard.taken);
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  await expect(next(page)).toBeDisabled();
  await code.fill('E2E-AVAILABLE');
  await expect(page.locator('#wizard-code-status')).toHaveText(zh.exampleForms.wizard.available);
  await expect(next(page)).toBeEnabled();
});

test('a real concurrent create causes 409, returns to step one and focuses the code error', async ({ page, context, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/forms/wizard');
  await review(page, 'E2E-RACE');
  const other = await context.newPage();
  await other.goto('examples/crud');
  await other.getByRole('button', { name: zh.button.exampleCreate, exact: true }).click();
  const dialog = other.getByRole('dialog', { name: zh.button.exampleCreate, exact: true });
  await dialog.getByRole('textbox', { name: zh.exampleProjects.fields.name, exact: true }).fill('Concurrent project');
  await dialog.getByRole('textbox', { name: zh.exampleProjects.fields.code, exact: true }).fill('E2E-RACE');
  await dialog.getByRole('textbox', { name: zh.exampleProjects.fields.owner, exact: true }).fill('Alex');
  await dialog.getByRole('button', { name: zh.common.actions.create, exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: zh.exampleForms.wizard.submit, exact: true }).click();
  const code = page.getByLabel(zh.exampleProjects.fields.code, { exact: true });
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  await expect(code).toHaveAccessibleDescription(new RegExp(zh.exampleForms.wizard.taken));
  await expect(page.getByLabel(zh.exampleProjects.fields.name, { exact: true })).toHaveValue('Example wizard project');
  await code.fill('E2E-RACE-RETRY');
  await expect(next(page)).toBeEnabled();
  await next(page).click();
  await expect(page.getByLabel(zh.exampleProjects.fields.owner, { exact: true })).toHaveValue('Alex Morgan');
  await other.close();
});

test('wizard restores a per-user values-only draft after reload and supports start over', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/forms/wizard');
  await review(page, 'E2E-DRAFT');
  await page.getByLabel(zh.exampleProjects.fields.description, { exact: true }).fill('Preserved draft');
  await expect(page.getByText(zh.exampleForms.wizard.draftSaved, { exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.reload();
  await page.getByRole('button', { name: zh.exampleForms.wizard.restore, exact: true }).click();
  await expect(page.getByLabel(zh.exampleProjects.fields.code, { exact: true })).toHaveValue('E2E-DRAFT');
  await expect(next(page)).toBeEnabled();
  await next(page).click();
  await expect(page.getByLabel(zh.exampleProjects.fields.owner, { exact: true })).toHaveValue('Alex Morgan');
  await next(page).click();
  await expect(page.getByLabel(zh.exampleProjects.fields.description, { exact: true })).toHaveValue('Preserved draft');
  page.once('dialog', (dialog) => dialog.accept());
  await page.reload();
  await page.getByRole('button', { name: zh.exampleForms.wizard.startOver, exact: true }).click();
  await expect(page.getByLabel(zh.exampleProjects.fields.name, { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('pilot-admin:form-draft:u-0001:project-wizard'))).toBeNull();
});

test('wizard leave guard cancels or proceeds through real sidebar navigation', async ({ page, loginAs }) => {
  await loginAs('admin');
  await page.goto('examples/forms/wizard');
  await page.getByLabel(zh.exampleProjects.fields.name, { exact: true }).fill('Unsaved project');
  const target = page.getByRole('link', { name: zh.menu.resultPages, exact: true });
  await target.click();
  const dialog = page.getByRole('dialog', { name: zh.exampleForms.leave.title, exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: zh.exampleForms.leave.stay, exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/forms\/wizard$/);
  await expect(page.getByLabel(zh.exampleProjects.fields.name, { exact: true })).toHaveValue('Unsaved project');
  await target.click();
  await dialog.getByRole('button', { name: zh.exampleForms.leave.leave, exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/results$/);
});

test('long form scroll-spy, keyboard anchors and local scrolling preserve the sticky footer', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/forms/sections');
  const nav = page.getByRole('navigation', { name: zh.exampleForms.sections.navLabel });
  const advanced = nav.getByRole('link', { name: zh.exampleForms.sections.advanced, exact: true });
  await advanced.focus();
  await advanced.press('Enter');
  const scroll = page.getByRole('region', { name: zh.exampleForms.sections.title, exact: true });
  await expect.poll(() => scroll.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
  await expect(advanced).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('#profile-section-advanced')).toBeFocused();
  expect(await scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await scroll.focus();
  await scroll.press('Home');
  await expect(nav.getByRole('link', { name: zh.exampleForms.sections.basic, exact: true })).toHaveAttribute('aria-current', 'location');
  await scroll.press('End');
  await expect(advanced).toHaveAttribute('aria-current', 'location');
  await expect(page.getByRole('button', { name: zh.exampleForms.sections.save, exact: true })).toBeInViewport();
  expect(await page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight, top: scrollY }))).toEqual({ x: 0, y: 0, top: 0 });
});

test('long form error summary focuses client and server fields, then submits without persistence', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/forms/sections');
  const initial = await page.evaluate(() => localStorage.getItem('pilot-admin:mock-db:v7'));
  await page.getByLabel(zh.exampleForms.fields.organizationName, { exact: true }).fill('');
  await page.getByLabel(zh.exampleForms.fields.email, { exact: true }).fill('invalid');
  await page.getByRole('button', { name: zh.exampleForms.sections.save, exact: true }).click();
  const summary = page.getByRole('alert').filter({ has: page.getByRole('heading', { name: zh.exampleForms.sections.errorTitle, exact: true }) });
  await expect(summary).toBeFocused();
  await summary.getByRole('link', { name: new RegExp(zh.exampleForms.fields.email) }).press('Enter');
  await expect(page.getByLabel(zh.exampleForms.fields.email, { exact: true })).toBeFocused();
  await page.getByLabel(zh.exampleForms.fields.email, { exact: true }).fill('contact@example.com');
  await page.getByLabel(zh.exampleForms.fields.organizationName, { exact: true }).fill('system');
  await page.getByLabel(zh.exampleForms.fields.endDate, { exact: true }).fill('2026-10-01');
  await page.getByRole('button', { name: zh.exampleForms.sections.save, exact: true }).click();
  await expect(summary).toContainText(zh.exampleForms.validation.reservedName);
  await expect(summary).toContainText(zh.exampleForms.validation.dateOrder);
  await summary.getByRole('link', { name: new RegExp(zh.exampleForms.fields.endDate) }).click();
  await expect(page.getByLabel(zh.exampleForms.fields.endDate, { exact: true })).toBeFocused();
  await page.getByLabel(zh.exampleForms.fields.endDate, { exact: true }).fill('2026-12-01');
  await page.getByLabel(zh.exampleForms.fields.organizationName, { exact: true }).fill('Example team');
  await page.getByRole('button', { name: zh.exampleForms.sections.save, exact: true }).click();
  await expect(page.getByText(zh.exampleForms.sections.success, { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: zh.exampleForms.sections.clean })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('pilot-admin:mock-db:v7'))).toBe(initial);
});

test('viewer has a read-only wizard notice and editable stateless profile; reset and leave are guarded', async ({ page, loginAs }) => {
  await loginAs('viewer');
  await page.goto('examples/forms/wizard');
  await expect(page.getByRole('heading', { name: zh.exampleForms.wizard.readOnly, exact: true })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page.getByRole('link', { name: zh.menu.formSections, exact: true }).click();
  await page.getByLabel(zh.exampleForms.fields.organizationName, { exact: true }).fill('Changed example');
  await page.getByRole('button', { name: zh.exampleForms.sections.reset, exact: true }).click();
  const reset = page.getByRole('dialog', { name: zh.exampleForms.sections.resetTitle, exact: true });
  await reset.getByRole('button', { name: zh.common.actions.cancel, exact: true }).click();
  await expect(page.getByLabel(zh.exampleForms.fields.organizationName, { exact: true })).toHaveValue('Changed example');
  await page.getByRole('link', { name: zh.menu.resultPages, exact: true }).click();
  await page.getByRole('dialog', { name: zh.exampleForms.leave.title, exact: true }).getByRole('button', { name: zh.exampleForms.leave.stay, exact: true }).click();
  await page.getByRole('button', { name: zh.exampleForms.sections.reset, exact: true }).click();
  await reset.getByRole('button', { name: zh.common.actions.confirmReset, exact: true }).click();
  await expect(page.getByLabel(zh.exampleForms.fields.organizationName, { exact: true })).toHaveValue('Example organization');
  await page.getByRole('link', { name: zh.menu.resultPages, exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/results$/);
});
