import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/mock/helpers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/mock/helpers')>(),
  delay: () => Promise.resolve(),
}));

let db: typeof import('@/mock/db');
let service: typeof import('@/api/services/exampleDirectoryService')['exampleDirectoryService'];

beforeEach(async () => {
  localStorage.setItem('pilot-admin:auth:tokens:v2', JSON.stringify({ accessToken: `mock.${btoa(JSON.stringify({ sub: 'u-0003' }))}.local`, refreshToken: 'test' }));
  vi.resetModules();
  db = await import('@/mock/db');
  service = (await import('@/api/services/exampleDirectoryService')).exampleDirectoryService;
});

describe('read-only directory service', () => {
  it('filters a full subtree and pages in stable updated order', async () => {
    const result = (await service.getDocuments({ folderId: 'folder-02', pageNo: 1, pageSize: 200 })).data;
    expect(result.records.every((document) => ['folder-02', 'folder-03', 'folder-04'].includes(document.folder_id))).toBe(true);
    expect(new Set(result.records.map((document) => document.folder_id)).size).toBe(3);
    expect(result.total).toBe(160);
    expect(result.hasNext).toBe(false);
    const first = (await service.getDocuments({ folderId: 'folder-03', pageSize: 20 })).data;
    const next = (await service.getDocuments({ folderId: 'folder-03', pageNo: 2, pageSize: 20 })).data;
    expect(first).toMatchObject({ total: 140, hasNext: true, pageNo: 1, pageSize: 20 });
    expect(new Set([...first.records, ...next.records].map((document) => document.id)).size).toBe(40);
    expect(first.records[0].id).toBe('document-001');
    expect(next.records[0].id).toBe('document-021');
  });

  it('returns direct and subtree counts, including the empty folder', async () => {
    const folders = (await service.getFolders()).data;
    for (const folder of folders) {
      expect(folder.directCount).toBe(db.getMockDb().exampleDocuments.filter((document) => document.folder_id === folder.id).length);
      expect(await service.countDocuments({ folderId: folder.id })).toBe(folder.documentCount);
    }
    expect(folders.reduce((sum, folder) => sum + folder.directCount, 0)).toBe(300);
    expect(await service.countDocuments()).toBe(300);
    expect((await service.getDocuments({ folderId: 'folder-12' })).data).toMatchObject({ total: 0, records: [], hasNext: false });
  });

  it('combines folder, name and owner keyword filters, ignoring case and whitespace', async () => {
    db.updateMockDb((draft) => { draft.users[0].user_name = 'Alice Example'; });
    expect(await service.countDocuments({ keyword: ' alice EXAMPLE ' })).toBeGreaterThan(0);
    const result = (await service.getDocuments({ folderId: 'folder-02', keyword: '001 ALICE' })).data;
    expect(result.records.map((document) => document.id)).toEqual(['document-001']);
    expect(await service.countDocuments({ folderId: 'folder-02', keyword: '001 ALICE' })).toBe(1);
    expect(await service.countDocuments({ folderId: 'folder-07', keyword: '001 ALICE' })).toBe(0);
    expect(await service.countDocuments({ keyword: 'no-such-document' })).toBe(0);
  });

  it('projects owner names and relative folder paths, falling back to missing owner ids, without mutating the DB', async () => {
    db.updateMockDb((draft) => { draft.exampleDocuments[0].owner_id = 'deleted-user'; });
    const projected = (await service.getDocuments({ folderId: 'folder-02' })).data.records[0];
    expect(projected).toMatchObject({ owner_name: 'deleted-user', folder_path: '指南 / 入门' });
    expect((await service.getDocuments({ folderId: 'folder-03' })).data.records[0].folder_path).toBe('入门');
    expect((await service.getDocuments()).data.records[0].folder_path).toBe('资源 / 指南 / 入门');
    projected.name = 'cannot mutate';
    expect(db.getMockDb().exampleDocuments[0].name).not.toBe('cannot mutate');
    expect(db.getMockDb().exampleDocuments[0]).not.toHaveProperty('folder_path');
    expect(db.getMockDb().exampleDocuments[0]).not.toHaveProperty('owner_name');
  });

  it.each([['zh-CN', '目录不存在或已被删除'], ['en-US', 'The folder does not exist or has been deleted']] as const)('returns localized 404 in %s for unknown folder ids', async (locale, message) => {
    await (await import('@/i18n')).setLocale(locale);
    await expect(service.getDocuments({ folderId: 'unknown' })).rejects.toMatchObject({ status: 404, message });
    await expect(service.countDocuments({ folderId: '' })).rejects.toMatchObject({ status: 404, message });
  });

  it('rechecks menu permission on every operation, before exposing folder existence', async () => {
    db.updateMockDb((draft) => { draft.roles.find((role) => role.id === 'role-viewer')!.menuIds = []; });
    await expect(service.getFolders()).rejects.toMatchObject({ status: 403 });
    await expect(service.getDocuments({ folderId: 'unknown' })).rejects.toMatchObject({ status: 403 });
    await expect(service.countDocuments()).rejects.toMatchObject({ status: 403 });
  });
});
