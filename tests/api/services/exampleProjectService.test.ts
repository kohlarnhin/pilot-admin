import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLog } from '@/types';

vi.mock('@/mock/helpers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/mock/helpers')>(),
  delay: () => Promise.resolve(),
}));

let db: typeof import('@/mock/db');
let service: typeof import('@/api/services/exampleProjectService')['exampleProjectService'];

beforeEach(async () => {
  localStorage.setItem('pilot-admin:auth:tokens:v2', JSON.stringify({ accessToken: `mock.${btoa(JSON.stringify({ sub: 'u-0003' }))}.local`, refreshToken: 'test' }));
  vi.resetModules();
  db = await import('@/mock/db');
  service = (await import('@/api/services/exampleProjectService')).exampleProjectService;
});

const historyEntry = (id: string, overrides: Partial<AuditLog> = {}): AuditLog => ({
  id,
  action: 'example.update',
  module: 'example',
  actor_id: 'private-actor-id',
  actor_name: 'Operator',
  trace_id: 'private-trace',
  target_type: 'example',
  target_id: 'project-001',
  target_name: 'Project',
  result: 'success',
  create_date: '2026-10-30T10:00:00Z',
  ...overrides,
});

describe('project detail service', () => {
  it('checks code availability without modifying data and enforces create permission on every call', async () => {
    await expect(service.checkCode('PRJ-001')).rejects.toMatchObject({ status: 403 });
    const { saveStoredTokens } = await import('@/api/tokenStorage');
    saveStoredTokens({ accessToken: `mock.${btoa(JSON.stringify({ sub: 'u-0001' }))}.local`, refreshToken: 'admin' });
    const previous = structuredClone(db.getMockDb());
    const stored = localStorage.getItem('pilot-admin:mock-db:v7');
    expect((await service.checkCode('PRJ-001')).data.available).toBe(false);
    expect((await service.checkCode('UNIQUE-CODE')).data.available).toBe(true);
    await expect(service.checkCode('invalid code')).rejects.toMatchObject({ status: 400, code: 40012 });
    expect(db.getMockDb()).toEqual(previous);
    expect(localStorage.getItem('pilot-admin:mock-db:v7')).toBe(stored);
  });

  it('returns a record clone and an inline-compatible 404 for an unknown id', async () => {
    const result = await service.getProject('project-001');
    expect(result.data.id).toBe('project-001');
    result.data.name = 'Cannot mutate DB';
    expect(db.getMockDb().exampleProjects[0].name).not.toBe('Cannot mutate DB');
    await expect(service.getProject('unknown')).rejects.toMatchObject({ status: 404 });
  });

  it('projects current display names only on the detail response, preserving actor ids', async () => {
    db.updateMockDb((draft) => {
      draft.users.find((user) => user.id === 'u-0001')!.user_name = 'Creator display name';
      draft.users.find((user) => user.id === 'u-0002')!.user_name = 'Updater display name';
      draft.exampleProjects[0].create_by = 'u-0001';
      draft.exampleProjects[0].last_update_by = 'u-0002';
    });
    const detail = (await service.getProject('project-001')).data;
    expect(detail).toMatchObject({
      create_by: 'u-0001',
      create_by_name: 'Creator display name',
      last_update_by: 'u-0002',
      last_update_by_name: 'Updater display name',
    });
    const stored = db.getMockDb().exampleProjects[0];
    const listed = (await service.getProjects()).data.records.find((project) => project.id === stored.id);
    for (const project of [stored, listed]) {
      expect(project).not.toHaveProperty('create_by_name');
      expect(project).not.toHaveProperty('last_update_by_name');
    }
  });

  it.each([['zh-CN', '系统'], ['en-US', 'System']] as const)('localizes system actors in %s', async (locale, label) => {
    const { setLocale } = await import('@/i18n');
    await setLocale(locale);
    db.updateMockDb((draft) => {
      draft.exampleProjects[0].create_by = 'system';
      draft.exampleProjects[0].last_update_by = 'system';
    });
    expect((await service.getProject('project-001')).data).toMatchObject({
      create_by_name: label,
      last_update_by_name: label,
    });
  });

  it('falls back to the actor id for deleted and unknown users', async () => {
    db.updateMockDb((draft) => {
      draft.users = draft.users.filter((user) => user.id !== 'u-0004');
      draft.exampleProjects[0].create_by = 'u-0004';
      draft.exampleProjects[0].last_update_by = 'unknown-user';
    });
    expect((await service.getProject('project-001')).data).toMatchObject({
      create_by_name: 'u-0004',
      last_update_by_name: 'unknown-user',
    });
  });

  it('filters history by both target type and id, orders by time and pages the projection', async () => {
    db.updateMockDb((draft) => {
      draft.auditLogs = [
        historyEntry('early', { create_date: '2026-10-30T12:00:00+08:00' }),
        historyEntry('latest', { create_date: '2026-10-30T10:00:00Z' }),
        historyEntry('other-id', { target_id: 'project-002' }),
        historyEntry('other-type', { target_type: 'user' }),
      ];
    });
    const first = await service.getProjectHistory('project-001', { pageNo: 1, pageSize: 1 });
    expect(first.data).toMatchObject({ total: 2, hasNext: true, pageNo: 1, pageSize: 1 });
    expect(first.data.records.map((entry) => entry.id)).toEqual(['latest']);
    const second = await service.getProjectHistory('project-001', { pageNo: 2, pageSize: 1 });
    expect(second.data.records.map((entry) => entry.id)).toEqual(['early']);
    expect(second.data.hasNext).toBe(false);
  });

  it('exposes only display fields and action-whitelisted params, with no audit-log grant needed', async () => {
    db.updateMockDb((draft) => {
      const entry = historyEntry('safe', { action: 'example.batch_delete', params: { count: 3 } });
      Object.assign(entry.params!, { rawDescription: 'never expose' });
      Object.assign(entry, { secret: 'never expose' });
      draft.auditLogs = [entry];
    });
    const result = (await service.getProjectHistory('project-001')).data.records[0];
    expect(Object.keys(result).sort()).toEqual(['id', 'action', 'module', 'actor_name', 'result', 'reason', 'create_date', 'target_name', 'params'].sort());
    expect(result.params).toEqual({ count: 3 });
    expect(JSON.stringify(result)).not.toContain('never expose');
    expect(JSON.stringify(result)).not.toContain('private-');
  });

  it('denies both detail and history without the owning menu', async () => {
    db.updateMockDb((draft) => {
      draft.roles.find((role) => role.id === 'role-viewer')!.menuIds = [];
    });
    await expect(service.getProject('project-001')).rejects.toMatchObject({ status: 403 });
    await expect(service.getProjectHistory('project-001')).rejects.toMatchObject({ status: 403 });
  });

  it.each(['create', 'update'] as const)('allows 1000 characters and rejects 1001 on %s', async (operation) => {
    const { saveStoredTokens } = await import('@/api/tokenStorage');
    saveStoredTokens({ accessToken: `mock.${btoa(JSON.stringify({ sub: 'u-0001' }))}.local`, refreshToken: 'admin' });
    const input = { name: 'Long description', code: 'LONG-TEST', owner: 'Alice', status: 'active' as const, description: 'a'.repeat(1000) };
    const write = (description: string) => operation === 'create'
      ? service.createProject({ ...input, description })
      : service.updateProject('project-001', { ...input, description });
    const valid = await write(input.description);
    expect(valid.data.description).toHaveLength(1000);
    await expect(write('a'.repeat(1001))).rejects.toMatchObject({ status: 400 });
    expect(db.getMockDb().exampleProjects.find((project) => project.id === valid.data.id)?.description).toHaveLength(1000);
  });
});
