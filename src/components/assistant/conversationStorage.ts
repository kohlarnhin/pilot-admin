import type { AgentChoice, AgentInteraction } from '@/types';
import { normalizeAgentInteraction } from '@/api/services/agentInteraction';

export type AssistantMessageKind = 'message' | 'progress' | 'error';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  kind: AssistantMessageKind;
  choices?: AgentChoice[];
  selectedChoiceId?: string;
  sequenceNo?: number;
  sourceMessageId?: string;
  progressStage?: string;
  elapsedSeconds?: number;
  stopped?: boolean;
  interaction?: AgentInteraction;
}

interface StoredConversation {
  version: 1;
  messages: AssistantMessage[];
  draft?: string;
  sessionId?: string | number | null;
}

export interface ConversationState {
  messages: AssistantMessage[];
  draft: string;
  sessionId: string | number | null;
}

const STORAGE_PREFIX = 'pilot-admin:ai-assistant:conversation:v1:';
const MAX_LOCAL_MESSAGE_LENGTH = 12000;
const MAX_LOCAL_INTERACTION_MESSAGE_LENGTH = 160000;
const MAX_LOCAL_CHOICES = 20;

export const conversationStorageKey = (userId: string): string => `${STORAGE_PREFIX}${userId}`;

const isChoice = (value: unknown): value is AgentChoice => {
  if (!value || typeof value !== 'object') return false;
  const choice = value as Partial<AgentChoice>;
  return (
    typeof choice.id === 'string' && choice.id.length > 0 && choice.id.length <= 64 &&
    typeof choice.label === 'string' && choice.label.trim().length > 0 && choice.label.length <= 24
  );
};

const isMessage = (value: unknown): value is AssistantMessage => {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<AssistantMessage>;
  return (
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    message.content.length <= (normalizeAgentInteraction(message.interaction)
      ? MAX_LOCAL_INTERACTION_MESSAGE_LENGTH : MAX_LOCAL_MESSAGE_LENGTH) &&
    typeof message.createdAt === 'string' &&
    (message.kind === 'message' || message.kind === 'progress' || message.kind === 'error') &&
    (message.choices === undefined || (
      Array.isArray(message.choices) &&
      message.choices.length <= MAX_LOCAL_CHOICES &&
      message.choices.every(isChoice)
    )) &&
    (message.selectedChoiceId === undefined || typeof message.selectedChoiceId === 'string') &&
    (message.stopped === undefined || typeof message.stopped === 'boolean')
  );
};

export const readConversationState = (storageKey: string): ConversationState => {
  const empty: ConversationState = { messages: [], draft: '', sessionId: null };
  try {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) return empty;
    const stored = JSON.parse(rawValue) as Partial<StoredConversation>;
    if (stored.version !== 1 || !Array.isArray(stored.messages)) return empty;
    return {
      messages: stored.messages.filter(isMessage).map(message => ({
        ...message, interaction: normalizeAgentInteraction(message.interaction),
      })),
      draft: typeof stored.draft === 'string' ? stored.draft : '',
      sessionId: typeof stored.sessionId === 'string' || typeof stored.sessionId === 'number'
        ? stored.sessionId
        : null,
    };
  } catch {
    return empty;
  }
};

export const readConversation = (storageKey: string): AssistantMessage[] =>
  readConversationState(storageKey).messages;

export const writeConversation = (
  storageKey: string,
  messages: AssistantMessage[],
  state?: Pick<ConversationState, 'draft' | 'sessionId'>
): boolean => {
  try {
    const value: StoredConversation = { version: 1, messages: messages.slice(-100), ...state };
    localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const clearConversation = (storageKey: string): void => {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // 浏览器禁用本地存储时，内存中的消息仍然可以正常清空。
  }
};

