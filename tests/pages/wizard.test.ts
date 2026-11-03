import { describe, expect, it, vi } from 'vitest';
import { emptyWizardValues, hasWizardInput, validateWizardStep } from '@/pages/examples/forms/wizard/validation';
import { clearWizardDraft, readWizardDraft, saveWizardDraft, wizardDraftKey } from '@/pages/examples/forms/wizard/draft';

describe('wizard step validation', () => {
  it('validates only the current step and reports each field independently', () => {
    const values = emptyWizardValues();
    expect(Object.keys(validateWizardStep(values, 0))).toEqual(['name', 'code']);
    expect(Object.keys(validateWizardStep(values, 1))).toEqual(['owner']);
    expect(validateWizardStep(values, 2)).toEqual({});
    expect(validateWizardStep(values, 3)).toEqual({});
  });

  it('keeps the existing service limits and code format', () => {
    const values = { name: 'Example', code: 'EXAMPLE-01', owner: 'Alex', status: 'active' as const, description: 'a'.repeat(1000) };
    expect([0, 1, 2].map((step) => validateWizardStep(values, step))).toEqual([{}, {}, {}]);
    expect(validateWizardStep({ ...values, name: ' ', code: 'lowercase' }, 0)).toHaveProperty('code');
    expect(validateWizardStep({ ...values, name: 'a'.repeat(61) }, 0)).toHaveProperty('name');
    expect(validateWizardStep({ ...values, owner: 'a'.repeat(41) }, 1)).toHaveProperty('owner');
    expect(validateWizardStep({ ...values, description: 'a'.repeat(1001) }, 2)).toHaveProperty('description');
    expect(hasWizardInput(emptyWizardValues())).toBe(false);
    expect(hasWizardInput({ ...emptyWizardValues(), status: 'paused' })).toBe(true);
  });
});

describe('wizard draft storage', () => {
  it('isolates users and stores only field values', () => {
    const values = { ...emptyWizardValues(), name: 'Draft', code: 'DRAFT' };
    expect(saveWizardDraft('u-1', { ...values, step: 2, secret: 'discard' } as typeof values)).toBe(true);
    expect(readWizardDraft('u-1')).toEqual(values);
    expect(readWizardDraft('u-2')).toBeNull();
    expect(Object.keys(JSON.parse(localStorage.getItem(wizardDraftKey('u-1'))!))).toEqual(['name', 'code', 'owner', 'status', 'description']);
    expect(clearWizardDraft('u-1')).toBe(true);
    expect(readWizardDraft('u-1')).toBeNull();
  });

  it.each(['{broken', 'null', '[]', '{"name":7}'])('ignores malformed drafts (%s)', (raw) => {
    localStorage.setItem(wizardDraftKey('u-1'), raw);
    expect(readWizardDraft('u-1')).toBeNull();
  });

  it('rejects oversized fields and survives unavailable storage', () => {
    expect(saveWizardDraft('u-1', { ...emptyWizardValues(), name: 'a'.repeat(61) })).toBe(false);
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readWizardDraft('u-1')).toBeNull();
    expect(saveWizardDraft('u-1', emptyWizardValues())).toBe(false);
    expect(clearWizardDraft('u-1')).toBe(false);
  });
});
