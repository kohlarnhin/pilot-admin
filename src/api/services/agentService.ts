import type { AgentAttachmentMetadata, AgentChatProgress, AgentPageActionOutcome } from '@/types';
import type { ChatChoice, ChatSelection, PlanCommand } from '@/mock/agent/engine';
import { t } from '@/i18n';
import { ApiRequestError } from '@/api/errors';
import { createLazyResource } from '@/utils/lazyResource';

const engineModule = createLazyResource(() => import('@/mock/agent/engine'));
const loadEngine = async () => {
  try {
    return (await engineModule.load()).mockAgentEngine;
  } catch {
    throw new ApiRequestError(t('assistant.errors.unavailable'), 503);
  }
};
type Engine = Awaited<ReturnType<typeof loadEngine>>;

export { AGENT_DATA_CHANGED_EVENT, triggerDataChangeSideEffects } from './agentEvents';

// 唯一数据入口；接入真实服务时，在这里改为 http / runSseStream 调用。
export const agentService = {
  getSessions: async (...args: Parameters<Engine['getSessions']>) => (await loadEngine()).getSessions(...args),
  getSessionDetail: async (...args: Parameters<Engine['getSessionDetail']>) => (await loadEngine()).getSessionDetail(...args),
  getPlan: async (...args: Parameters<Engine['getPlan']>) => (await loadEngine()).getPlan(...args),

  updatePlan: async (sessionId: string | number, messageId: string | number, command: PlanCommand) => (
    (await loadEngine()).updatePlan(sessionId, messageId, command)
  ),

  recordPageActionOutcome: async (
    sessionId: string,
    messageId: string,
    outcome: Omit<AgentPageActionOutcome, 'finishedAt'>,
  ) => (await loadEngine()).recordPageActionOutcome(sessionId, messageId, outcome),

  chatStream: async (
    sessionId: string | number | null,
    message: string,
    onStart?: (sessionId: string | number, messageId: string | number) => void,
    onDelta?: (delta: string) => void,
    onProgress?: (progress: AgentChatProgress) => void,
    signal?: AbortSignal,
    choice?: ChatChoice,
    _autoMode = false,
    selection?: ChatSelection,
    attachments?: AgentAttachmentMetadata[],
  ) => {
    signal?.throwIfAborted();
    const engine = await loadEngine();
    signal?.throwIfAborted();
    return engine.chatStream(sessionId, message, {
      onStart,
      onDelta,
      onProgress,
      signal,
    }, choice, selection, { attachments });
  },

  continuePlan: async (
    sessionId: string | number,
    messageId: string | number,
    stepIndex: number,
    executionId: string,
    onStart?: (sessionId: string | number, messageId: string | number) => void,
    onDelta?: (delta: string) => void,
    onProgress?: (progress: AgentChatProgress) => void,
    signal?: AbortSignal,
  ) => {
    signal?.throwIfAborted();
    const engine = await loadEngine();
    signal?.throwIfAborted();
    return engine.continuePlan(sessionId, messageId, stepIndex, executionId, {
      onStart,
      onDelta,
      onProgress,
      signal,
    });
  },
};
