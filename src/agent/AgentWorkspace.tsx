import { t, useT } from '@/i18n';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, BookOpen, PanelLeft, Plus } from 'lucide-react';
import { Logo } from '@/components/logo';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { AssistantConversation } from '@/components/assistant/AssistantConversation';
import { useAssistantRuntime } from '@/components/assistant/assistantContext';
import { SessionHistory } from '@/components/assistant/SessionHistory';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/ui/button';
import { Tooltip } from '@/ui/tooltip';
import { getConsoleRoute } from './access';
import { appConfig } from '@/config/app';

export function AgentWorkspace() {
  useT();
  const { chat, notifications, busy, startNewConversation } = useAssistantRuntime();
  const menus = useAuthStore(state => state.menus);
  const permissions = useAuthStore(state => state.permissions);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [params, setParams] = useSearchParams();
  const requestedSession = params.get('session');
  const handledSession = useRef<string | null>(null);
  const openRequestedSession = useEffectEvent(() => {
    if (!requestedSession || !/^[\w-]+$/.test(requestedSession)) { handledSession.current = null; return; }
    if (busy || handledSession.current === requestedSession) return;
    handledSession.current = requestedSession;
    if (String(chat.activeSessionId) !== requestedSession) void chat.loadSessionDetail(requestedSession);
  });
  useEffect(() => {
    openRequestedSession();
  }, [requestedSession, busy, chat.activeSessionId, chat.loadSessionDetail]);
  const refreshHistory = useEffectEvent(() => {
    if (historyOpen && !chat.isSending) void chat.loadSessions();
  });
  useEffect(() => {
    refreshHistory();
  }, [historyOpen, chat.activeSessionId, chat.isSending, chat.loadSessions]);
  return <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-white text-slate-700">
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-5">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/agent" className="flex shrink-0 items-center gap-2.5" aria-label={t('agentMode.homeLabel')}><Logo size={28} disableLink /><h1 className="text-sm font-semibold tracking-tight text-slate-900">{t('agentMode.title')}</h1></Link>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {appConfig.helpUrl ? <a href={appConfig.helpUrl} target="_blank" rel="noreferrer" className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"><BookOpen className="size-3.5" />{t('layout.help')}</a> : null}
        <Link to={getConsoleRoute(menus, permissions)} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"><ArrowLeft className="size-3.5" />{t('agentMode.console')}</Link>
        <span className="ml-1 border-l border-line pl-2"><AccountMenu collapsed /></span>
      </div>
    </header>
    <div className="flex min-h-0 flex-1">
      {historyOpen ? <aside className="flex w-[260px] shrink-0 flex-col border-r border-line-soft" aria-label={t('agentMode.sidebarLabel')}>
        <div className="flex h-16 shrink-0 items-center px-4"><Button className="w-full justify-start gap-2" disabled={busy} onClick={() => { startNewConversation(); setParams({}, { replace: true }); }}><Plus className="size-4" />{t('assistant.header.newConversation')}</Button></div>
        <div className="min-h-0 flex-1"><SessionHistory inline open sessions={chat.sessions} activeSessionId={chat.activeSessionId} loading={chat.isLoadingSessions}
          hasNext={chat.sessionHasNext && !chat.sessionError} error={chat.sessionError} onRetry={chat.retrySessions} busy={busy} onClose={() => setHistoryOpen(false)}
          onSelect={id => setParams({ session: String(id) })} onLoadMore={() => { void chat.loadSessions(chat.sessionPage + 1, true); }} /></div>
        <p className="shrink-0 border-t border-line-soft px-5 py-4 text-[11px] leading-5 text-slate-400">{t('agentMode.sharedSessions')}<br />{t('agentMode.switchHint')}</p>
      </aside> : null}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label={t('agentMode.workspaceLabel')}>
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <Tooltip title={historyOpen ? t('agentMode.collapseHistory') : t('agentMode.expandHistory')}><Button variant="ghost" size="icon-xs" aria-label={historyOpen ? t('agentMode.collapseHistory') : t('agentMode.expandHistory')} aria-expanded={historyOpen} onClick={() => setHistoryOpen(value => !value)}><PanelLeft className="size-4" /></Button></Tooltip>
            {!historyOpen ? <Button variant="ghost" size="xs" disabled={busy} onClick={() => { startNewConversation(); setParams({}, { replace: true }); }}><Plus className="size-3.5" />{t('assistant.header.newConversation')}</Button> : null}
          </div>
          <Tooltip title={notifications.tooltip}><Button variant="ghost" size="icon-xs" aria-label={t('assistant.header.notifications')} aria-pressed={notifications.enabled} disabled={notifications.requesting} onClick={() => { void notifications.toggle(); }}><Icon icon={notifications.enabled ? 'bell-ring' : 'bell-off'} size={15} /></Button></Tooltip>
        </div>
        <div className="min-h-0 flex-1"><AssistantConversation fullScreen /></div>
      </main>
    </div>
  </div>;
}

