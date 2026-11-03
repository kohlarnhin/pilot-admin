import { expect, type Page } from '@playwright/test';
import type zh from '../src/i18n/locales/zh-CN';
import type en from '../src/i18n/locales/en-US';

/** 通过真实角色及用户页面授权，不直接修改 Mock DB 或认证 store。 */
export async function grantAssistantReadOnly(page: Page, copy: typeof zh | typeof en) {
  await page.goto('/system/roles');
  await page.getByRole('button', { name: copy.button.roleCreate, exact: true }).click();
  const create = page.getByRole('dialog', { name: copy.button.roleCreate, exact: true });
  await create.getByRole('textbox', { name: copy.roles.fields.name, exact: true }).fill('Assistant settings reader');
  await create.getByRole('textbox', { name: new RegExp(copy.roles.fields.code) }).fill('ROLE_ASSISTANT_READER');
  await create.getByRole('button', { name: copy.common.actions.create, exact: true }).click();
  await expect(create).toBeHidden();
  const row = page.getByRole('row').filter({ hasText: 'ROLE_ASSISTANT_READER' });
  await row.getByRole('button', { name: copy.button.rolePermissions, exact: true }).click();
  const permissions = page.getByRole('dialog', { name: copy.roles.permissionDialog.title, exact: true });
  await permissions.getByRole('checkbox', { name: copy.menu.assistant, exact: true }).check();
  await permissions.getByRole('checkbox', { name: copy.button.agentConfigView, exact: true }).check();
  await expect(permissions.getByRole('checkbox', { name: copy.button.agentConfigUpdate, exact: true })).not.toBeChecked();
  await permissions.getByRole('button', { name: copy.roles.permissionDialog.save, exact: true }).click();
  await expect(permissions).toBeHidden();

  await page.goto('/system/users?keyword=operator');
  const operator = page.getByRole('row').filter({ hasText: '@operator' });
  await operator.getByRole('button', { name: copy.button.userUpdate, exact: true }).click();
  const edit = page.getByRole('dialog', { name: copy.button.userUpdate, exact: true });
  await edit.getByRole('combobox', { name: copy.users.fields.roles }).click();
  await expect(page.getByRole('option', { name: /ROLE_OPERATOR/, selected: true })).toBeVisible();
  await page.getByRole('option', { name: /ROLE_ASSISTANT_READER/ }).click();
  await page.keyboard.press('Escape');
  await edit.getByRole('button', { name: copy.common.actions.save, exact: true }).click();
  await expect(edit).toBeHidden();
}
