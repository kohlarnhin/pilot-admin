import type { AgentProfile } from '@/types';
import type { FormSection } from './sections/types';

export interface ProfileDrafts {
  saved: AgentProfile;
  sections: Record<string, AgentProfile>;
}

const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

export function sectionPatch(draft: AgentProfile, section: FormSection): Partial<AgentProfile> {
  return Object.fromEntries(section.fields.map((field) => [field, structuredClone(draft[field])]));
}

export function isSectionDirty(state: ProfileDrafts, section: FormSection): boolean {
  const draft = state.sections[section.key];
  return Boolean(draft && section.fields.some((field) => !equal(draft[field], state.saved[field])));
}

/** 语言刷新及保存结果只更新已保存基线，保留各分区尚未提交的字段。 */
export function rebaseProfileDrafts(previous: ProfileDrafts | null, saved: AgentProfile, sections: readonly FormSection[]): ProfileDrafts {
  return {
    saved: structuredClone(saved),
    sections: Object.fromEntries(sections.map((section) => {
      const draft = previous?.sections[section.key];
      const edits = draft && previous
        ? Object.fromEntries(section.fields.filter((field) => !equal(draft[field], previous.saved[field])).map((field) => [field, structuredClone(draft[field])]))
        : {};
      return [section.key, { ...structuredClone(saved), ...edits }];
    })),
  };
}

export function resetSectionDraft(state: ProfileDrafts, section: FormSection): ProfileDrafts {
  return { ...state, sections: { ...state.sections, [section.key]: structuredClone(state.saved) } };
}
