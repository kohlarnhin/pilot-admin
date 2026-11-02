import { t } from '@/i18n';
import { localizeCommandPrompt } from '@/agent/commands';
import { ApiRequestError } from '@/api/errors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { agentService } from '@/api/services/agentService';
import { DEMO_DATA_RESET_EVENT } from '@/api/services/settingsService';
import { AGENT_CONFIG_CHANGED_EVENT } from '@/api/services/agentProfileService';
import { agentConfigService } from '@/api/services/agentConfigService';
import type { AgentAttachmentMetadata, AgentChatProgress, AgentChatResult, AgentChoice, AgentSession,
  AgentExecutionPlan, AgentPageAction } from '@/types';
import {
  type AssistantMessage,
  conversationStorageKey,
  readConversationState,
  writeConversation,
} from './conversationStorage';
import {
  createMessage,
  createMessageId,
  isLegacyGreeting,
  MAX_INPUT_LENGTH,
  readableError,
  toAssistantMessage,
} from './assistantUtils';
interface ChoiceSelection {
  messageId: string;
  choiceId: string;
}

interface SelectionSubmission {
  messageId: string;
  selectedIds: string[];
}

export function useAssistantChat(userId: string, isOpen: boolean, onResult?: (result: AgentChatResult) => void) {
  const resultHandlerRef = useRef(onResult);
  resultHandlerRef.current = onResult;
  const storageKey = conversationStorageKey(userId);
  const [initial] = useState(() => readConversationState(storageKey));
  const [messages, setMessages] = useState<AssistantMessage[]>(() =>
    initial.messages.filter((message, index) => !(index === 0 && initial.sessionId === null
      && message.sequenceNo === undefined && message.kind === 'message'
      && message.role === 'assistant' && isLegacyGreeting(message.content))));
  const [draft, setDraft] = useState(() => initial.draft.slice(0, MAX_INPUT_LENGTH));
  const [activeSessionId, setActiveSessionId] = useState(initial.sessionId);
  const [hasConfig, setHasConfig] = useState<boolean | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [requestProgress, setRequestProgress] = useState<AgentChatProgress | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionHasNext, setSessionHasNext] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [hasMoreBefore, setHasMoreBefore] = useState(() =>
    Boolean(initial.sessionId && initial.messages.some(message => message.sequenceNo !== undefined)));
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const messagesRef = useRef(messages);
  const activeSessionIdRef = useRef(activeSessionId);
  const activeRequestRef = useRef<AbortController | null>(null);
  const latestProgressSequenceRef = useRef<number | null>(null);
  const loadingOlderRef = useRef(false);
  const loadingSessionsRef = useRef(false);
  const sessionRequestRef = useRef(0);
  const failedSessionRequestRef = useRef({ page: 1, append: false });
  const loadingDetailRef = useRef(false);
  const detailRequestRef = useRef(0);
  const persistedStateRef = useRef({ messages, draft, sessionId: activeSessionId });
  const lifecycleGenerationRef = useRef({ value: 0 });
  const [planBusyMessageId, setPlanBusyMessageId] = useState<string | null>(null);
  const planRunRef = useRef<{ id: number; messageId: string; executionId: string; stopped: boolean;
    suspended: boolean; turns: number } | null>(null);
  const planRunIdRef = useRef(0);
  const stopPlanForInputRef = useRef<(messageId: string) => void>(() => {});
  persistedStateRef.current = { messages, draft, sessionId: activeSessionId };

  const latestMessage = messages[messages.length - 1];
  const activeChoiceMessageId = !isSending
    && latestMessage?.role === 'assistant'
    && latestMessage.kind === 'message'
    && latestMessage.choices?.length
    && !messages.some(message => message.sourceMessageId === latestMessage.id)
    && !latestMessage.selectedChoiceId
    ? latestMessage.id
    : null;
  const activeSelectionMessageId = !isSending && !isReconciling
    && latestMessage?.role === 'assistant' && latestMessage.kind === 'message'
    && latestMessage.interaction?.type === 'selection'
    && !messages.some(message => message.sourceMessageId === latestMessage.id)
    ? latestMessage.id : null;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = () => {
      void agentConfigService.hasEnabledConfig().then(value => { if (!cancelled) setHasConfig(value); })
        .catch(() => { if (!cancelled) setHasConfig(false); });
    };
    load();
    window.addEventListener(AGENT_CONFIG_CHANGED_EVENT, load);
    return () => { cancelled = true; window.removeEventListener(AGENT_CONFIG_CHANGED_EVENT, load); };
  }, [isOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeConversation(storageKey, messages, { draft, sessionId: activeSessionId });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [storageKey, messages, draft, activeSessionId]);

  useEffect(() => {
    const lifecycleGeneration = lifecycleGenerationRef.current;
    const generation = ++lifecycleGeneration.value;
    const persist = () => {
      const state = persistedStateRef.current;
      writeConversation(storageKey, state.messages, { draft: state.draft, sessionId: state.sessionId });
    };
    window.addEventListener('pagehide', persist);
    return () => {
      window.removeEventListener('pagehide', persist);
      persist();
      // StrictMode 的同步重挂继续使用同一请求；真正卸载才取消，避免历史对账永远停在加载态。
      queueMicrotask(() => {
        if (lifecycleGeneration.value !== generation) return;
        planRunRef.current = null;
        activeRequestRef.current?.abort();
        activeRequestRef.current = null;
        detailRequestRef.current += 1;
      });
    };
  }, [storageKey]);

  const updateMessages = useCallback((updater: (current: AssistantMessage[]) => AssistantMessage[]) => {
    const next = updater(messagesRef.current);
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const selectSession = useCallback((sessionId: string | number | null) => {
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
  }, []);

  const loadOlderMessages = useCallback(async () => {
    const sessionId = activeSessionIdRef.current;
    if (!sessionId || !hasMoreBefore || loadingOlderRef.current
      || loadingDetailRef.current || activeRequestRef.current) return false;
    const firstMessage = messagesRef.current.find(message => message.sequenceNo !== undefined);
    if (firstMessage?.sequenceNo === undefined) return false;

    loadingOlderRef.current = true;
    setIsLoadingMoreMessages(true);
    const detailRequest = detailRequestRef.current;
    try {
      const detail = await agentService.getSessionDetail(sessionId, 20, firstMessage.sequenceNo);
      if (detailRequest !== detailRequestRef.current) return false;
      const mapped = detail.messages.map(toAssistantMessage);
      updateMessages(current => {
        const existingIds = new Set(current.map(message => message.id));
        return [...mapped.filter(message => !existingIds.has(message.id)), ...current];
      });
      setHasMoreBefore(detail.has_more_before);
      return true;
    } catch {
      toast.error(t('assistant.errors.loadOlder'));
      return false;
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingMoreMessages(false);
    }
  }, [hasMoreBefore, updateMessages]);

  const loadSessions = useCallback(async (page = 1, append = false) => {
    if (loadingSessionsRef.current) return;
    loadingSessionsRef.current = true;
    const request = ++sessionRequestRef.current;
    failedSessionRequestRef.current = { page, append };
    setIsLoadingSessions(true);
    setSessionError('');
    try {
      const result = await agentService.getSessions(page, 20);
      if (request !== sessionRequestRef.current) return;
      setSessions(current => append ? [...current, ...result.records.filter(item => !current.some(old => String(old.id) === String(item.id)))] : result.records);
      // HTTP normalizes response keys to snake_case; the public page type uses hasNext.
      setSessionHasNext('has_next' in result ? Boolean(result.has_next) : result.hasNext);
      setSessionPage(page);
    } catch {
      if (request !== sessionRequestRef.current) return;
      setSessionError(t('assistant.errors.loadHistory'));
    } finally {
      if (request === sessionRequestRef.current) {
        loadingSessionsRef.current = false;
        setIsLoadingSessions(false);
      }
    }
  }, []);

  const retrySessions = useCallback(() => {
    const request = failedSessionRequestRef.current;
    void loadSessions(request.page, request.append);
  }, [loadSessions]);

  const openHistory = useCallback(() => {
    setShowHistory(true);
    void loadSessions();
  }, [loadSessions]);

  const loadSessionDetail = useCallback(async (sessionId: string | number) => {
    if (activeRequestRef.current || loadingDetailRef.current || planRunRef.current) return;
    if (String(sessionId) === String(activeSessionIdRef.current)) {
      setShowHistory(false);
      return;
    }
    const previousMessages = messagesRef.current;
    const previousSessionId = activeSessionIdRef.current;
    const previousHasMoreBefore = hasMoreBefore;
    const request = ++detailRequestRef.current;
    loadingDetailRef.current = true;
    setIsLoadingSession(true);
    selectSession(sessionId);
    setHasMoreBefore(false);
    updateMessages(() => []);
    setShowHistory(false);
    planRunRef.current = null;
    setPlanBusyMessageId(null);

    try {
      const detail = await agentService.getSessionDetail(sessionId, 20);
      if (request !== detailRequestRef.current) return;
      updateMessages(() => detail.messages.map(toAssistantMessage));
      setHasMoreBefore(detail.has_more_before);
    } catch (error) {
      if (request !== detailRequestRef.current) return;
      toast.error(t('assistant.errors.loadConversation'));
      const missing = error instanceof ApiRequestError && error.status === 404;
      selectSession(missing ? null : previousSessionId);
      updateMessages(() => missing ? [] : previousMessages);
      setHasMoreBefore(missing ? false : previousHasMoreBefore);
    } finally {
      if (request === detailRequestRef.current) {
        loadingDetailRef.current = false;
        setIsLoadingSession(false);
      }
    }
  }, [hasMoreBefore, selectSession, updateMessages]);

  // 首次展示用持久层对账，避免硬刷新遗留交互状态。
  const reconciledHistoryRef = useRef(false);
  useEffect(() => {
    if (!isOpen || reconciledHistoryRef.current || activeRequestRef.current || loadingDetailRef.current) return;
    reconciledHistoryRef.current = true;
    const sessionId = activeSessionIdRef.current;
    if (!sessionId) return;
    const request = ++detailRequestRef.current;
    loadingDetailRef.current = true;
    setIsReconciling(true);
    void agentService.getSessionDetail(sessionId, 20).then(detail => {
      if (request !== detailRequestRef.current) return;
      updateMessages(() => detail.messages.map(toAssistantMessage));
      setHasMoreBefore(detail.has_more_before);
    }).catch((error) => {
      if (request !== detailRequestRef.current) return;
      toast.error(t('assistant.errors.loadConversation'));
      if (error instanceof ApiRequestError && error.status === 404) {
        selectSession(null);
        updateMessages(() => []);
        setHasMoreBefore(false);
      } else {
        // 暂时失败保留本地会话，下次打开时重新对账。
        reconciledHistoryRef.current = false;
      }
    }).finally(() => {
      if (request === detailRequestRef.current) {
        loadingDetailRef.current = false;
        setIsReconciling(false);
      }
    });
  }, [isOpen, selectSession, updateMessages]);

  const startNewConversation = useCallback(() => {
    if (activeRequestRef.current || loadingDetailRef.current || planRunRef.current) return;
    detailRequestRef.current += 1;
    selectSession(null);
    updateMessages(() => []);
    setDraft('');
    setHasMoreBefore(false);
    setShowHistory(false);
    setRequestProgress(null);
    planRunRef.current = null;
    setPlanBusyMessageId(null);
    toast.success(t('assistant.toast.newConversation'));
  }, [selectSession, updateMessages]);

  const sendContent = useCallback(async (rawContent: string, selection?: ChoiceSelection,
    selectionSubmission?: SelectionSubmission, attachments?: AgentAttachmentMetadata[]) => {
    const content = rawContent.trim();
    if (!content || (!selectionSubmission && (content.length > MAX_INPUT_LENGTH || hasConfig === false))
      || activeRequestRef.current || loadingDetailRef.current) return;

    const currentMessages = messagesRef.current;
    if (selection) {
      const targetMessage = currentMessages[currentMessages.length - 1];
      const selectable = targetMessage?.id === selection.messageId
        && targetMessage.role === 'assistant'
        && !targetMessage.selectedChoiceId
        && targetMessage.choices?.some(choice => choice.id === selection.choiceId);
      if (!selectable) return;
    }
    if (selectionSubmission) {
      const target = currentMessages[currentMessages.length - 1];
      if (selection || target?.id !== selectionSubmission.messageId || target.role !== 'assistant'
        || target.interaction?.type !== 'selection'
        || currentMessages.some(message => message.sourceMessageId === target.id)) return;
      const selectable = new Set(target.interaction.options.filter(option => !option.disabled).map(option => option.id));
      const ids = selectionSubmission.selectedIds;
      if (ids.length < target.interaction.minSelected || ids.length > target.interaction.maxSelected
        || new Set(ids).size !== ids.length || ids.some(id => !selectable.has(id))) return;
    }

    // 新普通消息停止旧计划；选择提交属于当前交互。
    const planToStop = planRunRef.current?.messageId
      ?? currentMessages.filter(message => message.interaction?.type === 'execution_plan'
        && (message.interaction.status === 'running' || message.interaction.status === 'waiting_user')).at(-1)?.id;
    if (!selection && !selectionSubmission && planToStop) {
      stopPlanForInputRef.current(planToStop);
    }
    const userMessage = createMessage('user', content);
    if (attachments?.length) userMessage.interaction = { type: 'attachment_metadata', attachments };
    if (selection) {
      userMessage.sourceMessageId = selection.messageId;
      userMessage.selectedChoiceId = selection.choiceId;
    }
    if (selectionSubmission) {
      userMessage.sourceMessageId = selectionSubmission.messageId;
      userMessage.selectedChoiceId = 'selection';
      userMessage.interaction = { type: 'selection_submission', selectedIds: selectionSubmission.selectedIds };
    }
    const preparedMessages = selection
      ? currentMessages.map(message => message.id === selection.messageId
        ? { ...message, selectedChoiceId: selection.choiceId }
        : message)
      : currentMessages;
    updateMessages(() => [...preparedMessages, userMessage]);
    // 卡片提交不消费输入框中另写的草稿。
    if (!selection && !selectionSubmission) setDraft('');
    setIsSending(true);
    latestProgressSequenceRef.current = null;
    setRequestProgress({
      stage: 'preparing',
      message: selectionSubmission ? t('assistant.progress.selection') : selection ? t('assistant.progress.confirmed') : t('assistant.progress.preparing'),
      elapsedSeconds: 0,
    });

    const assistantMessageId = createMessageId();
    setStreamingMessageId(assistantMessageId);
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const requestSessionId = activeSessionIdRef.current;
    let streamedText = '';
    let hasAddedAssistantMessage = false;

    const onStart = (newSessionId: string | number, userMessageId: string | number) => {
      if (activeRequestRef.current !== controller) return;
      if (!requestSessionId) selectSession(newSessionId);
      updateMessages(current => current.map(message => message.id === userMessage.id
        ? { ...message, id: String(userMessageId) }
        : message));
    };

    const onDelta = (delta: string) => {
      if (activeRequestRef.current !== controller) return;
      streamedText += delta;
      if (!hasAddedAssistantMessage) {
        hasAddedAssistantMessage = true;
        updateMessages(current => [
          ...current,
          { ...createMessage('assistant', streamedText), id: assistantMessageId },
        ]);
      } else {
        updateMessages(current => current.map(message => message.id === assistantMessageId
          ? { ...message, content: streamedText }
          : message));
      }
    };

    const onProgress = (progress: AgentChatProgress) => {
      if (activeRequestRef.current !== controller) return;
      const latestSequence = latestProgressSequenceRef.current;
      const staleProgress = progress.sequenceNo !== undefined
        && latestSequence !== null
        && progress.sequenceNo < latestSequence;
      if (!staleProgress) {
        if (progress.sequenceNo !== undefined) latestProgressSequenceRef.current = progress.sequenceNo;
        setRequestProgress(progress);
      }
      if (progress.messageId === undefined || progress.messageId === null) return;

      const progressMessageId = String(progress.messageId);
      updateMessages(current => {
        const existing = current.find(message => message.id === progressMessageId);
        if (existing) {
          return current.map(message => message.id === progressMessageId
            ? {
                ...message,
                content: progress.message,
                sequenceNo: progress.sequenceNo ?? message.sequenceNo,
                kind: 'progress',
                progressStage: progress.stage,
                elapsedSeconds: progress.elapsedSeconds,
              }
            : message);
        }
        return [
          ...current,
          {
            id: progressMessageId,
            sequenceNo: progress.sequenceNo,
            role: 'assistant' as const,
            content: progress.message,
            createdAt: progress.createDate || new Date().toISOString(),
            kind: 'progress' as const,
            progressStage: progress.stage,
            elapsedSeconds: progress.elapsedSeconds,
          },
        ].sort((left, right) => {
          if (left.sequenceNo === undefined || right.sequenceNo === undefined) return 0;
          return left.sequenceNo - right.sequenceNo;
        });
      });
    };

    try {
      const result = await agentService.chatStream(
        requestSessionId,
        content,
        onStart,
        onDelta,
        onProgress,
        controller.signal,
        selection ? { assistantMessageId: selection.messageId, choiceId: selection.choiceId } : undefined,
        false,
        selectionSubmission ? { assistantMessageId: selectionSubmission.messageId, selectedIds: selectionSubmission.selectedIds } : undefined,
        attachments
      );
      if (activeRequestRef.current !== controller) return;
      updateMessages(current => {
        const persistedMessageId = result.messageId ? String(result.messageId) : assistantMessageId;
        if (current.some(message => message.id === assistantMessageId)) {
          return current.map(message => message.id === assistantMessageId
            ? { ...message, id: persistedMessageId, content: result.message, choices: result.choices, interaction: result.interaction }
            : message);
        }
        return [...current, {
          ...createMessage('assistant', result.message, 'message', result.choices),
          id: persistedMessageId,
          interaction: result.interaction,
        }];
      });
      resultHandlerRef.current?.(result);
    } catch (error) {
      if (controller.signal.aborted || activeRequestRef.current !== controller) return;
      if ((selection || selectionSubmission) && requestSessionId) {
        try {
          const detail = await agentService.getSessionDetail(requestSessionId, 20);
          if (activeRequestRef.current !== controller) return;
          const reconciled = detail.messages.map(toAssistantMessage);
          updateMessages(() => reconciled.length > 0 ? reconciled : currentMessages);
          setHasMoreBefore(detail.has_more_before);
        } catch {
          if (activeRequestRef.current !== controller) return;
          updateMessages(() => currentMessages);
        }
        toast.error(readableError(error));
      } else {
        updateMessages(current => [
          ...current.filter(message => message.id !== assistantMessageId),
          createMessage('assistant', readableError(error), 'error'),
        ]);
      }
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setStreamingMessageId(null);
        setRequestProgress(null);
        latestProgressSequenceRef.current = null;
        setIsSending(false);
      }
    }
  }, [hasConfig, selectSession, updateMessages]);

  const stopGenerating = useCallback(() => {
    const controller = activeRequestRef.current;
    if (!controller) return;
    controller?.abort();
    activeRequestRef.current = null;
    if (controller && streamingMessageId) updateMessages(current => current.some(message => message.id === streamingMessageId)
      ? current.map(message => message.id === streamingMessageId ? { ...message, stopped: true } : message)
      : [...current, { ...createMessage('assistant', t('assistant.messages.stopReply')), id: streamingMessageId, stopped: true }]);
    setStreamingMessageId(null);
    setRequestProgress(null);
    latestProgressSequenceRef.current = null;
    setIsSending(false);
  }, [streamingMessageId, updateMessages]);

  const applyPlan = useCallback((messageId: string, plan: AgentExecutionPlan) => {
    updateMessages(current => current.map(message => message.id === messageId
      ? { ...message, interaction: plan } : message));
  }, [updateMessages]);

  const planOf = useCallback((messageId: string): AgentExecutionPlan | undefined => {
    const message = messagesRef.current.find(item => item.id === messageId);
    return message?.interaction?.type === 'execution_plan' ? message.interaction : undefined;
  }, []);

  const patchPlan = useCallback(async (messageId: string,
    command: { action: 'confirm' | 'resume' | 'stop' | 'complete' | 'fail'; executionId?: string;
      stepIndex?: number; errorCode?: string }) => {
    const sessionId = activeSessionIdRef.current;
    if (!sessionId) throw new Error(t('serverErrors.agent.sessionNotFound'));
    const plan = await agentService.updatePlan(sessionId, messageId, command);
    applyPlan(messageId, plan);
    return plan;
  }, [applyPlan]);

  /** 计划续跑的一轮模型执行，流式展示并按服务端状态更新计划卡片。 */
  const continuePlanStep = useCallback(async (run: { id: number; messageId: string; executionId: string },
    stepIndex: number): Promise<boolean> => {
    const sessionId = activeSessionIdRef.current;
    if (!sessionId || activeRequestRef.current || planRunRef.current?.id !== run.id) return false;
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setIsSending(true);
    setRequestProgress({ stage: 'planning', message: t('assistant.progress.nextStep'), elapsedSeconds: 0 });
    const assistantMessageId = createMessageId();
    setStreamingMessageId(assistantMessageId);
    let streamedText = '';
    let added = false;
    try {
      const result = await agentService.continuePlan(sessionId, run.messageId, stepIndex, run.executionId,
        async () => {
          // 服务端在流式响应开始前已把当前步骤置为进行中，刷新卡片让状态立即可见。
          try {
            const current = await agentService.getPlan(sessionId, run.messageId);
            if (activeRequestRef.current === controller) applyPlan(run.messageId, current);
          } catch { /* 读取失败时保留卡片原状态。 */ }
        },
        delta => {
          if (activeRequestRef.current !== controller) return;
          streamedText += delta;
          if (!added) {
            added = true;
            updateMessages(current => [...current, { ...createMessage('assistant', streamedText), id: assistantMessageId }]);
          } else {
            updateMessages(current => current.map(message => message.id === assistantMessageId
              ? { ...message, content: streamedText } : message));
          }
        },
        progress => { if (activeRequestRef.current === controller) setRequestProgress(progress); },
        controller.signal);
      if (activeRequestRef.current !== controller) return false;
      // 计划续跑不使用自动模式的下一批选项。
      const choices = (result.choices ?? []).filter(choice => choice.id !== 'auto_continue');
      updateMessages(current => {
        const persistedId = result.messageId ? String(result.messageId) : assistantMessageId;
        if (current.some(message => message.id === assistantMessageId)) {
          return current.map(message => message.id === assistantMessageId
            ? { ...message, id: persistedId, content: result.message, choices, interaction: result.interaction }
            : message);
        }
        return [...current, {
          ...createMessage('assistant', result.message, 'message', choices),
          id: persistedId,
          interaction: result.interaction,
        }];
      });
      const plan = await agentService.getPlan(sessionId, run.messageId);
      applyPlan(run.messageId, plan);
      if (plan.status === 'completed') resultHandlerRef.current?.(result);
      return true;
    } catch (error) {
      if (controller.signal.aborted) return false;
      updateMessages(current => current.filter(message => message.id !== assistantMessageId));
      toast.error(readableError(error));
      try {
        const plan = await agentService.getPlan(sessionId, run.messageId);
        applyPlan(run.messageId, plan);
      } catch { /* 计划状态读取失败时保留卡片原状态。 */ }
      return false;
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setStreamingMessageId(null);
        setRequestProgress(null);
        setIsSending(false);
      }
    }
  }, [applyPlan, updateMessages]);

  const MAX_PLAN_TURNS = 30;

  /** 按顺序推进：生成卡片 → 浏览器操作 → 记录结果 → 下一步。 */
  const drivePlan = useCallback(async (run: { id: number; messageId: string; executionId: string;
    stopped: boolean; suspended: boolean; turns: number }) => {
    while (!run.stopped && planRunRef.current?.id === run.id) {
      const plan = planOf(run.messageId);
      if (!plan || plan.status === 'completed' || plan.status === 'failed' || plan.status === 'stopped') return;
      const index = plan.steps.findIndex(step => step.status !== 'completed');
      if (index < 0) return;
      const step = plan.steps[index];
      if (step.status === 'failed' || step.status === 'stopped') return;
      if (run.turns >= MAX_PLAN_TURNS) {
        toast.error(t('assistant.errors.planLimit'));
        await patchPlan(run.messageId, { action: 'fail', executionId: run.executionId,
          stepIndex: index, errorCode: 'interrupted' }).catch(() => {});
        return;
      }
      run.turns += 1;
      const advanced = await continuePlanStep(run, index);
      if (!advanced) return;
    }
  }, [continuePlanStep, patchPlan, planOf]);

  const startPlanRun = useCallback(async (messageId: string, action: 'confirm' | 'resume') => {
    // 暂停中的旧运行不再持有续跑权，用户显式继续时重新领取执行标识。
    if (planRunRef.current && !planRunRef.current.suspended) return;
    if (activeRequestRef.current) return;
    if (planRunRef.current) {
      planRunRef.current.stopped = true;
      planRunRef.current = null;
    }
    setPlanBusyMessageId(messageId);
    let run: { id: number; messageId: string; executionId: string; stopped: boolean;
      suspended: boolean; turns: number } | null = null;
    try {
      const plan = await patchPlan(messageId, { action });
      if (!plan.executionId) throw new Error(t('assistant.errors.planState'));
      run = { id: ++planRunIdRef.current, messageId, executionId: plan.executionId,
        stopped: false, suspended: false, turns: 0 };
      planRunRef.current = run;
      await drivePlan(run);
    } catch (error) {
      toast.error(readableError(error));
    } finally {
      if (run && planRunRef.current?.id === run.id && !run.suspended) planRunRef.current = null;
      setPlanBusyMessageId(null);
    }
  }, [drivePlan, patchPlan]);

  const confirmPlan = useCallback((messageId: string) => { void startPlanRun(messageId, 'confirm'); }, [startPlanRun]);
  const resumePlan = useCallback((messageId: string) => { void startPlanRun(messageId, 'resume'); }, [startPlanRun]);

  /** 停止立即生效：卡片先标记停止，当前请求结束后不再开始新步骤。 */
  const stopPlan = useCallback(async (messageId: string) => {
    const run = planRunRef.current;
    if (run?.messageId === messageId) run.stopped = true;
    try {
      await patchPlan(messageId, { action: 'stop' });
    } catch (error) {
      toast.error(readableError(error));
    } finally {
      if (run && planRunRef.current?.id === run.id) planRunRef.current = null;
      setPlanBusyMessageId(null);
    }
  }, [patchPlan]);

  /** 用户发送新消息时停止计划，这里同步结束本地续跑并刷新卡片状态。 */
  const stopPlanForInput = useCallback((messageId: string) => {
    const run = planRunRef.current;
    if (run?.messageId === messageId) run.stopped = true;
    planRunRef.current = null;
    setPlanBusyMessageId(null);
    void patchPlan(messageId, { action: 'stop' }).catch(() => {});
  }, [patchPlan]);
  stopPlanForInputRef.current = stopPlanForInput;

  const handleChoice = useCallback((messageId: string, choice: AgentChoice) => {
    const content = choice.id.startsWith('prompt:') ? localizeCommandPrompt(choice.id.slice(7)) : choice.label;
    void sendContent(content, { messageId, choiceId: choice.id });
  }, [sendContent]);

  const handleSelection = useCallback((messageId: string, selectedIds: string[]) => {
    const message = messagesRef.current.find(item => item.id === messageId);
    if (message?.interaction?.type !== 'selection') return;
    const selected = new Set(selectedIds);
    const names = message.interaction.options.filter(option => selected.has(option.id)).map(option => option.label)
      .join(t('common.format.listSeparator'));
    const content = t('assistant.messages.selectedUsers', { names });
    void sendContent(content, undefined, { messageId, selectedIds });
  }, [sendContent]);

  const retryLastMessage = useCallback(() => {
    const current = messagesRef.current;
    if (current[current.length - 1]?.kind !== 'error') return;
    const previousUser = [...current].reverse().find(message => message.role === 'user');
    if (previousUser) void sendContent(previousUser.content, undefined, undefined,
      previousUser.interaction?.type === 'attachment_metadata' ? previousUser.interaction.attachments : undefined);
  }, [sendContent]);

  const updatePageAction = useCallback((sessionId: string, messageId: string, interaction: AgentPageAction, result?: AgentChatResult) => {
    if (String(activeSessionIdRef.current) !== sessionId) return;
    updateMessages(current => {
      const next = current.map(message => String(message.id) === messageId ? { ...message, interaction } : message);
      if (result && !next.some(message => message.id === String(result.messageId))) {
        next.push({ ...createMessage('assistant', result.message), id: String(result.messageId) });
      }
      return next;
    });
  }, [updateMessages]);

  useEffect(() => {
    const reset = () => {
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      if (planRunRef.current) planRunRef.current.stopped = true;
      planRunRef.current = null;
      detailRequestRef.current += 1;
      sessionRequestRef.current += 1;
      loadingDetailRef.current = false;
      loadingSessionsRef.current = false;
      selectSession(null);
      updateMessages(() => []);
      setDraft('');
      setHasMoreBefore(false);
      setShowHistory(false);
      setSessions([]);
      setSessionPage(1);
      setSessionHasNext(true);
      setSessionError('');
      setIsSending(false);
      setIsLoadingSession(false);
      setIsLoadingSessions(false);
      setIsReconciling(false);
      setPlanBusyMessageId(null);
      setStreamingMessageId(null);
      setRequestProgress(null);
      // reload 的 pagehide 可能早于 React 重绘，持久化引用必须同步清空。
      persistedStateRef.current = { messages: [], draft: '', sessionId: null };
    };
    window.addEventListener(DEMO_DATA_RESET_EVENT, reset);
    return () => window.removeEventListener(DEMO_DATA_RESET_EVENT, reset);
  }, [selectSession, updateMessages]);

  return {
    isReconciling,
    messages, draft, setDraft, hasConfig, activeSessionId, isSending, streamingMessageId,
    requestProgress, activeChoiceMessageId, activeSelectionMessageId, showHistory, setShowHistory, sessions,
    sessionPage, sessionHasNext, sessionError, isLoadingSessions, isLoadingSession,
    hasMoreBefore, isLoadingMoreMessages, loadOlderMessages, loadSessions, retrySessions, openHistory,
    loadSessionDetail, startNewConversation, sendContent, stopGenerating, handleChoice, handleSelection, retryLastMessage, updatePageAction,
    planBusyMessageId, confirmPlan, resumePlan, stopPlan,
  };
}
