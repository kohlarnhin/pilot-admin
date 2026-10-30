import { useNavigate } from 'react-router';
import { AssistantHeader } from './AssistantHeader';
import { AssistantPanel } from './AssistantPanel';
import { SessionHistory } from './SessionHistory';
import { AssistantConversation } from './AssistantConversation';
import { useAssistantRuntime } from './AssistantRuntime';
import { useAssistantStore } from '@/store/assistantStore';

export { AgentWorkspace } from '@/agent/AgentWorkspace';

export function AssistantPanelUI({ expanded, setExpanded }: { expanded: boolean; setExpanded: (update: (current: boolean) => boolean) => void }) {
  const navigate = useNavigate();
  const runtime = useAssistantRuntime();
  const { chat, notifications, busy } = runtime;
  const isOpen = useAssistantStore((state) => state.panelOpen);
  const closePanel = useAssistantStore((state) => state.closePanel);
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
