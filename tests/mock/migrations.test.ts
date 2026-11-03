import { beforeEach, describe, expect, it, vi } from 'vitest';
import source from '../fixtures/mock-db-v5.json';
import { mockDbMigrations } from '@/mock/migrations';
import { hasNewerMockDb, loadMockDb } from '@/mock/dbStorage';

// 从 ea84584 的实际浏览器种子裁剪数量，保留每个集合及真实 v5 形状。
beforeEach(() => { vi.resetModules(); });

describe('real v5 to v6 migration', () => {
  it('preserves every collection, is deterministic and never mutates the input', async () => {
    const input = structuredClone(source);
    const migrated = mockDbMigrations[5](input);
    expect(input).toEqual(source);
    expect(migrated).toEqual({ ...source, version: 6, importReceipts: [] });
    expect(mockDbMigrations[5](structuredClone(source))).toEqual(migrated);
    const { isMockDb } = await import('@/mock/db');
    expect(isMockDb(migrated)).toBe(true);
  });

  it('loads and persists v6 while retaining the v5 source until the next start', async () => {
    const serialized = JSON.stringify(source);
    localStorage.setItem('pilot-admin:mock-db:v5', serialized);
    const db = await import('@/mock/db');
    expect(db.getMockDb()).toEqual({ ...source, version: 6, importReceipts: [] });
    expect(localStorage.getItem('pilot-admin:mock-db:v5')).toBe(serialized);
    expect(JSON.parse(localStorage.getItem('pilot-admin:mock-db:v6')!)).toEqual(db.getMockDb());
    expect(hasNewerMockDb(localStorage, 5)).toBe(true);
    const oldWrite = vi.spyOn(localStorage, 'setItem');
    const oldLoad = loadMockDb({
      storage: localStorage,
      version: 5,
      minMigratableVersion: 5,
      migrations: {},
      validate: (data: unknown): data is typeof source => Boolean(data && typeof data === 'object' && 'version' in data && data.version === 5),
      seed: () => structuredClone(source),
      sync: (data) => data,
    });
    expect(oldLoad.stale).toBe(true);
    expect(oldWrite).not.toHaveBeenCalled();
    vi.resetModules();
    await import('@/mock/db');
    expect(localStorage.getItem('pilot-admin:mock-db:v5')).toBeNull();
  });

  it('rejects invalid receipt fields and unknown audit actions', async () => {
    const { getMockDb, isMockDb } = await import('@/mock/db');
    const db = getMockDb();
    const receipt = { import_id: 'test', row_no: 2, status: 'created', project_id: 'p', actor_id: 'u', create_date: '2026-11-01T00:00:00Z' };
    expect(isMockDb({ ...db, importReceipts: [receipt] })).toBe(true);
    for (const bad of [
      { ...receipt, row_no: 0 }, { ...receipt, status: 'unknown' }, { ...receipt, project_id: undefined },
      { ...receipt, raw: 'private' }, { ...receipt, status: 'failed', error_code: 40011 },
    ]) expect(isMockDb({ ...db, importReceipts: [bad] })).toBe(false);
    expect(isMockDb({ ...db, importReceipts: [receipt, receipt] })).toBe(false);
    expect(isMockDb({ ...db, auditLogs: [{ ...db.auditLogs[0], action: 'example.unknown' }] })).toBe(false);
  });
});
