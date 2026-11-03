import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProfile } from '@/pages/examples/forms/sections/defaults';
import { validateProfile } from '@/api/services/exampleFormRules';

vi.mock('@/mock/helpers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/mock/helpers')>(),
  delay: () => Promise.resolve(),
}));

beforeEach(() => {
  vi.resetModules();
  localStorage.setItem('pilot-admin:auth:tokens:v2', JSON.stringify({ accessToken: `mock.${btoa(JSON.stringify({ sub: 'u-0003' }))}.local`, refreshToken: 'test' }));
});

describe('stateless profile form', () => {
  it('validates required fields, email, dates, units and notification values', () => {
    expect(validateProfile(defaultProfile())).toEqual({});
    expect(validateProfile({ ...defaultProfile(), website: `https://example.com/${'a'.repeat(200)}` })).toHaveProperty('website');
    expect(validateProfile({ ...defaultProfile(), organizationName: ' ', email: 'bad', startDate: '2026-02-30', retentionDays: '1.5', systemNotice: 'true' as unknown as boolean })).toMatchObject({
      organizationName: 'exampleForms.validation.name', email: 'exampleForms.validation.email',
      startDate: 'exampleForms.validation.startDate', retentionDays: 'exampleForms.validation.retention', systemNotice: 'exampleForms.validation.preference',
    });
  });

  it('returns server field errors for reserved names and reversed dates without persisting', async () => {
    const { exampleFormService } = await import('@/api/services/exampleFormService');
    const { getMockDb } = await import('@/mock/db');
    const previous = structuredClone(getMockDb());
    const result = await exampleFormService.submitProfile({ ...defaultProfile(), organizationName: ' System ', endDate: '2026-10-01' });
    expect(result.data).toEqual({ success: false, errors: { organizationName: 'exampleForms.validation.reservedName', endDate: 'exampleForms.validation.dateOrder' } });
    expect(getMockDb()).toEqual(previous);
  });

  it('allows viewers, returns unique references and never changes storage or the DB', async () => {
    const { exampleFormService } = await import('@/api/services/exampleFormService');
    const { getMockDb } = await import('@/mock/db');
    const previous = structuredClone(getMockDb());
    const stored = localStorage.getItem('pilot-admin:mock-db:v7');
    const first = (await exampleFormService.submitProfile(defaultProfile())).data;
    const second = (await exampleFormService.submitProfile(defaultProfile())).data;
    expect(first).toMatchObject({ success: true, reference: expect.stringMatching(/^FORM-[A-Z0-9]{8}$/) });
    expect(second).not.toEqual(first);
    expect(getMockDb()).toEqual(previous);
    expect(localStorage.getItem('pilot-admin:mock-db:v7')).toBe(stored);
  });

  it('rechecks page access at the service boundary', async () => {
    const { exampleFormService } = await import('@/api/services/exampleFormService');
    const { updateMockDb } = await import('@/mock/db');
    updateMockDb((db) => { db.roles.find((role) => role.id === 'role-viewer')!.menuIds = []; });
    await expect(exampleFormService.submitProfile(defaultProfile())).rejects.toMatchObject({ status: 403 });
  });
});
