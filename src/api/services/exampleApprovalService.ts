import { ApiRequestError } from '@/api/errors';
import { t } from '@/i18n';
import { requireMenu, requirePermission } from '@/mock/access';
import { delay, response } from '@/mock/helpers';
import type { ApiResponse } from '@/types';
import { createId } from '@/utils/id';
import { applyDecision, canDecide, validateComment, type ApprovalAction, type ApprovalCommentError, type ApprovalRequest } from './exampleApprovalRules';

export type { ApprovalRequest, ApprovalAction } from './exampleApprovalRules';
export type ApprovalDecisionResult = { success: true; request: ApprovalRequest } | { success: false; error: ApprovalCommentError };

const HOUR = 3600_000;
type SeedKey = 'r1' | 'r2' | 'r3' | 'r4';
const s = (key: SeedKey, field: string) => t(`exampleApproval.seed.${key}.${field}` as 'exampleApproval.seed.r1.title');

/** 初始数据按当前语言与当前时间生成；示例不写入 Mock DB。 */
export function createApprovalSeed(now = Date.now()): ApprovalRequest[] {
  const at = (hoursAgo: number) => new Date(now - hoursAgo * HOUR).toISOString();
  const manager = t('exampleApproval.seed.manager');
  const finance = t('exampleApproval.seed.finance');
  const base = (key: SeedKey, code: string, type: ApprovalRequest['type'], hoursAgo: number, items: number[]) => ({
    id: `apv-${key}`, code, type, title: s(key, 'title'), applicant: s(key, 'applicant'), department: s(key, 'department'), reason: s(key, 'reason'),
    items: items.map((amount, index) => ({ name: s(key, `item${index + 1}`), amount })), submittedAt: at(hoursAgo), version: 1,
  });
  const submit = (key: SeedKey, hoursAgo: number) => ({ id: `${key}-0`, action: 'submit' as const, node: 'submit' as const, actor: s(key, 'applicant'), comment: '', time: at(hoursAgo) });
  return [
    { ...base('r1', 'APV-202611-018', 'purchase', 5, [11_600, 1_000]), status: 'pending', node: 'manager', records: [submit('r1', 5)] },
    { ...base('r2', 'APV-202611-015', 'travel', 30, [1_106, 1_760, 414]), status: 'pending', node: 'finance', records: [submit('r2', 30),
      { id: 'r2-1', action: 'approve', node: 'manager', actor: manager, comment: t('exampleApproval.seed.travelApprove'), time: at(26) }] },
    { ...base('r3', 'APV-202611-009', 'subscription', 72, [8_400]), status: 'approved', node: null, records: [submit('r3', 72),
      { id: 'r3-1', action: 'approve', node: 'manager', actor: manager, comment: t('exampleApproval.seed.managerApprove'), time: at(70) },
      { id: 'r3-2', action: 'approve', node: 'finance', actor: finance, comment: t('exampleApproval.seed.financeApprove'), time: at(50) }] },
    { ...base('r4', 'APV-202611-004', 'event', 96, [2_000, 2_400, 600]), status: 'rejected', node: 'manager', records: [submit('r4', 96),
      { id: 'r4-1', action: 'reject', node: 'manager', actor: manager, comment: t('exampleApproval.seed.rejectBudget'), time: at(90) }] },
  ];
}

export const exampleApprovalService = {
  async list(): Promise<ApiResponse<ApprovalRequest[]>> {
    await delay();
    requireMenu('/examples/approval');
    return response(createApprovalSeed());
  },
  /** 无持久化的示例接口：服务端复核权限、状态与意见，返回流转后的申请。 */
  async decide(request: ApprovalRequest, action: ApprovalAction, comment: string): Promise<ApiResponse<ApprovalDecisionResult>> {
    await delay();
    requireMenu('/examples/approval');
    const user = requirePermission('example:update');
    if (!canDecide(request, action)) throw new ApiRequestError(t('exampleApproval.errors.stale'), 409);
    const error = validateComment(action, comment);
    if (error) return response({ success: false, error });
    return response({ success: true, request: applyDecision(request, action, user.user_name || user.login_name, comment, new Date().toISOString(), createId()) });
  },
};
