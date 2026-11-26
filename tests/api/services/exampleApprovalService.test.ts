import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDecision, validateComment } from '@/api/services/exampleApprovalRules';

vi.mock('@/mock/helpers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/mock/helpers')>(),
  delay: () => Promise.resolve(),
}));

const loginAs = (sub: string) => localStorage.setItem('pilot-admin:auth:tokens:v2', JSON.stringify({ accessToken: `mock.${btoa(JSON.stringify({ sub }))}.local`, refreshToken: 'test' }));
beforeEach(() => { vi.resetModules(); loginAs('u-0001'); });

describe('approval flow example', () => {
  it('requires a reason to reject or resubmit and caps comment length', () => {
    expect(validateComment('approve', '')).toBeUndefined();
    expect(validateComment('reject', ' ok ')).toBe('exampleApproval.validation.commentRequired');
    expect(validateComment('resubmit', 'Reduced catering')).toBeUndefined();
    expect(validateComment('approve', 'a'.repeat(201))).toBe('exampleApproval.validation.commentTooLong');
  });

  it('moves through manager and finance, stops on reject and restarts on resubmit', async () => {
    const { createApprovalSeed } = await import('@/api/services/exampleApprovalService');
    const [request] = createApprovalSeed(Date.parse('2026-11-26T00:00:00Z'));
    const finance = applyDecision(request, 'approve', 'A', '', 't1', 'x1');
    expect(finance).toMatchObject({ status: 'pending', node: 'finance', version: 2 });
    const rejected = applyDecision(finance, 'reject', 'B', ' too much ', 't2', 'x2');
    expect(rejected).toMatchObject({ status: 'rejected', node: 'finance' });
    expect(rejected.records.at(-1)).toEqual({ id: 'x2', action: 'reject', node: 'finance', actor: 'B', comment: 'too much', time: 't2' });
    expect(applyDecision(rejected, 'resubmit', 'C', 'fixed', 't3', 'x3')).toMatchObject({ status: 'pending', node: 'manager', submittedAt: 't3' });
    expect(applyDecision(applyDecision(request, 'approve', 'A', '', 't', 'a'), 'approve', 'B', '', 't', 'b')).toMatchObject({ status: 'approved', node: null });
  });

  it('checks permission, state and comments on the server without touching the DB', async () => {
    const { exampleApprovalService } = await import('@/api/services/exampleApprovalService');
    const { getMockDb } = await import('@/mock/db');
    const previous = structuredClone(getMockDb());
    const { data } = await exampleApprovalService.list();
    expect(data.map((item) => item.status)).toEqual(['pending', 'pending', 'approved', 'rejected']);
    expect((await exampleApprovalService.decide(data[0], 'reject', 'no')).data).toEqual({ success: false, error: 'exampleApproval.validation.commentRequired' });
    await expect(exampleApprovalService.decide(data[2], 'approve', '')).rejects.toMatchObject({ status: 409 });
    const result = (await exampleApprovalService.decide(data[1], 'approve', '')).data;
    expect(result).toMatchObject({ success: true, request: { status: 'approved', node: null } });
    expect(getMockDb()).toEqual(previous);
    vi.resetModules();
    loginAs('u-0003');
    const viewer = await import('@/api/services/exampleApprovalService');
    await expect(viewer.exampleApprovalService.decide(data[0], 'approve', '')).rejects.toMatchObject({ status: 403 });
  });
});
