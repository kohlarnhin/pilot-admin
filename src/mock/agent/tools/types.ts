import type {
  AgentAttachmentMetadata,
  AgentChoice,
  AgentExecutionPlan,
  AgentInteraction,
  AgentPageActionOutcome,
  AgentTaskContext,
  Menu,
} from '@/types';

export interface ToolInput {
  attachments?: AgentAttachmentMetadata[];
}

export interface ToolContext {
  text: string;
  userId: string;
  menus: Menu[];
  permissions: string[];
  attachments: AgentAttachmentMetadata[];
  signal?: AbortSignal;
}

export interface ToolReply {
  message: string;
  choices?: AgentChoice[];
  interaction?: AgentInteraction;
  data_changed?: boolean;
  task?: Record<string, unknown>;
}

/** 工具拥有整段交互；引擎只负责按消息中的 tool 路由与持久化。 */
export interface AgentTool {
  id: string;
  match: (text: string, ctx: ToolContext) => boolean;
  handle: (ctx: ToolContext) => Promise<ToolReply>;
  onChoice?: (ctx: ToolContext, choiceId: string, task: AgentTaskContext) => Promise<ToolReply>;
  onSelection?: (ctx: ToolContext, selectedIds: string[], task: AgentTaskContext) => Promise<ToolReply>;
  onActionOutcome?: (
    ctx: ToolContext,
    outcome: AgentPageActionOutcome,
    task: AgentTaskContext,
  ) => Promise<ToolReply>;
  plan?: {
    runStep: (
      ctx: ToolContext,
      plan: AgentExecutionPlan,
      stepIndex: number,
      task: AgentTaskContext,
    ) => Promise<ToolReply>;
  };
}
