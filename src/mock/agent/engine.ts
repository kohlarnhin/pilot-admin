import { t } from '@/i18n';
import { localizeCommandPrompt } from '@/agent/commands';
import type {
  AgentChatProgress,
  AgentChatResult,
  AgentExecutionPlan,
  AgentMessage,
  AgentPageActionOutcome,
  AgentSession,
  AgentSessionDetail,
  AgentTaskContext,
  PageResult,
} from '@/types';
import { ApiRequestError } from '@/api/http';
import { currentUser, requirePermission } from '../access';
import { getMockDb, updateMockDb } from '../db';
import { delay, pageResult } from '../helpers';
import type { MockAgentSession } from '../seed';
import { agentTools } from './tools';
import { createToolContext, denied, toolInputInteraction, wait } from './tools/helpers';
import type { AgentTool, ToolContext, ToolInput, ToolReply } from './tools/types';
import { createId } from '@/utils/id';

export interface StreamCallbacks {
  onStart?: (sessionId: string | number, userMessageId: string | number) => void;
  onDelta?: (delta: string) => void;
  onProgress?: (progress: AgentChatProgress) => void;
  signal?: AbortSignal;
}

export interface ChatSelection {
  assistantMessageId: string | number;
  selectedIds: string[];
}

export interface ChatChoice {
  assistantMessageId: string | number;
  choiceId: string;
}

export interface PlanCommand {
  action: 'confirm' | 'resume' | 'stop' | 'complete' | 'fail';
  executionId?: string;
  stepIndex?: number;
  errorCode?: string;
}

interface RoutedReply extends ToolReply {
  task_context?: AgentTaskContext;
}

const authorize = () => {
  const user = requirePermission('agent:use');
  if (!getMockDb().agentConfigs.some((config) => config.status === 1)) {
    throw new ApiRequestError(t('serverErrors.agent.noModel'), 400, 1501);
  }
  return user;
};

function sessionOf(id: string | number, finishingAction = false): MockAgentSession {
  // 已打开操作的结果允许由原会话所有者收尾；执行工具仍逐次校验权限。
  const user = finishingAction ? currentUser() : requirePermission('agent:use');
  const session = getMockDb().agentSessions.find((item) => String(item.id) === String(id) && item.userId === user.id);
  if (!session) {
    throw new ApiRequestError(t('serverErrors.agent.sessionNotFound'), 404);
  }
  return session;
}

function amendSession(id: string | number, mutate: (session: MockAgentSession) => void, finishingAction = false) {
  sessionOf(id, finishingAction);
  updateMockDb((db) => {
    const session = db.agentSessions.find((item) => String(item.id) === String(id))!;
    mutate(session);
    session.messages = session.messages.slice(-200);
    session.message_count = session.messages.length;
    session.context_character_count = session.messages.reduce((sum, message) => sum + message.content.length, 0);

    const others = db.agentSessions.filter((item) => item.userId !== session.userId);
    const own = db.agentSessions
      .filter((item) => item.userId === session.userId)
      .sort((a, b) => b.last_message_date.localeCompare(a.last_message_date))
      .slice(0, 60);
    db.agentSessions = [...others, ...own];
  });
}

function append(
  id: string | number,
  role: AgentMessage['role'],
  content: string,
  extra: Partial<AgentMessage> = {},
  finishingAction = false,
): AgentMessage {
  const session = sessionOf(id, finishingAction);
  const message: AgentMessage = {
    id: createId(),
    sequence_no: (session.messages.at(-1)?.sequence_no || 0) + 1,
    role,
    content: content.slice(0, 16000),
    data_changed: false,
    create_date: new Date().toISOString(),
    ...extra,
  };

  amendSession(id, (item) => {
    item.messages.push(message);
    item.last_message_date = message.create_date;
  }, finishingAction);
  return message;
}

const resultOf = (sessionId: string | number, message: AgentMessage): AgentChatResult => ({
  sessionId,
  messageId: message.id,
  message: message.content,
  choices: message.choices || [],
  interaction: message.interaction,
  data_changed: message.data_changed,
});

const withTool = (tool: AgentTool, reply: ToolReply): RoutedReply => ({
  ...reply,
  task_context: { tool: tool.id, data: reply.task || {} },
});

function toolOf(message: AgentMessage) {
  const task = message.task_context;
  const tool = agentTools.find((item) => item.id === task?.tool);
  if (!tool || !task) {
    throw new ApiRequestError(t('serverErrors.agent.interactionExpired'), 400);
  }
  return { tool, task };
}

async function routeReply(
  ctx: ToolContext,
  target?: AgentMessage,
  choice?: ChatChoice,
  selection?: ChatSelection,
): Promise<RoutedReply> {
  if (choice?.choiceId.startsWith('prompt:')) {
    ctx = { ...ctx, text: localizeCommandPrompt(choice.choiceId.slice(7)) };
  } else if (choice?.choiceId === 'cancel') {
    return { message: t('agentTools.engine.cancelled') };
  } else if (choice && target) {
    const { tool, task } = toolOf(target);
    if (!tool.onChoice) {
      throw new ApiRequestError(t('serverErrors.agent.choiceUnsupported'), 400);
    }
    return withTool(tool, await tool.onChoice(ctx, choice.choiceId, task));
  } else if (selection && target) {
    const { tool, task } = toolOf(target);
    if (!tool.onSelection) {
      throw new ApiRequestError(t('serverErrors.agent.selectionUnsupported'), 400);
    }
    return withTool(tool, await tool.onSelection(ctx, selection.selectedIds, task));
  }

  const tool = agentTools.find((item) => item.match(ctx.text, ctx));
  if (!tool) {
    throw new ApiRequestError(t('serverErrors.agent.toolUnavailable'), 400);
  }
  return withTool(tool, await tool.handle(ctx));
}

async function streamReply(
  id: string | number,
  reply: RoutedReply,
  callbacks: StreamCallbacks,
): Promise<AgentChatResult> {
  const { signal, onDelta } = callbacks;
  let partial = '';

  try {
    for (let offset = 0; offset < reply.message.length; offset += 12) {
      await wait(38, signal);
      authorize();
      const delta = reply.message.slice(offset, offset + 12);
      partial += delta;
      onDelta?.(delta);
    }

    signal?.throwIfAborted();
    const message = append(id, 'assistant', reply.message, {
      choices: reply.choices,
      interaction: reply.interaction,
      data_changed: Boolean(reply.data_changed),
      task_context: reply.task_context,
    });
    return resultOf(id, message);
  } catch (error) {
    if (signal?.aborted && partial && currentUser().id === sessionOf(id).userId) {
      append(id, 'assistant', t('agentTools.engine.stoppedSuffix', { partial }));
    }
    throw error;
  }
}

export const mockAgentEngine = {
  async getSessions(pageNo: number, pageSize: number): Promise<PageResult<AgentSession>> {
    await delay();
    const user = requirePermission('agent:use');
    const sessions = getMockDb().agentSessions
      .filter((item) => item.userId === user.id)
      .sort((a, b) => b.last_message_date.localeCompare(a.last_message_date))
      .map(({ messages: _messages, userId: _userId, ...session }) => session);

    return structuredClone(pageResult(sessions, { pageNo, pageSize }));
  },

  async getSessionDetail(id: string | number, limit = 20, before?: number): Promise<AgentSessionDetail> {
    await delay();
    const { userId: _userId, messages, ...session } = sessionOf(id);
    const eligible = messages.filter((message) => before === undefined || message.sequence_no < before);
    const records = eligible.slice(-Math.min(50, Math.max(1, limit)));

    return structuredClone({
      ...session,
      messages: records,
      has_more_before: eligible.length > records.length,
    });
  },

  async chatStream(
    id: string | number | null,
    text: string,
    callbacks: StreamCallbacks,
    choice?: ChatChoice,
    selection?: ChatSelection,
    input: ToolInput = {},
  ): Promise<AgentChatResult> {
    const actor = authorize();
    callbacks.signal?.throwIfAborted();

    if (!id) {
      id = createId();
      const date = new Date().toISOString();
      updateMockDb((db) => {
        db.agentSessions.unshift({
          id: id!,
          userId: actor.id,
          title: text.slice(0, 40),
          messages: [],
          message_count: 0,
          context_character_count: 0,
          create_date: date,
          last_message_date: date,
        });
      });
    }

    const sessionId = id;
    const targetId = choice?.assistantMessageId ?? selection?.assistantMessageId;
    const target = targetId
      ? sessionOf(id).messages.find((message) => String(message.id) === String(targetId))
      : undefined;

    if (targetId && (!target || target.selected_choice_id || target !== sessionOf(id).messages.at(-1))) {
      throw new ApiRequestError(t('serverErrors.agent.interactionSubmitted'), 400);
    }
    if (choice && !target?.choices?.some((item) => item.id === choice.choiceId)) {
      throw new ApiRequestError(t('serverErrors.agent.invalidChoice'), 400);
    }
    if (selection) {
      const form = target?.interaction;
      if (form?.type !== 'selection'
        || selection.selectedIds.length < form.minSelected
        || selection.selectedIds.length > form.maxSelected
        || new Set(selection.selectedIds).size !== selection.selectedIds.length
        || selection.selectedIds.some((selectedId) => !form.options.some((option) => option.id === selectedId && !option.disabled))) {
        throw new ApiRequestError(t('serverErrors.agent.invalidSelection'), 400);
      }
    }

    const ctx = createToolContext(text, callbacks.signal, input);
    const userMessage = append(id, 'user', text, {
      source_message_id: targetId,
      selected_choice_id: choice?.choiceId || (selection ? 'selection' : undefined),
      interaction: toolInputInteraction(ctx) || (selection ? {
        type: 'selection_submission',
        selectedIds: selection.selectedIds,
      } : undefined),
    });

    if (target) {
      amendSession(id, (session) => {
        session.messages.find((message) => message.id === target.id)!.selected_choice_id = choice?.choiceId || 'selection';
      });
    }
    callbacks.onStart?.(id, userMessage.id);
    callbacks.onProgress?.({
      stage: 'thinking',
      message: t('agentTools.engine.thinking'),
      elapsedSeconds: 0,
    });

    try {
      await wait(650, callbacks.signal);
      const reply = await routeReply(ctx, target, choice, selection);
      callbacks.signal?.throwIfAborted();
      callbacks.onProgress?.({
        stage: 'responding',
        message: t('agentTools.engine.responding'),
        elapsedSeconds: 1,
      });
      return await streamReply(sessionId, reply, callbacks);
    } catch (error) {
      if (callbacks.signal?.aborted) {
        throw error;
      }
      if (error instanceof ApiRequestError && error.status === 403) {
        return streamReply(sessionId, denied(t('agentTools.operations.perform')), callbacks);
      }
      append(sessionId, 'assistant', error instanceof Error ? error.message : t('agentTools.engine.failed'), { kind: 'error' });
      throw error;
    }
  },

  async getPlan(id: string | number, messageId: string | number): Promise<AgentExecutionPlan> {
    const plan = sessionOf(id).messages.find((message) => String(message.id) === String(messageId))?.interaction;
    if (plan?.type !== 'execution_plan') {
      throw new ApiRequestError(t('serverErrors.agent.planNotFound'), 404);
    }
    return structuredClone(plan);
  },

  async updatePlan(
    id: string | number,
    messageId: string | number,
    command: PlanCommand,
  ): Promise<AgentExecutionPlan> {
    authorize();
    const plan = await this.getPlan(id, messageId);

    if (command.action === 'stop') {
      plan.status = 'stopped';
      plan.reason = t('agentTools.engine.planStopped');
      plan.steps.forEach((step) => {
        if (step.status === 'pending') {
          step.status = 'stopped';
        }
      });
    } else if (command.action === 'confirm' || command.action === 'resume') {
      if (plan.status === 'completed' || plan.status === 'running') {
        throw new ApiRequestError(t('serverErrors.agent.planExecuted'), 409);
      }
      plan.status = 'running';
      plan.reason = undefined;
      plan.executionId = createId();
      plan.steps.forEach((step) => {
        if (step.status !== 'completed') {
          step.status = 'pending';
        }
      });
    } else if (command.action === 'fail') {
      plan.status = 'failed';
      plan.reason = t('agentTools.engine.planInterrupted');
    }

    amendSession(id, (session) => {
      session.messages.find((message) => String(message.id) === String(messageId))!.interaction = plan;
    });
    return structuredClone(plan);
  },

  async continuePlan(
    id: string | number,
    messageId: string | number,
    index: number,
    executionId: string,
    callbacks: StreamCallbacks,
  ): Promise<AgentChatResult> {
    authorize();
    let plan = await this.getPlan(id, messageId);
    if (plan.executionId !== executionId || plan.status !== 'running'
      || plan.steps.findIndex((step) => step.status !== 'completed') !== index) {
      throw new ApiRequestError(t('serverErrors.agent.planChanged'), 409);
    }

    const target = sessionOf(id).messages.find((message) => String(message.id) === String(messageId))!;
    const { tool, task } = toolOf(target);
    if (!tool.plan) {
      throw new ApiRequestError(t('serverErrors.agent.planUnsupported'), 400);
    }

    plan.steps[index].status = 'running';
    amendSession(id, (session) => {
      session.messages.find((message) => String(message.id) === String(messageId))!.interaction = plan;
    });
    const userMessage = append(id, 'user', t('agentTools.engine.executeStep', { title: plan.steps[index].title }), {
      source_message_id: messageId,
      selected_choice_id: 'plan_step',
    });
    callbacks.onStart?.(id, userMessage.id);
    callbacks.onProgress?.({
      stage: 'checking',
      message: t('agentTools.engine.checking', { title: plan.steps[index].title }),
      elapsedSeconds: 0,
    });

    try {
      const ctx = createToolContext('', callbacks.signal);
      const reply = await tool.plan.runStep(ctx, plan, index, task);
      const result = await streamReply(id, withTool(tool, reply), callbacks);
      plan = await this.getPlan(id, messageId);

      // 停止只阻止下一步，当前步骤仍按真实完成结果落盘。
      if (plan.executionId === executionId) {
        plan.steps[index].status = 'completed';
        if (plan.steps.every((step) => step.status === 'completed')) {
          plan.status = 'completed';
        }
        amendSession(id, (session) => {
          const message = session.messages.find((item) => String(item.id) === String(messageId))!;
          message.interaction = plan;
          if (reply.task) {
            message.task_context = { tool: tool.id, data: reply.task };
          }
        });
      }
      return result;
    } catch (error) {
      plan = await this.getPlan(id, messageId);
      if (plan.executionId === executionId) {
        plan.status = 'failed';
        plan.steps[index].status = 'failed';
        plan.reason = t('agentTools.engine.stepInterrupted');
        amendSession(id, (session) => {
          session.messages.find((message) => String(message.id) === String(messageId))!.interaction = plan;
        });
      }
      throw error;
    }
  },

  async recordPageActionOutcome(
    id: string,
    messageId: string,
    outcome: Omit<AgentPageActionOutcome, 'finishedAt'>,
  ): Promise<AgentChatResult> {
    const message = sessionOf(id, true).messages.find((item) => String(item.id) === messageId);
    if (message?.interaction?.type !== 'page_action' || message.interaction.action !== 'modal') {
      throw new ApiRequestError(t('serverErrors.agent.actionNotFound'), 404);
    }

    const previousResult = () => {
      const messages = sessionOf(id, true).messages;
      const target = messages.find((item) => String(item.id) === messageId);
      if (target?.interaction?.type !== 'page_action' || !target.interaction.outcome) {
        return undefined;
      }
      const existing = messages.find((item) => String(item.source_message_id) === messageId && item.role === 'assistant');
      if (!existing) {
        throw new ApiRequestError(t('serverErrors.agent.resultSaved'), 409);
      }
      return resultOf(id, existing);
    };
    const existing = previousResult();
    if (existing) {
      return existing;
    }

    const { tool, task } = toolOf(message);
    const saved = { ...outcome, finishedAt: new Date().toISOString() };
    const reply = tool.onActionOutcome
      ? await tool.onActionOutcome(createToolContext(''), saved, task)
      : { message: outcome.status === 'cancelled' ? t('agentTools.engine.actionCancelled') : outcome.summary };

    // 工具 hook 可能异步；再次检查，避免并发提交重复追加结果。
    const concurrentResult = previousResult();
    if (concurrentResult) {
      return concurrentResult;
    }
    amendSession(id, (session) => {
      const target = session.messages.find((item) => String(item.id) === messageId)!;
      if (target.interaction?.type === 'page_action') {
        target.interaction.outcome = saved;
      }
    }, true);
    const result = append(id, 'assistant', reply.message, {
      source_message_id: messageId,
      choices: reply.choices,
      interaction: reply.interaction,
      data_changed: Boolean(reply.data_changed),
      task_context: withTool(tool, reply).task_context,
    }, true);
    return resultOf(id, result);
  },
};
