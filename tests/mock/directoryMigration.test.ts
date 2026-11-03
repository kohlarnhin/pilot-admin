import { beforeEach, describe, expect, it, vi } from 'vitest';
import v5 from '../fixtures/mock-db-v5.json';
import { createMockDbMigrations } from '@/mock/migrations';
import { createDirectorySeed } from '@/mock/directorySeed';
import { seedText as zh } from '@/i18n/locales/zh-CN/seed';
import { seedText as en } from '@/i18n/locales/en-US/seed';
import type { MockDb } from '@/mock/seed';
import { syncPermissionCatalog } from '@/mock/permissionCatalog';

const migrations = createMockDbMigrations(zh);
// 真实 v5 fixture 经已发布的 5 → 6 迁移得到真实 v6 形状。
const v6 = migrations[5](structuredClone(v5));
beforeEach(() => { vi.resetModules(); });

describe('real v6 to v7 directory migration', () => {
  it('preserves all old collections and edits, adds both collections, validates and is deterministic', async () => {
    const source = structuredClone(v6) as Record<string, unknown>;
    source.importReceipts = [{ import_id: 'kept', row_no: 1, status: 'created', project_id: 'project-001', actor_id: 'u-0001', create_date: '2026-11-01T00:00:00Z' }];
    const snapshot = structuredClone(source);
    const result = migrations[6](source) as MockDb;
    expect(source).toEqual(snapshot);
    expect(migrations[6](structuredClone(source))).toEqual(result);
    for (const [key, value] of Object.entries(source)) {
      if (key !== 'version') expect(result[key as keyof MockDb], key).toEqual(value);
    }
    expect(result.version).toBe(7);
    expect(result.exampleFolders).toHaveLength(18);
    expect(result.exampleDocuments).toHaveLength(300);
    const { isMockDb } = await import('@/mock/db');
    expect(isMockDb(result)).toBe(true);
    expect(result).toMatchObject(createDirectorySeed(zh, result.users));
    expect(createMockDbMigrations(en)[6](source)).toMatchObject(createDirectorySeed(en, result.users));
  });

  it('writes v7, retains the v6 key until the next startup and grants only the auto-grant role', async () => {
    const serialized = JSON.stringify(v6);
    localStorage.setItem('pilot-admin:mock-db:v6', serialized);
    const { getMockDb } = await import('@/mock/db');
    expect(getMockDb()).toEqual(syncPermissionCatalog(migrations[6](v6) as MockDb).db);
    expect(localStorage.getItem('pilot-admin:mock-db:v6')).toBe(serialized);
    expect(JSON.parse(localStorage.getItem('pilot-admin:mock-db:v7')!)).toEqual(getMockDb());
    expect(getMockDb().roles.find((role) => role.id === 'role-admin')!.menuIds).toContain('directory-example');
    for (const id of ['role-operator', 'role-viewer']) expect(getMockDb().roles.find((role) => role.id === id)!.menuIds).not.toContain('directory-example');
    vi.resetModules();
    await import('@/mock/db');
    expect(localStorage.getItem('pilot-admin:mock-db:v6')).toBeNull();
  });

  it('uses the active locale at startup, and reset seeds v7 with default grants for every role', async () => {
    localStorage.setItem('pilot-admin:locale:v1', 'en-US');
    localStorage.setItem('pilot-admin:mock-db:v6', JSON.stringify(v6));
    const { getMockDb, resetMockDb } = await import('@/mock/db');
    expect(getMockDb().exampleFolders[0].name).toBe('Resources');
    resetMockDb();
    expect(getMockDb().version).toBe(7);
    for (const role of getMockDb().roles) expect(role.menuIds).toContain('directory-example');
    expect(getMockDb().exampleDocuments[0].name).toBe('User guide 001.pdf');
  });

  it('rejects invalid shapes and file bodies', async () => {
    const { getMockDb, isMockDb } = await import('@/mock/db');
    const db = getMockDb();
    for (const bad of [undefined, [{}], [{ ...db.exampleFolders[0], sort_no: '1' }], [{ ...db.exampleFolders[0], parent_id: 4 }]]) {
      expect(isMockDb({ ...db, exampleFolders: bad })).toBe(false);
    }
    for (const bad of [undefined, [{}], [{ ...db.exampleDocuments[0], size: -1 }], [{ ...db.exampleDocuments[0], type: 'exe' }], [{ ...db.exampleDocuments[0], create_date: null }], [{ ...db.exampleDocuments[0], content: 'never persist' }]]) {
      expect(isMockDb({ ...db, exampleDocuments: bad })).toBe(false);
    }
    expect(() => migrations[6]({ version: 5 })).toThrow(TypeError);
    expect(() => migrations[6]({ version: 6, users: [{}] })).toThrow(TypeError);
  });
});
