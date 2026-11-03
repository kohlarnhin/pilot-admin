import { describe, expect, it } from 'vitest';
import type { AgentProfile } from '@/types';
import { assistantSections } from '@/pages/assistant/sections/registry';
import type { FormSection } from '@/pages/assistant/sections/types';
import { isSectionDirty, rebaseProfileDrafts, resetSectionDraft, sectionPatch } from '@/pages/assistant/drafts';

const sections = assistantSections.filter((section): section is FormSection => section.kind === 'form');
const [identity, prompts] = sections;
const saved: AgentProfile = {
  name: 'Pilot',
  greeting: 'How can I help?',
  suggestions: [{ label: 'Accounts', prompt: 'Overview stats' }, { label: 'Help', prompt: 'Help' }],
};

describe('assistant section drafts', () => {
  it('initializes independent snapshots and limits patches to declared fields', () => {
    const state = rebaseProfileDrafts(null, saved, sections);
    expect(isSectionDirty(state, identity)).toBe(false);
    expect(isSectionDirty(state, prompts)).toBe(false);
    state.sections.identity.name = 'My assistant';
    state.sections.identity.suggestions[0].label = 'Unrelated';
    expect(saved.name).toBe('Pilot');
    expect(state.saved.name).toBe('Pilot');
    expect(state.sections.prompts.suggestions[0].label).toBe('Accounts');
    expect(sectionPatch(state.sections.identity, identity)).toEqual({ name: 'My assistant', greeting: saved.greeting });
    expect(sectionPatch(state.sections.prompts, prompts)).toEqual({ suggestions: saved.suggestions });
  });

  it('detects prompt text, order and removals, and clears when restored exactly', () => {
    const state = rebaseProfileDrafts(null, saved, sections);
    state.sections.prompts.suggestions.reverse();
    expect(isSectionDirty(state, prompts)).toBe(true);
    state.sections.prompts.suggestions.reverse();
    expect(isSectionDirty(state, prompts)).toBe(false);
    state.sections.prompts.suggestions[0].prompt = 'New content';
    expect(isSectionDirty(state, prompts)).toBe(true);
    state.sections.prompts.suggestions = saved.suggestions.slice(0, 1);
    expect(isSectionDirty(state, prompts)).toBe(true);
    expect(isSectionDirty(state, identity)).toBe(false);
  });

  it('resets only the active section to the latest saved baseline', () => {
    const state = rebaseProfileDrafts(null, saved, sections);
    state.sections.identity.name = 'Draft identity';
    state.sections.prompts.suggestions = [];
    const reset = resetSectionDraft(state, identity);
    expect(isSectionDirty(reset, identity)).toBe(false);
    expect(isSectionDirty(reset, prompts)).toBe(true);
    expect(reset.sections.prompts.suggestions).toEqual([]);
    expect(state.sections.identity.name).toBe('Draft identity');
  });

  it('preserves edited fields on locale refresh while updating untouched defaults', () => {
    const state = rebaseProfileDrafts(null, saved, sections);
    state.sections.identity.name = 'Custom draft';
    const localized: AgentProfile = { name: 'Localized', greeting: 'Localized greeting', suggestions: [] };
    const rebased = rebaseProfileDrafts(state, localized, sections);
    expect(rebased.sections.identity).toEqual({ ...localized, name: 'Custom draft' });
    expect(rebased.sections.prompts).toEqual(localized);
    expect(isSectionDirty(rebased, identity)).toBe(true);
    expect(isSectionDirty(rebased, prompts)).toBe(false);
  });

  it('accepts a section save without losing another section draft or saving its fields', () => {
    const state = rebaseProfileDrafts(null, saved, sections);
    state.sections.identity.name = 'Saved identity';
    state.sections.prompts.suggestions = [{ label: 'Unsaved', prompt: 'Unsent prompt' }];
    const patch = sectionPatch(state.sections.identity, identity);
    const committed = rebaseProfileDrafts(state, { ...state.saved, ...patch }, sections);
    expect(committed.saved.suggestions).toEqual(saved.suggestions);
    expect(isSectionDirty(committed, identity)).toBe(false);
    expect(isSectionDirty(committed, prompts)).toBe(true);
    expect(committed.sections.prompts.name).toBe('Saved identity');
    expect(committed.sections.prompts.suggestions[0].label).toBe('Unsaved');
  });

  it('validates required identity fields and the quick prompt limit', () => {
    expect(identity.isValid({ ...saved, name: '  ' })).toBe(false);
    expect(identity.isValid({ ...saved, greeting: '' })).toBe(false);
    expect(prompts.isValid({ ...saved, suggestions: [] })).toBe(true);
    expect(prompts.isValid({ ...saved, suggestions: [{ label: '', prompt: 'Help' }] })).toBe(false);
    expect(prompts.isValid({ ...saved, suggestions: Array.from({ length: 7 }, () => saved.suggestions[0]) })).toBe(false);
  });
});
