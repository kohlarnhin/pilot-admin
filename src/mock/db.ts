import { AUDIT_MODULES, AUDIT_PARAMS, AUDIT_REASONS, allowAuditParams, auditModule } from '@/audit/catalog';
import { clearQueryCache } from '@/api/queryCache';
import { createSeed, type MockDb } from './seed';
import { syncPermissionCatalog } from './permissionCatalog';
import { hasNewerMockDb, loadMockDb, MOCK_DB_PREFIX } from './dbStorage';
import { mockDbMigrations } from './migrations';
import { ApiRequestError } from '@/api/errors';
import { t } from '@/i18n';
import { triggerDataChangeSideEffects } from '@/api/services/agentEvents';

export const MOCK_DB_RESET_EVENT = 'pilot-admin:mock-db-reset';
export const MOCK_DB_VERSION = 6;
export const MOCK_DB_KEY = `${MOCK_DB_PREFIX}${MOCK_DB_VERSION}`;
export const STALE_BUILD_CODE = 40990;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);
const isStringMap = (value: unknown) => isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
const isStringArray = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const hasAudit = (value: Record<string, unknown>) => (
  ['create_by', 'create_date', 'last_update_by', 'last_update_date'].every((key) => typeof value[key] === 'string')
);

// 完整形状校验；迁移后与同步权限目录后都必须通过。
export function isMockDb(value: unknown): value is MockDb {
  if (!isRecord(value) || value.version !== MOCK_DB_VERSION || !Array.isArray(value.users) || !Array.isArray(value.roles)
    || !isRecord(value.permissionCatalog) || !isStringArray(value.permissionCatalog.menuIds) || !isStringArray(value.permissionCatalog.buttonIds)
    || !isStringMap(value.menuNames) || !isStringMap(value.buttonNames) || !Array.isArray(value.auditLogs) || !Array.isArray(value.exampleProjects)) {
    return false;
  }

  if (!value.users.every((user) => isRecord(user) && hasAudit(user)
    && typeof user.id === 'string' && typeof user.login_name === 'string'
    && typeof user.user_name === 'string' && typeof user.password === 'string'
    && (user.status === 0 || user.status === 1)
    && (user.email === undefined || typeof user.email === 'string')
    && isStringArray(user.role_ids) && isRecord(user.preferences)
    && ['ask', 'agent', 'console'].includes(String(user.preferences.agent_mode_entry)))) {
    return false;
  }

  if (!value.roles.every((role) => isRecord(role) && hasAudit(role)
    && typeof role.id === 'string' && typeof role.role_name === 'string' && typeof role.role_code === 'string'
    && typeof role.auto_grant === 'boolean'
    && (role.status === 0 || role.status === 1) && isStringArray(role.menuIds) && isStringArray(role.buttonIds))) {
    return false;
  }

  if (!Array.isArray(value.agentSessions) || !value.agentSessions.every((session) => isRecord(session)
    && (typeof session.id === 'string' || typeof session.id === 'number')
    && typeof session.create_date === 'string' && typeof session.last_message_date === 'string'
    && typeof session.message_count === 'number' && typeof session.context_character_count === 'number'
    && typeof session.userId === 'string' && typeof session.title === 'string' && Array.isArray(session.messages)
    && session.messages.every((message) => isRecord(message) && typeof message.content === 'string'
      && (typeof message.id === 'string' || typeof message.id === 'number') && typeof message.create_date === 'string'
      && typeof message.sequence_no === 'number' && ['user', 'assistant'].includes(String(message.role))))) {
    return false;
  }

  if ((value.agentProfileCustomized !== undefined && typeof value.agentProfileCustomized !== 'boolean')
    || !isRecord(value.agentProfile)
    || typeof value.agentProfile.name !== 'string' || typeof value.agentProfile.greeting !== 'string'
    || !Array.isArray(value.agentProfile.suggestions) || !value.agentProfile.suggestions.every((item) => isRecord(item)
      && typeof item.label === 'string' && typeof item.prompt === 'string')) {
    return false;
  }

  if (!Array.isArray(value.agentConfigs) || !value.agentConfigs.every((item) => isRecord(item)
    && typeof item.id === 'string' && typeof item.apiKey === 'string' && typeof item.provider === 'string'
    && typeof item.base_url === 'string' && typeof item.model_code === 'string' && typeof item.model_name === 'string'
    && (item.status === 0 || item.status === 1))) {
    return false;
  }

  const settings = value.settings;
  if (!isRecord(settings) || !isRecord(settings.basic)
    || typeof settings.basic.siteName !== 'string' || typeof settings.basic.description !== 'string'
    || !isRecord(settings.security) || typeof settings.security.passwordMinLength !== 'number'
    || !Number.isFinite(settings.security.passwordMinLength)
    || typeof settings.security.requireNumber !== 'boolean' || typeof settings.security.requireLetter !== 'boolean'
    || !isRecord(settings.notifications)
    || !['systemNotice', 'accountChange', 'weeklySummary'].every((key) => (
      typeof (settings.notifications as Record<string, unknown>)[key] === 'boolean'
    ))) {
    return false;
  }

  if (!value.exampleProjects.every((item) => isRecord(item) && hasAudit(item)
    && ['id', 'name', 'code', 'owner'].every((key) => typeof item[key] === 'string')
    && ['active', 'paused', 'archived'].includes(String(item.status))
    && (item.description === undefined || typeof item.description === 'string'))) return false;

  if (!Array.isArray(value.importReceipts) || value.importReceipts.length > 5000) return false;
  const receiptKeys = new Set<string>();
  const importIds = new Set<string>();
  if (!value.importReceipts.every((item) => {
    if (!isRecord(item) || typeof item.import_id !== 'string' || !Number.isSafeInteger(item.row_no) || Number(item.row_no) < 1
      || !['created', 'failed'].includes(String(item.status)) || typeof item.actor_id !== 'string' || typeof item.create_date !== 'string'
      || (item.status === 'created' && (typeof item.project_id !== 'string' || item.error_code !== undefined))
      || (item.status === 'failed' && (!Number.isSafeInteger(item.error_code) || item.project_id !== undefined))
      || Object.keys(item).some((key) => !['import_id', 'row_no', 'status', 'project_id', 'error_code', 'actor_id', 'create_date'].includes(key))) return false;
    const key = `${item.import_id}:${item.row_no}`;
    if (receiptKeys.has(key)) return false;
    receiptKeys.add(key);
    importIds.add(item.import_id);
    return true;
  }) || importIds.size > 20) return false;

  return value.auditLogs.length <= 1000 && value.auditLogs.every((item) => {
    if (!isRecord(item) || !['id', 'actor_name', 'trace_id', 'create_date'].every((key) => typeof item[key] === 'string')
      || !Object.prototype.hasOwnProperty.call(AUDIT_PARAMS, String(item.action)) || !AUDIT_MODULES.includes(item.module as never)
      || auditModule(item.action as keyof typeof AUDIT_PARAMS) !== item.module
      || !['success', 'failure'].includes(String(item.result))
      || (item.reason !== undefined && !AUDIT_REASONS.includes(item.reason as never))
      || !['actor_id', 'target_id', 'target_name'].every((key) => item[key] === undefined || typeof item[key] === 'string')
      || (item.target_type !== undefined && !['user', 'role', 'menu', 'button', 'settings', 'agent_config', 'agent_profile', 'example'].includes(String(item.target_type)))) return false;
    const safeParams = allowAuditParams(item.action as keyof typeof AUDIT_PARAMS, item.params);
    if (AUDIT_PARAMS[item.action as keyof typeof AUDIT_PARAMS].some((key) => !(key in safeParams))) return false;
    if (item.params !== undefined && (!isRecord(item.params)
      || Object.entries(item.params).some(([key, value]) => {
        const safeValue = (safeParams as Record<string, unknown>)[key];
        if (Array.isArray(value) && Array.isArray(safeValue)) {
          return value.length !== safeValue.length || value.some((field, index) => field !== safeValue[index]);
        }
        return safeValue !== value;
      }))) return false;
    const allowed = ['id', 'actor_id', 'actor_name', 'module', 'action', 'target_type', 'target_id', 'target_name', 'params', 'result', 'reason', 'trace_id', 'create_date'];
    return Object.keys(item).every((key) => allowed.includes(key));
  });
}

let stale = false;
// 延迟访问全局 Storage；浏览器连 localStorage getter 都拒绝时仍可读种子。
const storage = {
  get length() { return localStorage.length; },
  key: (index: number) => localStorage.key(index),
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

function readDb(atStartup = false): MockDb {
  const loaded = loadMockDb({
    storage,
    version: MOCK_DB_VERSION,
    minMigratableVersion: 5,
    migrations: mockDbMigrations,
    validate: isMockDb,
    seed: createSeed,
    sync: (db) => syncPermissionCatalog(db).db,
    readOnly: stale,
    cleanupLowerVersions: atStartup,
  });
  stale = stale || loaded.stale;
  return loaded.db;
}

function requireWritableBuild(): void {
  stale = stale || hasNewerMockDb(storage, MOCK_DB_VERSION);
  if (stale) throw new ApiRequestError(t('serverErrors.staleBuild'), 409, STALE_BUILD_CODE);
}

let database = readDb(true);

export const getMockDb = (): MockDb => database;

export function updateMockDb(update: (draft: MockDb) => void): void {
  requireWritableBuild();
  const draft = structuredClone(database);
  update(draft);

  // 修改时要求持久化成功，避免界面报告保存成功但刷新后丢失。
  requireWritableBuild();
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(draft));
  database = draft;
  clearQueryCache();
}

export function resetMockDb(update?: (draft: MockDb) => void): void {
  requireWritableBuild();
  const seed = createSeed();
  update?.(seed);
  requireWritableBuild();
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(seed));
  database = seed;

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('pilot-admin:ai-assistant:') || key.startsWith('pilot-admin:assistant:')) {
      localStorage.removeItem(key);
    }
  }
  clearQueryCache();
  window.dispatchEvent(new Event(MOCK_DB_RESET_EVENT));
}

window.addEventListener('storage', (event) => {
  if (event.key && Number(/^pilot-admin:mock-db:v(\d+)$/.exec(event.key)?.[1]) > MOCK_DB_VERSION) stale = true;
  if (event.key === MOCK_DB_KEY || event.key === null) {
    database = readDb();
    triggerDataChangeSideEffects();
  }
});
