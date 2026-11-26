import type { MessageKey } from '@/i18n';

export type ApprovalType = 'purchase' | 'travel' | 'subscription' | 'event';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export const APPROVAL_NODES = ['manager', 'finance'] as const;
export type ApprovalNode = typeof APPROVAL_NODES[number];
export type ApprovalAction = 'approve' | 'reject' | 'resubmit';

export interface ApprovalRecord {
  id: string;
  action: 'submit' | ApprovalAction;
  node: 'submit' | ApprovalNode;
  actor: string;
  comment: string;
  time: string;
}

export interface ApprovalItem { name: string; amount: number }

export interface ApprovalRequest {
  id: string;
  code: string;
  type: ApprovalType;
  title: string;
  applicant: string;
  department: string;
  reason: string;
  items: ApprovalItem[];
  submittedAt: string;
  status: ApprovalStatus;
  /** 待处理或被驳回的节点；已通过时为 null。 */
  node: ApprovalNode | null;
  records: ApprovalRecord[];
  version: number;
}

export type ApprovalCommentError = Extract<MessageKey, `exampleApproval.validation.${string}`>;
export const COMMENT_MIN = 5;
export const COMMENT_MAX = 200;

export const approvalTotal = (request: Pick<ApprovalRequest, 'items'>) => request.items.reduce((sum, item) => sum + item.amount, 0);

/** 驳回与重新提交必须写明原因；通过时意见可选。 */
export function validateComment(action: ApprovalAction, comment: string): ApprovalCommentError | undefined {
  const text = comment.trim();
  if (text.length > COMMENT_MAX) return 'exampleApproval.validation.commentTooLong';
  if (action !== 'approve' && text.length < COMMENT_MIN) return 'exampleApproval.validation.commentRequired';
  return undefined;
}

export const canDecide = (request: Pick<ApprovalRequest, 'status'>, action: ApprovalAction) =>
  action === 'resubmit' ? request.status === 'rejected' : request.status === 'pending';

/** 纯状态流转：部门负责人 → 财务复核 → 通过；驳回停在当前节点，重新提交回到第一个节点。 */
export function applyDecision(request: ApprovalRequest, action: ApprovalAction, actor: string, comment: string, time: string, id: string): ApprovalRequest {
  const node = action === 'resubmit' ? 'submit' : request.node ?? 'manager';
  const record: ApprovalRecord = { id, action, node, actor, comment: comment.trim(), time };
  const base = { ...request, records: [...request.records, record], version: request.version + 1 };
  if (action === 'reject') return { ...base, status: 'rejected' };
  if (action === 'resubmit') return { ...base, status: 'pending', node: 'manager', submittedAt: time };
  const next = APPROVAL_NODES[APPROVAL_NODES.indexOf(request.node ?? 'manager') + 1];
  return next ? { ...base, node: next } : { ...base, status: 'approved', node: null };
}
