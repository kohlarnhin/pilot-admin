import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { agentProfileService, DEFAULT_AGENT_PROFILE, AGENT_CONFIG_CHANGED_EVENT } from '@/api/services/agentProfileService';
import type { AgentChatResult } from '@/types';
import { useAssistantChat } from './useAssistantChat';
import { useAssistantNotifications } from './useAssistantNotifications';
import { parseAttachment, attachmentMetadata, clearAttachments, type AssistantAttachment } from './attachmentStore';
import { useAssistantStore } from '@/store/assistantStore';

function useRuntime(userId: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const fullScreen = location.pathname.replace(/\/+$/, '') === '/agent';
  const panelOpen = useAssistantStore((state) => state.panelOpen);
  const openPanel = useAssistantStore((state) => state.openPanel);
  const isOpen = fullScreen || panelOpen;
  const [attachment, setAttachment] = useState<AssistantAttachment | null>(null);
  const [parsingAttachment, setParsingAttachment] = useState(false);
  const attachmentGeneration = useRef(0);
  const [profile, setProfile] = useState(DEFAULT_AGENT_PROFILE);
  const [notificationSession, setNotificationSession] = useState<string | number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const completedRef = useRef<(result: AgentChatResult) => void>(() => {});
  const chat = useAssistantChat(userId, isOpen, result => completedRef.current(result));
  const notifications = useAssistantNotifications(userId, isOpen, sessionId => {
    if (!fullScreen) openPanel();
    chat.setShowHistory(false);
    setNotificationSession(sessionId);
  });
  useEffect(() => {
    if (notificationSession === null || chat.isSending || chat.planBusyMessageId !== null
      || chat.isLoadingSession || chat.isReconciling) return;
    setNotificationSession(null);
    if (String(chat.activeSessionId) !== String(notificationSession)) void chat.loadSessionDetail(notificationSession);
  }, [notificationSession, chat.isSending, chat.planBusyMessageId, chat.isLoadingSession,
    chat.isReconciling, chat.activeSessionId, chat.loadSessionDetail]);
  completedRef.current = (result) => {
    notifications.onResult(result);
    const action = result.interaction;
    if (action?.type === 'page_action' && action.action === 'navigate' && action.autoOpen && action.route) {
      navigate(action.route, { state: fullScreen ? { agentReturnTo: `/agent?session=${encodeURIComponent(String(result.sessionId))}` } : undefined });
    }
  };

  // Runtime 位于路由上层，只在退出账号或失去助手权限时释放请求和文件。
  useEffect(() => () => {
    attachmentGeneration.current += 1;
    clearAttachments();
    useAssistantStore.setState({ panelOpen: false, streaming: false, lastTrigger: null });
  }, [userId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void agentProfileService.getProfile().then(value => { if (!cancelled) setProfile(value); })
      .catch(() => { if (!cancelled) setProfile(DEFAULT_AGENT_PROFILE); });
    const reload = () => { void agentProfileService.getProfile().then(value => { if (!cancelled) setProfile(value); }).catch(() => {}); };
    window.addEventListener(AGENT_CONFIG_CHANGED_EVENT, reload);
    return () => { cancelled = true; window.removeEventListener(AGENT_CONFIG_CHANGED_EVENT, reload); };
  }, [isOpen]);

  const handleAttach = async (file: File) => {
    const generation = ++attachmentGeneration.current;
    setAttachment(null);
    setParsingAttachment(true);
    const value = await parseAttachment(file);
    if (generation !== attachmentGeneration.current) return;
    setAttachment(value);
    setParsingAttachment(false);
  };
  const sendDraft = () => {
    if (chat.isSending || chat.isLoadingSession || parsingAttachment || attachment?.error) return;
    const metadata = attachment && !attachment.error ? [attachmentMetadata(attachment)] : undefined;
    void chat.sendContent(chat.draft.trim() || (metadata ? '请查看这个附件的元数据。' : ''), undefined, undefined, metadata);
    setAttachment(null);
  };
  const startNewConversation = () => {
    if (chat.isSending || chat.planBusyMessageId !== null || chat.isLoadingSession || chat.isReconciling) return;
    chat.startNewConversation();
    attachmentGeneration.current += 1;
    setParsingAttachment(false);
    clearAttachments();
    setAttachment(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return {
    chat, notifications, profile, inputRef, panelOpen,
    attachment, parsingAttachment, handleAttach, sendDraft, startNewConversation,
    removeAttachment: () => setAttachment(null),
    busy: chat.isSending || chat.planBusyMessageId !== null || chat.isLoadingSession || chat.isReconciling,
  };
}

const AssistantContext = createContext<ReturnType<typeof useRuntime> | null>(null);

function AssistantProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const runtime = useRuntime(userId);
  return <AssistantContext.Provider value={runtime}>{children}</AssistantContext.Provider>;
}

export function useAssistantRuntime() {
  const runtime = useContext(AssistantContext);
  if (!runtime) throw new Error('AssistantRuntime is unavailable');
  return runtime;
}

/** 只有一个聊天实例；控制台面板和独立 Agent 页面在同一实例上切换。 */
export function AssistantRuntimeLayout() {
  const location = useLocation();
  const { user, permissions, isAuthenticated, initAuth } = useAuthStore();
  useEffect(() => { void initAuth(); }, [initAuth]);
  // 登录页保持原挂载位置，认证成功时不重挂登录表单或丢失本次选择弹窗。
  const enabled = location.pathname.replace(/\/+$/, '') !== '/login' && isAuthenticated && user && permissions.includes('agent:use');
  return enabled
    ? <AssistantProvider key={user.id} userId={user.id}><Outlet /></AssistantProvider>
    : <Outlet />;
}
