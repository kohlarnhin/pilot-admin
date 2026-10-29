import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { AssistantHeader } from './AssistantHeader';
import { AssistantPanel } from './AssistantPanel';
import { SessionHistory } from './SessionHistory';
import { AssistantConversation } from './AssistantConversation';
import { useAssistantRuntime } from './AssistantRuntime';
import { useAssistantStore } from '@/store/assistantStore';

export function AIAssistant() {
  const navigate = useNavigate();
  const runtime = useAssistantRuntime();
  const { chat, notifications, busy } = runtime;
  const isOpen = useAssistantStore((state) => state.panelOpen);
  const closePanel = useAssistantStore((state) => state.closePanel);
  const togglePanel = useAssistantStore((state) => state.togglePanel);
  const setStreaming = useAssistantStore((state) => state.setStreaming);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setStreaming(chat.isSending);
  }, [chat.isSending, setStreaming]);

  useEffect(() => () => setStreaming(false), [setStreaming]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        if (chat.showHistory) chat.setShowHistory(false);
        else closePanel();
      } else if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'j') {
        const target = event.target;
        if (target instanceof HTMLElement
          && target.closest('input, textarea, select, [contenteditable], [role="textbox"]')
          && !target.closest('[data-assistant-composer]')) return;
        event.preventDefault();
        togglePanel(target instanceof HTMLElement ? target : undefined);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, chat.showHistory, chat.setShowHistory, closePanel, togglePanel]);

  return (
    <AssistantPanel open={isOpen} expanded={expanded}>
      <AssistantHeader name={runtime.profile.name} notifications={notifications} expanded={expanded} historyOpen={chat.showHistory} busy={busy}
        onNewChat={runtime.startNewConversation} onHistory={() => chat.showHistory ? chat.setShowHistory(false) : chat.openHistory()}
        onAgent={() => { useAssistantStore.setState({ panelOpen: false }); navigate('/agent'); }}
        onExpand={() => setExpanded(current => !current)} onClose={closePanel} />
      <div data-slot="assistant-body" className="relative min-h-0 flex-1 overflow-hidden">
        <AssistantConversation />
        <SessionHistory open={chat.showHistory} sessions={chat.sessions} activeSessionId={chat.activeSessionId}
          loading={chat.isLoadingSessions} hasNext={chat.sessionHasNext && !chat.sessionError} error={chat.sessionError} onRetry={chat.retrySessions} busy={busy}
          onClose={() => chat.setShowHistory(false)} onSelect={id => { void chat.loadSessionDetail(id); }}
          onLoadMore={() => { void chat.loadSessions(chat.sessionPage + 1, true); }} />
      </div>
    </AssistantPanel>
  );
}
