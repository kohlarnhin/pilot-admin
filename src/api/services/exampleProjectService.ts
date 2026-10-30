import { t } from '@/i18n';
import { ApiRequestError } from '@/api/http';
import type { ApiResponse, ExampleProject, ExampleProjectStatus, PageResult } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { requireMenu, requirePermission } from '@/mock/access';
import { recordAudit } from '@/mock/audit';
import { recordAuditFailure } from '@/mock/auditFailure';
import { createTraceId, delay, matchesKeyword, pageResult, response } from '@/mock/helpers';

// 模板：业务错误码供表单定位字段，不能比较服务端文案。
export const PROJECT_CODE_EXISTS = 40901;
export interface ProjectFilters {
  keyword?: string;
  status?: ExampleProjectStatus;
}
export type ProjectInput = Pick<ExampleProject, 'name' | 'code' | 'owner' | 'status' | 'description'>;

const filteredProjects = (filters: ProjectFilters) => getMockDb().exampleProjects.filter((project) => (
  matchesKeyword(filters.keyword, project.name, project.code, project.owner)
  && (!filters.status || project.status === filters.status)
));

function validate(input: ProjectInput, currentId?: string): ProjectInput {
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 60) {
    throw new ApiRequestError(t('serverErrors.example.invalidName'), 400);
  }
  if (typeof input.code !== 'string' || !/^[A-Z][A-Z0-9-]{1,19}$/.test(input.code)) {
    throw new ApiRequestError(t('serverErrors.example.invalidCode'), 400);
  }
  if (typeof input.owner !== 'string' || !input.owner.trim() || input.owner.trim().length > 40) {
    throw new ApiRequestError(t('serverErrors.example.invalidOwner'), 400);
  }
  if (!['active', 'paused', 'archived'].includes(input.status)) {
    throw new ApiRequestError(t('serverErrors.example.invalidStatus'), 400);
  }
  if (input.description !== undefined && (typeof input.description !== 'string' || input.description.length > 200)) {
    throw new ApiRequestError(t('serverErrors.example.invalidDescription'), 400);
  }
  if (getMockDb().exampleProjects.some((project) => project.code === input.code && project.id !== currentId)) {
    throw new ApiRequestError(t('serverErrors.example.codeExists'), 409, PROJECT_CODE_EXISTS);
  }
  return {
    name: input.name.trim(),
    code: input.code,
    owner: input.owner.trim(),
    status: input.status,
    description: input.description?.trim(),
  };
}

function getProject(id: string): ExampleProject {
  const project = getMockDb().exampleProjects.find((item) => item.id === id);
  if (!project) throw new ApiRequestError(t('serverErrors.example.notFound'), 404);
  return project;
}

export const exampleProjectService = {
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
        id: `project-${crypto.randomUUID()}`,
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
      getProject(id);
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
      return response(getProject(id), traceId);
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
      const project = getProject(id);
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
      selected.forEach(getProject);
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
