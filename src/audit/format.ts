/// <reference lib="es2021.intl" />
import { getLocale, t, type MessageKey } from '@/i18n';
import type { AuditAction, AuditDisplayParams, AuditLog, AuditModule, AuditProfileField, AuditReason } from '@/types';

const ACTION_KEYS = {
  'auth.login': 'audit.action.auth.login',
  'auth.login_failed': 'audit.action.auth.loginFailed',
  'auth.logout': 'audit.action.auth.logout',
  'auth.password_change': 'audit.action.auth.passwordChange',
  'user.create': 'audit.action.user.create',
  'user.update': 'audit.action.user.update',
  'user.status': 'audit.action.user.status',
  'user.reset_password': 'audit.action.user.resetPassword',
  'user.delete': 'audit.action.user.delete',
  'role.create': 'audit.action.role.create',
  'role.update': 'audit.action.role.update',
  'role.status': 'audit.action.role.status',
  'role.delete': 'audit.action.role.delete',
  'role.permissions': 'audit.action.role.permissions',
  'menu.rename': 'audit.action.menu.rename',
  'button.rename': 'audit.action.button.rename',
  'settings.update': 'audit.action.settings.update',
  'settings.reset_demo': 'audit.action.settings.resetDemo',
  'agent_config.create': 'audit.action.agentConfig.create',
  'agent_config.update': 'audit.action.agentConfig.update',
  'agent_config.delete': 'audit.action.agentConfig.delete',
  'agent_config.status': 'audit.action.agentConfig.status',
  'agent_profile.update': 'audit.action.agentProfile.update',
  'profile.update': 'audit.action.profile.update',
  'example.create': 'audit.action.example.create',
  'example.update': 'audit.action.example.update',
  'example.delete': 'audit.action.example.delete',
  'example.batch_delete': 'audit.action.example.batchDelete',
} as const satisfies Record<AuditAction, MessageKey>;
const MODULE_KEYS = {
  auth: 'audit.module.auth',
  user: 'audit.module.user',
  role: 'audit.module.role',
  menu: 'audit.module.menu',
  settings: 'audit.module.settings',
  agent_config: 'audit.module.agentConfig',
  agent_profile: 'audit.module.agentProfile',
  profile: 'audit.module.profile',
  example: 'audit.module.example',
} as const satisfies Record<AuditModule, MessageKey>;
const REASON_KEYS = {
  invalid_credentials: 'audit.reason.invalidCredentials',
  account_disabled: 'audit.reason.accountDisabled',
  forbidden: 'audit.reason.forbidden',
  invalid_input: 'audit.reason.invalidInput',
  not_found: 'audit.reason.notFound',
  conflict: 'audit.reason.conflict',
} as const satisfies Record<AuditReason, MessageKey>;
const TARGET_KEYS = {
  user: 'audit.targetType.user',
  role: 'audit.targetType.role',
  menu: 'audit.targetType.menu',
  button: 'audit.targetType.button',
  settings: 'audit.targetType.settings',
  agent_config: 'audit.targetType.agentConfig',
  agent_profile: 'audit.targetType.agentProfile',
  example: 'audit.targetType.example',
} as const satisfies Record<NonNullable<AuditLog['target_type']>, MessageKey>;
const PROFILE_FIELD_KEYS = {
  user_name: 'audit.profileFields.userName',
  email: 'audit.profileFields.email',
  agent_mode_entry: 'audit.profileFields.agentModeEntry',
} as const satisfies Record<AuditProfileField, MessageKey>;
export const formatAuditModule = (module: AuditModule): string => t(MODULE_KEYS[module]);
export const formatAuditReason = (reason: AuditReason): string => t(REASON_KEYS[reason]);

function formatProfileFields(fields: AuditProfileField[] = []): string {
  if (!fields.length) return '';
  return new Intl.ListFormat(getLocale(), { style: 'long', type: 'conjunction' }).format(fields.map((field) => t(PROFILE_FIELD_KEYS[field])));
}

export function formatAuditAction(entry: Pick<AuditLog, 'action' | 'target_name' | 'params'>): string {
  const params = entry.params || {};
  return t(ACTION_KEYS[entry.action], {
    target: entry.target_name || t('audit.unknownTarget'),
    status: t(params.status === 1 ? 'common.status.enabled' : 'common.status.disabled'),
    menuCount: params.menu_count ?? 0,
    buttonCount: params.button_count ?? 0,
    section: t(`audit.section.${params.section || 'basic'}`),
    count: params.count ?? 0,
    fields: formatProfileFields(params.fields),
  });
}

export function formatAuditParams(params: AuditDisplayParams = {}): [string, string][] {
  const entries: [string, string][] = [];
  if (params.status !== undefined) entries.push([t('audit.params.status'), t(params.status === 1 ? 'common.status.enabled' : 'common.status.disabled')]);
  if (params.menu_count !== undefined) entries.push([t('audit.params.menuCount'), String(params.menu_count)]);
  if (params.button_count !== undefined) entries.push([t('audit.params.buttonCount'), String(params.button_count)]);
  if (params.section !== undefined) entries.push([t('audit.params.section'), t(`audit.section.${params.section}`)]);
  if (params.count !== undefined) entries.push([t('audit.params.count'), String(params.count)]);
  if (params.fields !== undefined) entries.push([t('audit.params.fields'), formatProfileFields(params.fields)]);
  return entries;
}

export function formatAuditTarget(type: NonNullable<AuditLog['target_type']>): string {
  return t(TARGET_KEYS[type]);
}
