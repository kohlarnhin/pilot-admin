import { t } from '@/i18n';
import chinese from '@/i18n/locales/zh-CN/assistant';
import english from '@/i18n/locales/en-US/assistant';
import type { AgentChoice, AgentMessage } from '@/types';
import type { AssistantMessage } from './conversationStorage';
import { normalizeAgentInteraction } from '@/api/services/agentInteraction';

export const MAX_INPUT_LENGTH = 4000;
export const getAssistantShortcut = () => {
  const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return {
    label: isApple ? '⌘J' : 'Ctrl J',
    ariaKeyShortcuts: isApple ? 'Meta+J' : 'Control+J',
  };
};

// 仅识别旧版客户端插入的首条问候语；有服务端标识的消息始终保留。
export const isLegacyGreeting = (text: string): boolean => [chinese.legacyGreeting, english.legacyGreeting].some((value) => value === text);

export const createMessageId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createMessage = (
  role: AssistantMessage['role'],
  content: string,
  kind: AssistantMessage['kind'] = 'message',
  choices: AgentChoice[] = []
): AssistantMessage => ({
  id: createMessageId(),
  role,
  content,
  createdAt: new Date().toISOString(),
  kind,
  choices: choices.length > 0 ? choices : undefined,
});

export const toAssistantMessage = (message: AgentMessage): AssistantMessage => ({
  id: String(message.id),
  sequenceNo: message.sequence_no,
  role: message.role,
  content: message.content,
  createdAt: message.create_date,
  kind: message.kind === 'progress' ? 'progress' : message.kind === 'error' ? 'error' : 'message',
  choices: message.choices,
  sourceMessageId: message.source_message_id ? String(message.source_message_id) : undefined,
  selectedChoiceId: message.selected_choice_id,
  interaction: normalizeAgentInteraction(message.interaction),
});

export const readableError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'errorCode' in error && error.errorCode === 1501) {
    return t('serverErrors.agent.noModel');
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return t('assistant.errors.unavailable');
};
