import type { ProjectInput } from '@/api/services/exampleProjectService';
import { PROJECT_RULES, validateProjectInput } from '@/api/services/exampleProjectRules';

export const emptyWizardValues = (): ProjectInput => ({ name: '', code: '', owner: '', status: 'active', description: '' });
type WizardErrorKey = typeof PROJECT_RULES[keyof typeof PROJECT_RULES]['message'] | 'exampleForms.wizard.taken';
export type WizardErrors = Partial<Record<keyof ProjectInput, WizardErrorKey>>;
const stepFields: (keyof ProjectInput)[][] = [['name', 'code'], ['owner', 'status'], ['description']];

/** 复用服务的纯规则，仅验证当前步骤，不提前标记后续必填项。 */
export function validateWizardStep(values: ProjectInput, step: number): WizardErrors {
  const errors: WizardErrors = {};
  for (const field of stepFields[step] || []) {
    const probe: ProjectInput = { name: 'Example', code: 'EXAMPLE', owner: 'Owner', status: 'active', description: '' };
    Object.assign(probe, { [field]: values[field] });
    if (validateProjectInput(probe)?.field === field) errors[field] = PROJECT_RULES[field].message;
  }
  return errors;
}

export const hasWizardInput = (values: ProjectInput) => JSON.stringify(values) !== JSON.stringify(emptyWizardValues());
