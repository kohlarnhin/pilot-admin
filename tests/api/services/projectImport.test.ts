import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createId } from '@/utils/id';
import { PROJECT_CODE_EXISTS, PROJECT_RULES, validateProjectInput, type ProjectInput } from '@/api/services/exampleProjectRules';
import { previewProjectCsv, runProjectImport } from '@/pages/examples/crud/projectImport';
import type { ProjectImportResult } from '@/api/services/exampleProjectService';
import { capImportReceipts } from '@/mock/importReceipts';

vi.mock('@/mock/helpers', async (original) => ({
  ...await original<typeof import('@/mock/helpers')>(),
  delay: () => Promise.resolve(),
}));

let db: typeof import('@/mock/db');
let service: typeof import('@/api/services/exampleProjectService')['exampleProjectService'];
const values = (code = 'IMPORT-ONE'): ProjectInput => ({ name: 'Imported', code, owner: 'Alice', status: 'active', description: 'Literal text' });
const login = (id: string) => localStorage.setItem('pilot-admin:auth:tokens:v2', JSON.stringify({ accessToken: `mock.${btoa(JSON.stringify({ sub: id }))}.local`, refreshToken: 'test' }));
const switchUser = async (id: string) => {
  const { saveStoredTokens } = await import('@/api/tokenStorage');
  saveStoredTokens({ accessToken: `mock.${btoa(JSON.stringify({ sub: id }))}.local`, refreshToken: 'test' });
};

beforeEach(async () => {
  login('u-0001');
  vi.resetModules();
  db = await import('@/mock/db');
  service = (await import('@/api/services/exampleProjectService')).exampleProjectService;
});

describe('project import service', () => {
  it('returns individual successes and failures, covering DB, within-chunk and cross-chunk duplicates', async () => {
    const importId = createId();
    const before = db.getMockDb().exampleProjects.length;
    const auditBefore = db.getMockDb().auditLogs.length;
    const result = (await service.importProjects({ importId, rows: [
      { rowNo: 2, values: values() },
      { rowNo: 3, values: { ...values('OTHER'), owner: '' } },
      { rowNo: 4, values: values() },
      { rowNo: 5, values: values('PRJ-001') },
    ] })).data;
    expect(result.map((row) => row.status)).toEqual(['created', 'failed', 'failed', 'failed']);
    expect(result[1]).toMatchObject({ field: 'owner', errorCode: PROJECT_RULES.owner.code });
    expect(result[2].errorCode).toBe(PROJECT_CODE_EXISTS);
    expect(result[3].errorCode).toBe(PROJECT_CODE_EXISTS);
    const next = await service.importProjects({ importId, rows: [{ rowNo: 6, values: values() }] });
    expect(next.data[0]).toMatchObject({ status: 'failed', errorCode: PROJECT_CODE_EXISTS });
    expect(db.getMockDb().exampleProjects).toHaveLength(before + 1);
    expect(db.getMockDb().auditLogs).toHaveLength(auditBefore + 2);
    const audit = db.getMockDb().auditLogs.slice(0, 2);
    expect(audit).toHaveLength(2);
    expect(audit[0].params).toEqual({ count: 0, failed: 1 });
    expect(audit[1].params).toEqual({ count: 1, failed: 3 });
    expect(JSON.stringify(audit)).not.toContain('Literal text');
    expect(db.isMockDb(db.getMockDb())).toBe(true);
  });

  it('replays receipts unchanged after a lost response, even if input changes or a project is deleted', async () => {
    const input = { importId: createId(), rows: [{ rowNo: 2, values: values() }, { rowNo: 3, values: values('PRJ-001') }] };
    const first = await service.importProjects(input);
    const receipts = structuredClone(db.getMockDb().importReceipts);
    db.updateMockDb((draft) => { draft.exampleProjects = draft.exampleProjects.filter((project) => project.id !== first.data[0].projectId); });
    const length = db.getMockDb().exampleProjects.length;
    const auditLength = db.getMockDb().auditLogs.length;
    input.rows[0].values.name = 'Changed on replay';
    expect((await service.importProjects(input)).data).toEqual(first.data);
    expect(db.getMockDb().exampleProjects).toHaveLength(length);
    expect(db.getMockDb().importReceipts).toEqual(receipts);
    // 纯重放没有新处理的行，不写空审计。
    expect(db.getMockDb().auditLogs).toHaveLength(auditLength);
    expect((await service.getImportStatus(input.importId)).data.sort((a, b) => a.rowNo - b.rowNo)).toEqual([
      { rowNo: 2, status: 'created' }, { rowNo: 3, status: 'failed' },
    ]);
    expect((await service.getImportStatus(createId())).data).toEqual([]);
  });

  it('commits nothing when persistence fails, including projects, receipts and audit', async () => {
    const before = db.getMockDb();
    const stored = localStorage.getItem(db.MOCK_DB_KEY);
    const failure = new DOMException('Quota exceeded', 'QuotaExceededError');
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw failure; });
    await expect(service.importProjects({ importId: createId(), rows: [{ rowNo: 2, values: values() }] })).rejects.toThrow(failure);
    expect(db.getMockDb()).toBe(before);
    expect(localStorage.getItem(db.MOCK_DB_KEY)).toBe(stored);
  });

  it('keeps the first chunk and reconciles before resuming after the second updateMockDb throws', async () => {
    const importId = createId();
    const rows = Array.from({ length: 60 }, (_, i) => ({ rowNo: i + 2, values: values(`CHUNK-${i}`) }));
    let known = new Map<number, ProjectImportResult>();
    const onResults = (next: Map<number, ProjectImportResult>) => { known = next; };
    const original = db.updateMockDb;
    let writes = 0;
    const spy = vi.spyOn(db, 'updateMockDb').mockImplementation((update) => {
      if (++writes === 2) throw new Error('Connection lost');
      original(update);
    });
    await expect(runProjectImport(service, { importId, rows, known, reconcile: false, onResults })).rejects.toThrow('Connection lost');
    expect(known.size).toBe(25);
    expect(db.getMockDb().importReceipts).toHaveLength(25);
    spy.mockRestore();
    const status = vi.spyOn(service, 'getImportStatus');
    const submit = vi.spyOn(service, 'importProjects');
    await runProjectImport(service, { importId, rows, known, reconcile: true, onResults });
    expect(status).toHaveBeenCalledOnce();
    expect(submit.mock.calls.map(([input]) => input.rows.length)).toEqual([25, 10]);
    expect(known.size).toBe(60);
    expect(db.getMockDb().exampleProjects.filter((project) => project.code.startsWith('CHUNK-'))).toHaveLength(60);
  });

  it('reconciles a committed chunk whose response was lost, then submits only the remainder', async () => {
    const importId = createId();
    const rows = Array.from({ length: 30 }, (_, i) => ({ rowNo: i + 2, values: values(`LOST-${i}`) }));
    await service.importProjects({ importId, rows: rows.slice(0, 25) });
    const submit = vi.spyOn(service, 'importProjects');
    let known = new Map<number, ProjectImportResult>();
    await runProjectImport(service, { importId, rows, known, reconcile: true, onResults: (next) => { known = next; } });
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0][0].rows.map((row) => row.rowNo)).toEqual([27, 28, 29, 30, 31]);
    expect(known.size).toBe(30);
  });

  it('denies viewers and stale builds without committing even a failure audit', async () => {
    await switchUser('u-0003');
    const before = db.getMockDb();
    await expect(service.importProjects({ importId: createId(), rows: [{ rowNo: 2, values: values() }] })).rejects.toMatchObject({ status: 403 });
    await expect(service.getImportStatus(createId())).rejects.toMatchObject({ status: 403 });
    expect(db.getMockDb()).toBe(before);
    await switchUser('u-0001');
    localStorage.setItem('pilot-admin:mock-db:v7', 'newer');
    await expect(service.importProjects({ importId: createId(), rows: [{ rowNo: 2, values: values() }] })).rejects.toMatchObject({ code: 40990 });
    expect(db.getMockDb()).toBe(before);
  });

  it('allows operators and stores literal formula strings and apostrophes', async () => {
    await switchUser('u-0002');
    const result = await service.importProjects({ importId: createId(), rows: [{ rowNo: 2, values: { ...values(), name: '=1+1', owner: "'Alice", description: '+literal' } }] });
    expect(result.data[0].status).toBe('created');
    expect(db.getMockDb().exampleProjects[0]).toMatchObject({ name: '=1+1', owner: "'Alice", description: '+literal' });
    expect(Object.keys(db.getMockDb().importReceipts[0]).sort()).toEqual(['import_id', 'row_no', 'status', 'project_id', 'actor_id', 'create_date'].sort());
  });

  it('enforces receipt retention during actual imports', async () => {
    const oldIds = Array.from({ length: 20 }, createId);
    db.updateMockDb((draft) => {
      draft.importReceipts = oldIds.map((import_id) => ({ import_id, row_no: 2, status: 'created', project_id: 'deleted-project', actor_id: 'u-0001', create_date: '2026-11-01T00:00:00Z' }));
    });
    const importId = createId();
    await service.importProjects({ importId, rows: [{ rowNo: 2, values: values() }] });
    expect(new Set(db.getMockDb().importReceipts.map((row) => row.import_id)).size).toBe(20);
    expect(db.getMockDb().importReceipts.some((row) => row.import_id === oldIds[19])).toBe(false);
    expect((await service.getImportStatus(oldIds[19])).data).toEqual([]);
    db.updateMockDb((draft) => {
      draft.importReceipts = Array.from({ length: 5000 }, (_, i) => ({ import_id: importId, row_no: i + 100, status: 'failed', error_code: PROJECT_CODE_EXISTS, actor_id: 'u-0001', create_date: '2026-11-01T00:00:00Z' }));
    });
    await service.importProjects({ importId: createId(), rows: [{ rowNo: 2, values: values('CAPPED-NEW') }] });
    expect(db.getMockDb().importReceipts).toHaveLength(5000);
    expect(db.getMockDb().importReceipts[0].status).toBe('created');
    expect(db.isMockDb(db.getMockDb())).toBe(true);
  });

  it.each([
    { importId: 'not-an-id', rows: [{ rowNo: 2, values: values() }] },
    { importId: createId(), rows: [] },
    { importId: createId(), rows: Array.from({ length: 26 }, (_, i) => ({ rowNo: i + 1, values: values() })) },
    { importId: createId(), rows: [{ rowNo: 0, values: values() }] },
    { importId: createId(), rows: [{ rowNo: 2, values: values() }, { rowNo: 2, values: values() }] },
  ])('rejects malformed requests without writes', async (input) => {
    const before = db.getMockDb();
    await expect(service.importProjects(input)).rejects.toMatchObject({ status: 400 });
    expect(db.getMockDb()).toBe(before);
  });
});

describe('shared field rules and preview', () => {
  it.each([
    { name: '' }, { name: 'x'.repeat(61) }, { code: 'lower' }, { code: 'A' },
    { owner: '' }, { owner: 'x'.repeat(41) }, { status: 'unknown' }, { description: 'x'.repeat(1001) },
  ])('has identical field rejection in preview, create and import: %j', async (patch) => {
    const input = { ...values(), ...patch } as ProjectInput;
    const issue = validateProjectInput(input)!;
    const preview = previewProjectCsv(`name,code,owner,status,description\n${input.name},${input.code},${input.owner},${input.status},${input.description}`);
    expect(preview[0].issue).toEqual(issue);
    await expect(service.createProject(input)).rejects.toMatchObject({ code: issue.code });
    expect((await service.importProjects({ importId: createId(), rows: [{ rowNo: 2, values: input }] })).data[0]).toMatchObject({ status: 'failed', field: issue.field, errorCode: issue.code });
  });
  it('marks only later valid duplicates as skipped and detects uneven columns', () => {
    const rows = previewProjectCsv('name,code,owner,status\nBad,ONE,,active\nGood,ONE,Alice,active\nDuplicate,ONE,Alice,active\nUneven,TWO,Alice,active,extra');
    expect(rows.map((row) => typeof row.issue === 'object' ? row.issue.field : row.issue)).toEqual(['owner', undefined, 'duplicate', 'columns']);
  });
});

describe('receipt retention', () => {
  const receipt = (import_id: string, row_no = 1) => ({ import_id, row_no, status: 'created' as const, project_id: 'p', actor_id: 'u', create_date: '2026-11-01T00:00:00Z' });
  it('keeps the newest 20 distinct import IDs and at most 5000 rows', () => {
    const items = Array.from({ length: 22 }, (_, i) => receipt(`import-${i}`));
    const capped = capImportReceipts(items);
    expect(capped.map((item) => item.import_id)).toEqual(items.slice(0, 20).map((item) => item.import_id));
    expect(capImportReceipts(Array.from({ length: 5001 }, (_, i) => receipt('same', i + 1)))).toHaveLength(5000);
  });
});
