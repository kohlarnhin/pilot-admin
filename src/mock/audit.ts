import { t } from '@/i18n';
import { allowAuditParams, auditModule, AUDIT_PARAMS, AUDIT_REASONS } from '@/audit/catalog';
import type { AuditAction, AuditLog, AuditParamsMap } from '@/types';
import type { MockDb } from './seed';

type AuditActionEntry = { [A in AuditAction]: { action: A } & (keyof AuditParamsMap[A] extends never
  ? { params?: never } : { params: AuditParamsMap[A] }) }[AuditAction];
export type AuditEntry = AuditActionEntry & {
  actor: { id?: string; user_name: string };
  traceId: string;
  target_type?: AuditLog['target_type'];
  target_id?: string;
  target_name?: string;
  result?: AuditLog['result'];
  reason?: AuditLog['reason'];
};

/** 只改调用者的业务 draft；不独立读写 DB，业务和日志一次提交。 */
export function recordAudit(draft: Pick<MockDb, 'auditLogs'>, entry: AuditEntry): void {
  const params = allowAuditParams(entry.action, entry.params);
  if (AUDIT_PARAMS[entry.action].some((key) => !(key in params))) {
    throw new TypeError(t('serverErrors.audit.invalidParams'));
  }
  draft.auditLogs.unshift({
    id: crypto.randomUUID(),
    actor_id: entry.actor.id,
    actor_name: entry.actor.user_name,
    module: auditModule(entry.action),
    action: entry.action,
    target_type: entry.target_type,
    target_id: entry.target_id,
    target_name: entry.target_name,
    ...(Object.keys(params).length ? { params } : {}),
    result: entry.result || 'success',
    reason: AUDIT_REASONS.find((reason) => reason === entry.reason),
    trace_id: entry.traceId,
    create_date: new Date().toISOString(),
  });
  draft.auditLogs.length = Math.min(draft.auditLogs.length, 1000);
}
