import { t } from '@/i18n';
import { ApiRequestError } from '@/api/errors';
import type { ApiResponse, AuditLog, ExampleProject, ExampleProjectStatus, PageResult, ProjectImportReceipt } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { requireMenu, requirePermission } from '@/mock/access';
import { recordAudit } from '@/mock/audit';
import { recordAuditFailure } from '@/mock/auditFailure';
import { createTraceId, delay, matchesKeyword, pageResult, response } from '@/mock/helpers';
import { createId } from '@/utils/id';
import { allowAuditParams } from '@/audit/catalog';
import { normalizeProjectInput, projectIssueFromCode, PROJECT_CODE_EXISTS, validateProjectInput, type ProjectInput, type ProjectIssue } from './exampleProjectRules';
import { capImportReceipts } from '@/mock/importReceipts';

// 模板：业务错误码供表单定位字段，不能比较服务端文案。
export { PROJECT_CODE_EXISTS } from './exampleProjectRules';
export type { ProjectInput } from './exampleProjectRules';
export interface ProjectFilters {
  keyword?: string;
  status?: ExampleProjectStatus;
}
export interface ProjectImportRow { rowNo: number; values: ProjectInput }
export interface ProjectImportResult {
  rowNo: number;
  status: 'created' | 'failed';
  projectId?: string;
  errorCode?: number;
  field?: keyof ProjectInput;
  message: string;
}
export type ProjectImportStatus = Pick<ProjectImportResult, 'rowNo' | 'status'>;
export interface ExampleProjectDetail extends ExampleProject {
  create_by_name: string;
  last_update_by_name: string;
}
export type ProjectHistoryEntry = Pick<AuditLog, 'id' | 'action' | 'module' | 'actor_name' | 'result' | 'reason' | 'create_date' | 'target_name' | 'params'>;

const filteredProjects = (filters: ProjectFilters) => getMockDb().exampleProjects.filter((project) => (
  matchesKeyword(filters.keyword, project.name, project.code, project.owner)
  && (!filters.status || project.status === filters.status)
));

function validate(input: ProjectInput, currentId?: string): ProjectInput {
  const issue = validateProjectInput(input);
  if (issue) throw new ApiRequestError(t(issue.message), 400, issue.code);
  if (getMockDb().exampleProjects.some((project) => project.code === input.code && project.id !== currentId)) {
    throw new ApiRequestError(t('serverErrors.example.codeExists'), 409, PROJECT_CODE_EXISTS);
  }
  return normalizeProjectInput(input);
}

const isImportId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const importResult = (receipt: ProjectImportReceipt): ProjectImportResult => {
  const issue = projectIssueFromCode(receipt.error_code);
  return {
    rowNo: receipt.row_no,
    status: receipt.status,
    ...(receipt.project_id ? { projectId: receipt.project_id } : {}),
    ...(receipt.error_code ? { errorCode: receipt.error_code } : {}),
    ...(issue ? { field: issue.field } : {}),
    message: t(receipt.status === 'created' ? 'exampleProjects.import.created' : issue?.message || 'exampleProjects.import.failed'),
  };
};

function findProject(id: string): ExampleProject {
  const project = getMockDb().exampleProjects.find((item) => item.id === id);
  if (!project) throw new ApiRequestError(t('serverErrors.example.notFound'), 404);
  return project;
}

export const exampleProjectService = {
  /** 只读预检；创建时仍重新检查，避免检查与提交之间的并发冲突。 */
  async checkCode(code: string): Promise<ApiResponse<{ available: boolean }>> {
    await delay();
    requirePermission('example:create');
    if (!/^[A-Z][A-Z0-9-]{1,19}$/.test(code)) {
      throw new ApiRequestError(t('serverErrors.example.invalidCode'), 400, 40012);
    }
    return response({ available: !getMockDb().exampleProjects.some((project) => project.code === code) });
  },

  async importProjects({ importId, rows }: { importId: string; rows: ProjectImportRow[] }): Promise<ApiResponse<ProjectImportResult[]>> {
    await delay();
    const actor = requirePermission('example:create');
    if (!isImportId(importId) || !Array.isArray(rows) || rows.length < 1 || rows.length > 25
      || rows.some((row) => !Number.isSafeInteger(row.rowNo) || row.rowNo < 1)
      || new Set(rows.map((row) => row.rowNo)).size !== rows.length) {
      throw new ApiRequestError(t('serverErrors.example.invalidImport'), 400);
    }
    const traceId = createTraceId();
    const results: ProjectImportResult[] = [];
    // 整批业务、回执和审计只提交一次；抛错时不另写失败审计，保证零提交。
    updateMockDb((db) => {
      const receipts = new Map(db.importReceipts.filter((item) => item.import_id === importId).map((item) => [item.row_no, item]));
      const codes = new Set(db.exampleProjects.map((project) => project.code));
      let count = 0;
      let failed = 0;
      for (const row of rows) {
        const previous = receipts.get(row.rowNo);
        if (previous) {
          results.push(importResult(previous));
          continue;
        }
        let issue: ProjectIssue | undefined = validateProjectInput(row.values);
        if (!issue && codes.has(row.values.code)) {
          issue = {
            field: 'code',
            code: PROJECT_CODE_EXISTS,
            message: 'serverErrors.example.codeExists',
          };
        }
        const date = new Date().toISOString();
        const receipt: ProjectImportReceipt = {
          import_id: importId,
          row_no: row.rowNo,
          status: issue ? 'failed' : 'created',
          actor_id: actor.id,
          create_date: date,
        };
        if (issue) {
          receipt.error_code = issue.code;
          failed += 1;
        } else {
          const project: ExampleProject = {
            ...normalizeProjectInput(row.values),
            id: `project-${createId()}`,
            create_by: actor.id,
            create_date: date,
            last_update_by: actor.id,
            last_update_date: date,
          };
          db.exampleProjects.unshift(project);
          codes.add(project.code);
          receipt.project_id = project.id;
          count += 1;
        }
        db.importReceipts.unshift(receipt);
        receipts.set(row.rowNo, receipt);
        results.push(importResult(receipt));
      }
      db.importReceipts = capImportReceipts(db.importReceipts);
      // 整批都是回执重放时没有新处理的行，不写空审计。
      if (count + failed > 0) {
        recordAudit(db, {
          actor,
          action: 'example.import',
          params: {
            count,
            failed,
          },
          traceId,
        });
      }
    });
    return response(results, traceId);
  },

  async getImportStatus(importId: string): Promise<ApiResponse<ProjectImportStatus[]>> {
    await delay();
    requirePermission('example:create');
    if (!isImportId(importId)) throw new ApiRequestError(t('serverErrors.example.invalidImport'), 400);
    return response(getMockDb().importReceipts.filter((item) => item.import_id === importId)
      .map((item) => ({ rowNo: item.row_no, status: item.status })));
  },

  async getProject(id: string): Promise<ApiResponse<ExampleProjectDetail>> {
    await delay();
    requireMenu('/examples/crud');
    const project = findProject(id);
    const actorName = (userId: string) => userId === 'system'
      ? t('exampleProjects.detail.systemActor')
      : getMockDb().users.find((user) => user.id === userId)?.user_name || userId;
    return response({
      ...project,
      create_by_name: actorName(project.create_by),
      last_update_by_name: actorName(project.last_update_by),
    });
  },

  async getProjectHistory(id: string, query: { pageNo?: number; pageSize?: number } = {}): Promise<ApiResponse<PageResult<ProjectHistoryEntry>>> {
    await delay();
    requireMenu('/examples/crud');
    findProject(id);
    const entries = getMockDb().auditLogs
      .filter((entry) => entry.target_type === 'example' && entry.target_id === id)
      .sort((a, b) => Date.parse(b.create_date) - Date.parse(a.create_date) || b.id.localeCompare(a.id))
      .map((entry): ProjectHistoryEntry => ({
        id: entry.id,
        action: entry.action,
        module: entry.module,
        actor_name: entry.actor_name,
        result: entry.result,
        reason: entry.reason,
        create_date: entry.create_date,
        target_name: entry.target_name,
        params: allowAuditParams(entry.action, entry.params),
      }));
    return response(pageResult(entries, query));
  },

  async getProjects(params: ProjectFilters & { pageNo?: number; pageSize?: number } = {}): Promise<ApiResponse<PageResult<ExampleProject>>> {
    await delay();
    requireMenu('/examples/crud');
    return response(pageResult(filteredProjects(params), { pageNo: params.pageNo, pageSize: params.pageSize }));
  },

  async countProjects(filters: ProjectFilters = {}): Promise<number> {
    await delay();
    requireMenu('/examples/crud');
    return filteredProjects(filters).length;
  },

  async createProject(input: ProjectInput): Promise<ApiResponse<ExampleProject>> {
    try {
      await delay();
      const actor = requirePermission('example:create');
      const values = validate(input);
      const date = new Date().toISOString();
      const project: ExampleProject = {
        ...values,
        id: `project-${createId()}`,
        create_by: actor.id,
        create_date: date,
        last_update_by: actor.id,
        last_update_date: date,
      };
      const traceId = createTraceId();
      updateMockDb((db) => {
        db.exampleProjects.unshift(project);
        recordAudit(db, {
          actor,
          action: 'example.create',
          target_type: 'example',
          target_id: project.id,
          target_name: project.name,
          traceId,
        });
      });
      return response(project, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'example.create',
        target_type: 'example',
        target_name: input.name,
      }));
      throw error;
    }
  },

  async updateProject(id: string, input: ProjectInput): Promise<ApiResponse<ExampleProject>> {
    try {
      await delay();
      const actor = requirePermission('example:update');
      findProject(id);
      const values = validate(input, id);
      const traceId = createTraceId();
      updateMockDb((db) => {
        const project = db.exampleProjects.find((item) => item.id === id)!;
        Object.assign(project, values, {
          last_update_by: actor.id,
          last_update_date: new Date().toISOString(),
        });
        recordAudit(db, {
          actor,
          action: 'example.update',
          target_type: 'example',
          target_id: id,
          target_name: project.name,
          traceId,
        });
      });
      return response(findProject(id), traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'example.update',
        target_type: 'example',
        target_id: id,
        target_name: getMockDb().exampleProjects.find((item) => item.id === id)?.name,
      }));
      throw error;
    }
  },

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    try {
      await delay();
      const actor = requirePermission('example:delete');
      const project = findProject(id);
      const traceId = createTraceId();
      updateMockDb((db) => {
        db.exampleProjects = db.exampleProjects.filter((item) => item.id !== id);
        recordAudit(db, {
          actor,
          action: 'example.delete',
          target_type: 'example',
          target_id: id,
          target_name: project.name,
          traceId,
        });
      });
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'example.delete',
        target_type: 'example',
        target_id: id,
        target_name: getMockDb().exampleProjects.find((item) => item.id === id)?.name,
      }));
      throw error;
    }
  },

  async batchDeleteProjects(ids: string[]): Promise<ApiResponse<void>> {
    const selected = [...new Set(ids)];
    try {
      await delay();
      const actor = requirePermission('example:delete');
      if (!ids.length || ids.length > 100) throw new ApiRequestError(t('serverErrors.example.batchLimit'), 400);
      // 模板：全部验证后再提交，任一目标失效时不做部分删除。
      selected.forEach(findProject);
      const traceId = createTraceId();
      updateMockDb((db) => {
        db.exampleProjects = db.exampleProjects.filter((item) => !selected.includes(item.id));
        recordAudit(db, {
          actor,
          action: 'example.batch_delete',
          params: { count: selected.length },
          traceId,
        });
      });
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'example.batch_delete',
        params: { count: selected.length },
      }));
      throw error;
    }
  },

  async exportProjects(filters: ProjectFilters = {}): Promise<ExampleProject[]> {
    await delay();
    // 模板：这里有意只检查页面访问；独立导出权限可参考 auditLogService。
    requireMenu('/examples/crud');
    return structuredClone(filteredProjects(filters).slice(0, 5000));
  },
};
