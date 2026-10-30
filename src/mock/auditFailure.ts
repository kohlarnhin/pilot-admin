import { ApiRequestError } from '@/api/errors';
import type { AuditReason } from '@/types';
import { currentUser } from './access';
import { recordAudit, type AuditEntry } from './audit';
import { updateMockDb } from './db';
import { createTraceId } from './helpers';

type Description<T = AuditEntry> = T extends AuditEntry ? Omit<T, 'actor' | 'traceId' | 'result' | 'reason'> : never;
const REASONS: Record<number, AuditReason> = { 400: 'invalid_input', 401: 'forbidden', 403: 'forbidden', 404: 'not_found', 409: 'conflict' };

/** 校验拒绝没有业务提交；审计失败不能覆盖原错误，也不重试持久化错误。 */
export function recordAuditFailure(error: unknown, describe: () => Description): void {
  if (!(error instanceof ApiRequestError)) return;
  try {
    let actor: AuditEntry['actor'] = { user_name: '' };
    try { actor = currentUser(); } catch { /* 认证已失效时不猜测账号身份。 */ }
    const description = describe();
    updateMockDb((draft) => recordAudit(draft, {
      ...description,
      actor,
      result: 'failure',
      reason: REASONS[error.status ?? 400] || 'invalid_input',
      traceId: createTraceId(),
    }));
  } catch { /* 原业务错误优先，不让审计错误改变交互。 */ }
}
