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

export const INITIAL_GREETING = '你好！我是领航助手，可以协助你查看概况、查找用户和维护账号。';

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
    return '尚未配置可用模型';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'AI 助手暂时不可用，请稍后再试。';
};
