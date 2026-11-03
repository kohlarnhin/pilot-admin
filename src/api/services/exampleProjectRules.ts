import type { ExampleProject } from '@/types';

export type ProjectInput = Pick<ExampleProject, 'name' | 'code' | 'owner' | 'status' | 'description'>;
export const PROJECT_CODE_EXISTS = 40901;
export const PROJECT_RULES = {
  name: {
    code: 40011,
    message: 'serverErrors.example.invalidName',
  },
  code: {
    code: 40012,
    message: 'serverErrors.example.invalidCode',
  },
  owner: {
    code: 40013,
    message: 'serverErrors.example.invalidOwner',
  },
  status: {
    code: 40014,
    message: 'serverErrors.example.invalidStatus',
  },
  description: {
    code: 40015,
    message: 'serverErrors.example.invalidDescription',
  },
} as const;
export type ProjectIssue = { field: keyof ProjectInput; code: number; message: typeof PROJECT_RULES[keyof typeof PROJECT_RULES]['message'] | 'serverErrors.example.codeExists' };

/** 表单服务与本地导入预检共享规则；不读取 DB，也不依赖当前语言。 */
export function validateProjectInput(input: ProjectInput): ProjectIssue | undefined {
  let field: keyof ProjectInput | undefined;
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 60) field = 'name';
  else if (typeof input.code !== 'string' || !/^[A-Z][A-Z0-9-]{1,19}$/.test(input.code)) field = 'code';
  else if (typeof input.owner !== 'string' || !input.owner.trim() || input.owner.trim().length > 40) field = 'owner';
  else if (!['active', 'paused', 'archived'].includes(input.status)) field = 'status';
  else if (input.description !== undefined && (typeof input.description !== 'string' || input.description.length > 1000)) field = 'description';
  return field ? { field, ...PROJECT_RULES[field] } : undefined;
}

export function projectIssueFromCode(code?: number): ProjectIssue | undefined {
  if (code === PROJECT_CODE_EXISTS) return { field: 'code', code, message: 'serverErrors.example.codeExists' };
  const field = (Object.keys(PROJECT_RULES) as (keyof ProjectInput)[]).find((key) => PROJECT_RULES[key].code === code);
  return field ? { field, ...PROJECT_RULES[field] } : undefined;
}

export const normalizeProjectInput = (input: ProjectInput): ProjectInput => ({
  name: input.name.trim(),
  code: input.code,
  owner: input.owner.trim(),
  status: input.status,
  description: input.description?.trim(),
});
