import type { AgentAttachmentMetadata, AgentChatProgress, AgentPageActionOutcome } from '@/types';
import { mockAgentEngine, type ChatChoice, type ChatSelection, type PlanCommand } from '@/mock/agent/engine';

export { AGENT_DATA_CHANGED_EVENT, triggerDataChangeSideEffects } from './agentEvents';

// 唯一数据入口；接入真实服务时，在这里改为 http / runSseStream 调用。
export const agentService = {
  getSessions: mockAgentEngine.getSessions.bind(mockAgentEngine),
  getSessionDetail: mockAgentEngine.getSessionDetail.bind(mockAgentEngine),
  getPlan: mockAgentEngine.getPlan.bind(mockAgentEngine),

  updatePlan: (sessionId: string | number, messageId: string | number, command: PlanCommand) => (
    mockAgentEngine.updatePlan(sessionId, messageId, command)
  ),

  recordPageActionOutcome: (
    sessionId: string,
    messageId: string,
    outcome: Omit<AgentPageActionOutcome, 'finishedAt'>,
  ) => mockAgentEngine.recordPageActionOutcome(sessionId, messageId, outcome),

  chatStream: (
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
  ) => mockAgentEngine.chatStream(sessionId, message, {
    onStart,
    onDelta,
    onProgress,
    signal,
  }, choice, selection, { attachments }),

  continuePlan: (
    sessionId: string | number,
    messageId: string | number,
    stepIndex: number,
    executionId: string,
    onStart?: (sessionId: string | number, messageId: string | number) => void,
    onDelta?: (delta: string) => void,
    onProgress?: (progress: AgentChatProgress) => void,
    signal?: AbortSignal,
  ) => mockAgentEngine.continuePlan(sessionId, messageId, stepIndex, executionId, {
    onStart,
    onDelta,
    onProgress,
    signal,
  }),
};
