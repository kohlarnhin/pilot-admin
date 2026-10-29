import { clearQueryCache } from '@/api/queryCache';
import { createSeed, type MockDb } from './seed';
import { syncPermissionCatalog } from './permissionCatalog';

export const MOCK_DB_RESET_EVENT = 'pilot-admin:mock-db-reset';
const MOCK_DB_VERSION = 4;
export const MOCK_DB_KEY = `pilot-admin:mock-db:v${MOCK_DB_VERSION}`;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);
const isStringMap = (value: unknown) => isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
const isStringArray = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const hasAudit = (value: Record<string, unknown>) => (
  ['create_by', 'create_date', 'last_update_by', 'last_update_date'].every((key) => typeof value[key] === 'string')
);

// 旧版本、截断 JSON 和形状损坏均回退到确定性种子。
function isMockDb(value: unknown): value is MockDb {
  if (!isRecord(value) || value.version !== 4 || !Array.isArray(value.users) || !Array.isArray(value.roles)
    || !isRecord(value.permissionCatalog) || !isStringArray(value.permissionCatalog.menuIds) || !isStringArray(value.permissionCatalog.buttonIds)
    || !isStringMap(value.menuNames) || !isStringMap(value.buttonNames) || !Array.isArray(value.activities)) {
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

  if (!isRecord(value.agentProfile)
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

  return value.activities.every((item) => isRecord(item)
    && ['id', 'actor', 'action', 'time', 'icon'].every((key) => typeof item[key] === 'string'));
}

function readDb(): MockDb {
  try {
    // 只清理更低版本，避免旧构建的标签页删除新版本数据。
    for (const key of Object.keys(localStorage)) {
      const version = Number(/^pilot-admin:mock-db:v(\d+)$/.exec(key)?.[1]);
      if (version < MOCK_DB_VERSION) localStorage.removeItem(key);
    }
  } catch {
    // 清理旧版本失败不影响当前数据读取。
  }
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || 'null');
    if (isMockDb(stored)) {
      const reconciled = syncPermissionCatalog(stored);
      if (reconciled.changed) {
        try {
          localStorage.setItem(MOCK_DB_KEY, JSON.stringify(reconciled.db));
        } catch {
          // 同步持久化失败仍保留补齐后的内存数据，不回退种子。
        }
      }
      return reconciled.db;
    }
  } catch {
    // 无效存储使用初始数据。
  }

  const seed = createSeed();
  try {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(seed));
  } catch {
    // 存储不可用时允许内存演示。
  }
  return seed;
}

let database = readDb();

export const getMockDb = (): MockDb => database;

export function updateMockDb(update: (draft: MockDb) => void): void {
  const draft = structuredClone(database);
  update(draft);

  // 修改时要求持久化成功，避免界面报告保存成功但刷新后丢失。
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(draft));
  database = draft;
  clearQueryCache();
}

export function resetMockDb(): void {
  const seed = createSeed();
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
  if (event.key === MOCK_DB_KEY || event.key === null) {
    database = readDb();
    clearQueryCache();
  }
});
