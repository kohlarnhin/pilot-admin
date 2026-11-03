import type { ProjectInput } from '@/api/services/exampleProjectService';

export const wizardDraftKey = (userId: string) => `pilot-admin:form-draft:${userId}:project-wizard`;

/** 只存白名单字段值；不存步骤、错误、账号或服务响应。 */
function draftValues(input: unknown): ProjectInput | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (typeof value.name !== 'string' || value.name.length > 60
    || typeof value.code !== 'string' || value.code.length > 20
    || typeof value.owner !== 'string' || value.owner.length > 40
    || typeof value.description !== 'string' || value.description.length > 1000
    || !['active', 'paused', 'archived'].includes(String(value.status))) return null;
  return { name: value.name, code: value.code, owner: value.owner, status: value.status as ProjectInput['status'], description: value.description };
}

export function readWizardDraft(userId: string): ProjectInput | null {
  try {
    const stored = localStorage.getItem(wizardDraftKey(userId));
    return stored ? draftValues(JSON.parse(stored)) : null;
  } catch { return null; }
}

export function saveWizardDraft(userId: string, values: ProjectInput): boolean {
  try {
    const safe = draftValues({ ...values, description: values.description || '' });
    if (!safe) return false;
    localStorage.setItem(wizardDraftKey(userId), JSON.stringify(safe));
    return true;
  } catch { return false; }
}

export function clearWizardDraft(userId: string): boolean {
  try {
    localStorage.removeItem(wizardDraftKey(userId));
    return true;
  } catch { return false; }
}
