import { clearQueryCache } from '@/api/queryCache';
import { createSeed, type MockDb } from './seed';

export const MOCK_DB_KEY = 'pilot-admin:mock-db:v1';

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isStringMap = (value: unknown) => isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
const isStringArray = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === 'string');
const hasAudit = (value: Record<string, unknown>) => ['create_by', 'create_date', 'last_update_by', 'last_update_date'].every((key) => typeof value[key] === 'string');

// 旧版本、截断 JSON 和形状损坏均回退到确定性种子。
function isMockDb(value: unknown): value is MockDb {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.users) || !Array.isArray(value.roles)
    || !isStringMap(value.menuNames) || !isStringMap(value.buttonNames) || !Array.isArray(value.activities)) return false;
  if (!value.users.every((user) => isRecord(user) && hasAudit(user) && typeof user.id === 'string' && typeof user.login_name === 'string'
    && typeof user.user_name === 'string' && typeof user.password === 'string' && (user.status === 0 || user.status === 1)
    && (user.email === undefined || typeof user.email === 'string') && isStringArray(user.role_ids) && isRecord(user.preferences)
    && ['ask', 'agent', 'console'].includes(String(user.preferences.agent_mode_entry))
    && ['ask', 'banner', 'hidden'].includes(String(user.preferences.agent_entries_prompt)))) return false;
  if (!value.roles.every((role) => isRecord(role) && hasAudit(role) && typeof role.id === 'string' && typeof role.role_name === 'string'
    && typeof role.role_code === 'string' && (role.status === 0 || role.status === 1) && isStringArray(role.menuIds) && isStringArray(role.buttonIds))) return false;
  const settings = value.settings;
  if (!isRecord(settings) || !isRecord(settings.basic) || typeof settings.basic.siteName !== 'string' || typeof settings.basic.description !== 'string'
    || !isRecord(settings.security) || typeof settings.security.passwordMinLength !== 'number' || !Number.isFinite(settings.security.passwordMinLength)
    || typeof settings.security.requireNumber !== 'boolean' || typeof settings.security.requireLetter !== 'boolean'
    || !isRecord(settings.notifications) || !['systemNotice', 'accountChange', 'weeklySummary'].every((key) => typeof (settings.notifications as Record<string, unknown>)[key] === 'boolean')) return false;
  return value.activities.every((item) => isRecord(item) && ['id', 'actor', 'action', 'time', 'icon'].every((key) => typeof item[key] === 'string'));
}

function readDb(): MockDb {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || 'null');
    if (isMockDb(stored)) return stored;
  } catch { /* 无效存储使用初始数据。 */ }
  const seed = createSeed();
  try { localStorage.setItem(MOCK_DB_KEY, JSON.stringify(seed)); } catch { /* 存储不可用时允许内存演示。 */ }
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
  clearQueryCache();
}

window.addEventListener('storage', (event) => {
  if (event.key === MOCK_DB_KEY || event.key === null) {
    database = readDb();
    clearQueryCache();
  }
});
