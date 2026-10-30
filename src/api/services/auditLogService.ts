import type { AuditLog, AuditModule, AuditResult, ApiResponse, PageResult } from '@/types';
import { getMockDb } from '@/mock/db';
import { requireMenu, requirePermission } from '@/mock/access';
import { delay, matchesKeyword, pageResult, response } from '@/mock/helpers';
import type { PageQuery } from './pagination';

export interface AuditFilters {
  keyword?: string;
  module?: AuditModule;
  result?: AuditResult;
}
const filteredLogs = (filters: AuditFilters) => getMockDb().auditLogs.filter((entry) => (
  (!filters.module || entry.module === filters.module)
  && (!filters.result || entry.result === filters.result)
  && matchesKeyword(filters.keyword, entry.actor_name, entry.target_name, entry.action, entry.trace_id)
));

export const auditLogService = {
  async getAuditLogs(params: AuditFilters & Pick<PageQuery, 'pageNo' | 'pageSize'> = {}): Promise<ApiResponse<PageResult<AuditLog>>> {
    await delay();
    requireMenu('/system/audit-logs');
    return response(pageResult(filteredLogs(params), params));
  },

  async countAuditLogs(filters: AuditFilters = {}): Promise<number> {
    await delay();
    requireMenu('/system/audit-logs');
    return filteredLogs(filters).length;
  },

  async exportAuditLogs(filters: AuditFilters = {}): Promise<AuditLog[]> {
    await delay();
    requireMenu('/system/audit-logs');
    requirePermission('audit-log:export');
    return structuredClone(filteredLogs(filters).slice(0, 5000));
  },
};
