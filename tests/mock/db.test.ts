import { beforeEach, describe, expect, it, vi } from 'vitest';

const currentKey = 'pilot-admin:mock-db:v5';

beforeEach(() => {
  vi.resetModules();
});

describe('mock DB persistence', () => {
  it.each([
    ['corrupt JSON', '{broken json'],
    ['old shape', JSON.stringify({ version: 5, users: [], roles: [] })],
  ])('falls back to a complete seed for %s', async (_name, value) => {
    localStorage.setItem(currentKey, value);
    const { getMockDb, MOCK_DB_KEY } = await import('@/mock/db');
    const db = getMockDb();
    expect(MOCK_DB_KEY).toBe(currentKey);
    expect(db.version).toBe(5);
    expect(db.users.find((user) => user.login_name === 'admin')?.role_ids).toEqual(['role-admin']);
    expect(db.exampleProjects).toHaveLength(80);
    expect(db.agentSessions).toHaveLength(25);
    expect(db.auditLogs.length).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem(currentKey)!)).toEqual(db);
  });

  it('rejects a complete stored DB with the wrong version', async () => {
    const { createSeed } = await import('@/mock/seed');
    const stored = createSeed();
    stored.users[0].user_name = 'Wrong-version data';
    localStorage.setItem(currentKey, JSON.stringify({ ...stored, version: 4 }));
    vi.resetModules();
    const { getMockDb } = await import('@/mock/db');
    expect(getMockDb().version).toBe(5);
    expect(getMockDb().users[0].user_name).not.toBe('Wrong-version data');
    expect(JSON.parse(localStorage.getItem(currentKey)!)).toEqual(getMockDb());
  });

  it('reuses a valid persisted DB, including user edits, without writing it again', async () => {
    const { createSeed } = await import('@/mock/seed');
    const stored = createSeed();
    stored.users[0].user_name = '用户保留的名字';
    stored.exampleProjects[0].description = 'a'.repeat(1000);
    localStorage.setItem(currentKey, JSON.stringify(stored));
    // 存储状态先于 DB 单例初始化，不能依赖之前测试留下的内存。
    vi.resetModules();
    const write = vi.spyOn(localStorage, 'setItem');
    const { getMockDb } = await import('@/mock/db');
    expect(getMockDb()).toEqual(stored);
    expect(write).not.toHaveBeenCalled();
  });

  it('cleans lower-version keys only after a valid current DB existed at startup', async () => {
    const { createSeed } = await import('@/mock/seed');
    localStorage.setItem(currentKey, JSON.stringify(createSeed()));
    localStorage.setItem('pilot-admin:mock-db:v3', 'old-3');
    localStorage.setItem('pilot-admin:mock-db:v4', 'old-4');
    localStorage.setItem('pilot-admin:mock-db:v5:backup', 'backup');
    localStorage.setItem('other-project:data', 'unrelated');
    expect(Object.keys(localStorage)).toContain('pilot-admin:mock-db:v4');
    await import('@/mock/db');
    expect(localStorage.getItem('pilot-admin:mock-db:v3')).toBeNull();
    expect(localStorage.getItem('pilot-admin:mock-db:v4')).toBeNull();
    expect(localStorage.getItem('pilot-admin:mock-db:v5:backup')).toBe('backup');
    expect(localStorage.getItem('other-project:data')).toBe('unrelated');
  });

  it('preserves every version and blocks writes when a future version is present at startup', async () => {
    localStorage.setItem('pilot-admin:mock-db:v4', 'old');
    localStorage.setItem('pilot-admin:mock-db:v6', 'future');
    const { getMockDb, updateMockDb, resetMockDb, STALE_BUILD_CODE } = await import('@/mock/db');
    const before = getMockDb();
    const update = vi.fn();
    expect(() => updateMockDb(update)).toThrow(expect.objectContaining({ code: STALE_BUILD_CODE, status: 409 }));
    expect(() => resetMockDb()).toThrow(expect.objectContaining({ code: STALE_BUILD_CODE }));
    expect(update).not.toHaveBeenCalled();
    expect(getMockDb()).toBe(before);
    expect(localStorage.getItem(currentKey)).toBeNull();
    expect(localStorage.getItem('pilot-admin:mock-db:v4')).toBe('old');
    expect(localStorage.getItem('pilot-admin:mock-db:v6')).toBe('future');
  });

  it('detects same-tab future writes and remains stale until reload', async () => {
    const { updateMockDb, resetMockDb, STALE_BUILD_CODE } = await import('@/mock/db');
    localStorage.setItem('pilot-admin:mock-db:v6', 'future');
    expect(() => updateMockDb(() => {})).toThrow(expect.objectContaining({ code: STALE_BUILD_CODE }));
    localStorage.removeItem('pilot-admin:mock-db:v6');
    expect(() => resetMockDb()).toThrow(expect.objectContaining({ code: STALE_BUILD_CODE }));
    vi.resetModules();
    const reloaded = await import('@/mock/db');
    expect(() => reloaded.updateMockDb(() => {})).not.toThrow();
  });

  it('marks higher-version storage events stale and ignores lower-version events', async () => {
    const { getMockDb, updateMockDb, STALE_BUILD_CODE } = await import('@/mock/db');
    const before = getMockDb();
    const event = (key: string) => Object.assign(new Event('storage'), { key });
    window.dispatchEvent(event('pilot-admin:mock-db:v4'));
    expect(getMockDb()).toBe(before);
    window.dispatchEvent(event('pilot-admin:mock-db:v6'));
    expect(() => updateMockDb(() => {})).toThrow(expect.objectContaining({ code: STALE_BUILD_CODE }));
  });

  it('reloads current-key changes and notifies data subscribers', async () => {
    const { getMockDb, MOCK_DB_KEY } = await import('@/mock/db');
    const stored = structuredClone(getMockDb());
    stored.exampleProjects[0].name = 'Other tab edit';
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(stored));
    localStorage.setItem('pilot-admin:mock-db:v4', 'retained source');
    const onData = vi.fn();
    window.addEventListener('pilot-admin:agent:data-changed', onData);
    window.dispatchEvent(Object.assign(new Event('storage'), { key: MOCK_DB_KEY }));
    expect(getMockDb().exampleProjects[0].name).toBe('Other tab edit');
    expect(localStorage.getItem('pilot-admin:mock-db:v4')).toBe('retained source');
    expect(onData).toHaveBeenCalledOnce();
  });

  it('commits a successful draft to storage and memory together', async () => {
    const { getMockDb, updateMockDb } = await import('@/mock/db');
    const before = getMockDb();
    const oldName = before.users[0].user_name;
    updateMockDb((draft) => { draft.users[0].user_name = 'Saved name'; });
    expect(getMockDb()).not.toBe(before);
    expect(before.users[0].user_name).toBe(oldName);
    expect(getMockDb().users[0].user_name).toBe('Saved name');
    expect(JSON.parse(localStorage.getItem(currentKey)!).users[0].user_name).toBe('Saved name');
  });

  it('throws on a persistence failure and leaves both in-memory and stored data unchanged', async () => {
    const { getMockDb, updateMockDb } = await import('@/mock/db');
    const before = getMockDb();
    const snapshot = structuredClone(before);
    const stored = localStorage.getItem(currentKey);
    const failure = new DOMException('Quota exceeded', 'QuotaExceededError');
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw failure; });
    expect(() => updateMockDb((draft) => { draft.users[0].user_name = 'Must not commit'; })).toThrow(failure);
    expect(getMockDb()).toBe(before);
    expect(getMockDb()).toEqual(snapshot);
    expect(localStorage.getItem(currentKey)).toBe(stored);
  });

  it('still seeds in memory when accessing localStorage itself is forbidden', async () => {
    const failure = new DOMException('Storage unavailable', 'SecurityError');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw failure; } });
    const { getMockDb, updateMockDb } = await import('@/mock/db');
    expect(getMockDb().exampleProjects).toHaveLength(80);
    const before = getMockDb();
    expect(() => updateMockDb(() => {})).toThrow(failure);
    expect(getMockDb()).toBe(before);
  });
});
