import { describe, expect, it } from 'vitest';
import { assistantSections, visibleAssistantSections } from '@/pages/assistant/sections/registry';
import type { AssistantSection } from '@/pages/assistant/sections/types';

describe('assistant settings registry', () => {
  it('has unique URL keys in the intended order', () => {
    const keys = assistantSections.map((section) => section.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(['models', 'identity', 'prompts', 'commands']);
  });

  it('keeps unrestricted sections and requires every extra permission, preserving order', () => {
    const sections: AssistantSection[] = [
      assistantSections[0],
      { ...assistantSections[1], requires: ['profile:view', 'profile:update'] },
      { ...assistantSections[2], requires: [] },
      { ...assistantSections[3], requires: ['tools:view'] },
    ];
    const permissions = new Set(['profile:view', 'tools:view']);
    expect(visibleAssistantSections(sections, (code) => permissions.has(code)).map((section) => section.key)).toEqual(['models', 'prompts', 'commands']);
    permissions.add('profile:update');
    expect(visibleAssistantSections(sections, (code) => permissions.has(code))).toEqual(sections);
    expect(sections).toHaveLength(4);
  });
});
