import type { ComponentType, LazyExoticComponent } from 'react';
import type { AgentProfile } from '@/types';
import type { IconName } from '@/components/icon';
import type { MessageKey, MessageParams } from '@/i18n/types';

type SectionMessageKey = { [K in MessageKey]: [MessageParams<K>] extends [never] ? K : never }[MessageKey];

export interface AssistantSectionProps {
  section: Pick<AssistantSection, 'titleKey' | 'descriptionKey'>;
  draft: AgentProfile | null;
  disabled: boolean;
  onDraftChange: (draft: AgentProfile) => void;
}

interface SectionDefinition {
  key: string;
  icon: IconName;
  titleKey: SectionMessageKey;
  descriptionKey: SectionMessageKey;
  requires?: string[];
  Component: LazyExoticComponent<ComponentType<AssistantSectionProps>>;
}

export interface FormSection extends SectionDefinition {
  kind: 'form';
  fields: (keyof AgentProfile)[];
  saveKey: SectionMessageKey;
  isValid: (draft: AgentProfile) => boolean;
}

export type AssistantSection = FormSection | (SectionDefinition & { kind: 'panel' });
