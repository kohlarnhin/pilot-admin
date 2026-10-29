import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { ArrowLeft, BookOpen, PanelLeft, Plus } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { AssistantConversation } from '@/components/assistant/AssistantConversation';
import { useAssistantRuntime } from '@/components/assistant/AssistantRuntime';
import { SessionHistory } from '@/components/assistant/SessionHistory';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/ui/button';
import { Tooltip } from '@/ui/tooltip';
import { Spin } from '@/ui/spinner';
import { canAccessAgent, getConsoleRoute } from './access';
import { appConfig } from '@/config/app';

function AgentWorkspace() {
  const { chat, notifications, busy, startNewConversation } = useAssistantRuntime();
  const menus = useAuthStore(state => state.menus);
  const permissions = useAuthStore(state => state.permissions);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [params, setParams] = useSearchParams();
  const requestedSession = params.get('session');
  const handledSession = useRef<string | null>(null);
  useEffect(() => {
    if (!requestedSession || !/^[\w-]+$/.test(requestedSession)) { handledSession.current = null; return; }
    if (busy || handledSession.current === requestedSession) return;
    handledSession.current = requestedSession;
    if (String(chat.activeSessionId) !== requestedSession) void chat.loadSessionDetail(requestedSession);
  }, [requestedSession, busy, chat.activeSessionId, chat.loadSessionDetail]);
  useEffect(() => {
    if (historyOpen && !chat.isSending) void chat.loadSessions();
  }, [historyOpen, chat.activeSessionId, chat.isSending, chat.loadSessions]);
  return <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-white text-slate-700">
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-5">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/agent" className="flex shrink-0 items-center gap-2.5" aria-label="Agent 模式首页"><Logo size={28} disableLink /><h1 className="text-sm font-semibold tracking-tight text-slate-900">Agent 模式</h1></Link>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {appConfig.helpUrl ? <a href={appConfig.helpUrl} target="_blank" rel="noreferrer" className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"><BookOpen className="size-3.5" />使用手册</a> : null}
        <Link to={getConsoleRoute(menus, permissions)} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"><ArrowLeft className="size-3.5" />返回管理后台</Link>
        <span className="ml-1 border-l border-line pl-2"><AccountMenu collapsed /></span>
      </div>
    </header>
    <div className="flex min-h-0 flex-1">
      {historyOpen ? <aside className="flex w-[260px] shrink-0 flex-col border-r border-line-soft" aria-label="会话侧栏">
        <div className="flex h-16 shrink-0 items-center px-4"><Button className="w-full justify-start gap-2" disabled={busy} onClick={() => { startNewConversation(); setParams({}, { replace: true }); }}><Plus className="size-4" />新对话</Button></div>
        <div className="min-h-0 flex-1"><SessionHistory inline open sessions={chat.sessions} activeSessionId={chat.activeSessionId} loading={chat.isLoadingSessions}
          hasNext={chat.sessionHasNext && !chat.sessionError} error={chat.sessionError} onRetry={chat.retrySessions} busy={busy} onClose={() => setHistoryOpen(false)}
          onSelect={id => setParams({ session: String(id) })} onLoadMore={() => { void chat.loadSessions(chat.sessionPage + 1, true); }} /></div>
        <p className="shrink-0 border-t border-line-soft px-5 py-4 text-[11px] leading-5 text-slate-400">与管理后台助手共用会话<br />随时切换，接着聊。</p>
      </aside> : null}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label="Agent 对话工作区">
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <Tooltip title={historyOpen ? '收起历史会话' : '展开历史会话'}><Button variant="ghost" size="icon-xs" aria-label={historyOpen ? '收起历史会话' : '展开历史会话'} aria-expanded={historyOpen} onClick={() => setHistoryOpen(value => !value)}><PanelLeft className="size-4" /></Button></Tooltip>
            {!historyOpen ? <Button variant="ghost" size="xs" disabled={busy} onClick={() => { startNewConversation(); setParams({}, { replace: true }); }}><Plus className="size-3.5" />新对话</Button> : null}
          </div>
          <Tooltip title={notifications.tooltip}><Button variant="ghost" size="icon-xs" aria-label="助手完成通知" aria-pressed={notifications.enabled} disabled={notifications.requesting} onClick={() => { void notifications.toggle(); }}><Icon icon={notifications.enabled ? 'bell-ring' : 'bell-off'} size={15} /></Button></Tooltip>
        </div>
        <div className="min-h-0 flex-1"><AssistantConversation fullScreen /></div>
      </main>
    </div>
  </div>;
}

export function AgentPage() {
  const { isAuthenticated, isInitializing, menus, permissions } = useAuthStore();
  if (isInitializing) return <div className="flex h-dvh items-center justify-center"><Spin size="large" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccessAgent(menus, permissions)) return <Navigate to="/403" replace />;
  return <AgentWorkspace />;
}
