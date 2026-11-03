import { lazy } from 'react';
import type { AssistantSection } from './types';

/** 新分区只在这里注册；表单字段同时定义草稿、脏状态与保存边界。 */
export const assistantSections: AssistantSection[] = [
  {
    key: 'models',
    icon: 'wand-sparkles',
    titleKey: 'assistantSettings.models.title',
    descriptionKey: 'assistantSettings.models.description',
    kind: 'panel',
    Component: lazy(() => import('./AgentConfigPanel').then((module) => ({ default: module.AgentConfigPanel }))),
  },
  {
    key: 'identity',
    icon: 'bot',
    titleKey: 'assistantSettings.greeting.title',
    descriptionKey: 'assistantSettings.greeting.description',
    kind: 'form',
    fields: ['name', 'greeting'],
    saveKey: 'assistantSettings.greeting.save',
    isValid: (draft) => Boolean(draft.name.trim() && draft.greeting.trim()),
    Component: lazy(() => import('./IdentitySection')),
  },
  {
    key: 'prompts',
    icon: 'lightbulb',
    titleKey: 'assistantSettings.shortcuts.title',
    descriptionKey: 'assistantSettings.shortcuts.description',
    kind: 'form',
    fields: ['suggestions'],
    saveKey: 'assistantSettings.shortcuts.save',
    isValid: (draft) => draft.suggestions.length <= 6 && draft.suggestions.every((item) => Boolean(item.label.trim() && item.prompt.trim())),
    Component: lazy(() => import('./PromptsSection')),
  },
  {
    key: 'commands',
    icon: 'square-terminal',
    titleKey: 'assistantSettings.commands.title',
    descriptionKey: 'assistantSettings.commands.description',
    kind: 'panel',
    Component: lazy(() => import('./CommandsSection')),
  },
];

export function visibleAssistantSections(sections: readonly AssistantSection[], can: (permission: string) => boolean): AssistantSection[] {
  return sections.filter((section) => section.requires?.every(can) ?? true);
}
