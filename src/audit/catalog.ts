import type { AuditAction, AuditDisplayParams, AuditModule, AuditProfileField, AuditReason } from '@/types';

export const AUDIT_MODULES = ['auth', 'user', 'role', 'menu', 'settings', 'agent_config', 'agent_profile', 'profile', 'example'] as const satisfies readonly AuditModule[];
export const AUDIT_REASONS = ['invalid_credentials', 'account_disabled', 'forbidden', 'invalid_input', 'not_found', 'conflict'] as const satisfies readonly AuditReason[];
export const AUDIT_PROFILE_FIELDS = ['user_name', 'email', 'agent_mode_entry'] as const satisfies readonly AuditProfileField[];

/** 运行时也只拣选允许的字段；禁止把服务输入或错误对象展开进日志。 */
export const AUDIT_PARAMS = {
  'auth.login': [],
  'auth.login_failed': [],
  'auth.logout': [],
  'auth.password_change': [],
  'user.create': [],
  'user.update': [],
  'user.status': ['status'],
  'user.reset_password': [],
  'user.delete': [],
  'role.create': [],
  'role.update': [],
  'role.status': ['status'],
  'role.delete': [],
  'role.permissions': ['menu_count', 'button_count'],
  'menu.rename': [],
  'button.rename': [],
  'settings.update': ['section'],
  'settings.reset_demo': [],
  'agent_config.create': [],
  'agent_config.update': [],
  'agent_config.delete': [],
  'agent_config.status': ['status'],
  'agent_profile.update': [],
  'profile.update': ['fields'],
  'example.create': [],
  'example.update': [],
  'example.delete': [],
  'example.batch_delete': ['count'],
  'example.import': ['count', 'failed'],
} as const satisfies Record<AuditAction, readonly (keyof AuditDisplayParams)[]>;

export const auditModule = (action: AuditAction): AuditModule => action === 'button.rename' ? 'menu' : action.split('.')[0] as AuditModule;

export function allowAuditParams(action: AuditAction, value: unknown): AuditDisplayParams {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const output: AuditDisplayParams = {};
  for (const key of AUDIT_PARAMS[action]) {
    const item = input[key];
    if (key === 'status' && (item === 0 || item === 1)) output.status = item;
    if (key === 'section' && ['basic', 'security', 'notifications'].includes(String(item))) output.section = item as AuditDisplayParams['section'];
    if ((key === 'count' || key === 'failed' || key === 'menu_count' || key === 'button_count') && typeof item === 'number' && Number.isSafeInteger(item) && item >= 0) output[key] = item;
    if (key === 'fields' && Array.isArray(item)) output.fields = AUDIT_PROFILE_FIELDS.filter((field) => item.includes(field));
  }
  return output;
}
