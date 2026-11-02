import { t, useT } from '@/i18n';
import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { AgentPageAction, AgentPageActionOutcome } from '@/types';
import { agentService } from '@/api/services/agentService';
import { useAssistantRuntime } from './AssistantRuntime';
import { useAuthStore } from '@/store/authStore';
import { canNavigateToPage } from '@/routes/access';
import { Button } from '@/ui/button';
import { Icon } from '@/components/icon';
import { getAssistantAction } from './actions/registry';
import './actions/AssignRoleAction';

export function PageActionCard({ action, sessionId, messageId }: { action: AgentPageAction; sessionId: string; messageId: string }) {
  useT();
  const { chat } = useAssistantRuntime();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const pendingOutcome = useRef<Omit<AgentPageActionOutcome, 'finishedAt'> | null>(null);
  const Component = getAssistantAction(action.actionKey || '');
  const menus = useAuthStore((state) => state.menus);
  const permissions = useAuthStore((state) => state.permissions);
  const granted = action.action === 'navigate' && canNavigateToPage(action.route, { menus, permissions });
  const busy = chat.isSending || chat.isLoadingSession || chat.isReconciling;
  const complete = async (outcome: Omit<AgentPageActionOutcome, 'finishedAt'>) => {
    if (saving.current) return;
    saving.current = true;
    pendingOutcome.current = outcome;
    try {
      const result = await agentService.recordPageActionOutcome(sessionId, messageId, outcome);
      chat.updatePageAction(sessionId, messageId, { ...action, outcome: { ...outcome, finishedAt: new Date().toISOString() } }, result);
      setOpen(false);
      pendingOutcome.current = null;
      setError('');
    } catch (cause) {
      setError((cause as Error).message || t('assistant.pageAction.saveFailed'));
      throw cause;
    } finally { saving.current = false; }
  };
  return <section aria-label={action.title} className="mt-3 rounded-xl border border-line bg-slate-50/60 p-3.5">
    <div className="flex items-start gap-2.5"><Icon icon={action.action === 'navigate' ? 'arrow-up-right' : 'users'} size={18} className="mt-0.5 shrink-0 text-slate-500" /><div className="min-w-0"><h4 className="text-xs font-medium text-slate-700">{action.title}</h4><p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p></div></div>
    {action.outcome ? <p role="status" className="mt-3 text-xs text-slate-500">{action.outcome.status === 'cancelled' ? t('common.status.cancelled') : t('assistant.pageAction.completed')}</p>
      : <Button variant="outline" size="xs" className="mt-3" disabled={busy || (action.action === 'navigate' ? !granted : !Component)} onClick={() => {
        if (action.action === 'navigate' && granted) navigate(action.route!, { state: location.pathname === '/agent' ? { agentReturnTo: `/agent?session=${encodeURIComponent(sessionId)}` } : undefined });
        else setOpen(true);
      }}>{action.action === 'navigate' ? t('assistant.pageAction.openPage') : t('assistant.pageAction.openPanel')}</Button>}
    {error ? <div role="alert" className="mt-2 text-xs text-red-600">{error}{pendingOutcome.current ? <Button size="xs" className="ml-2" onClick={() => { void complete(pendingOutcome.current!).catch(() => {}); }}>{t('assistant.pageAction.retrySave')}</Button> : null}</div> : null}
    {open && Component ? <Component onComplete={complete} onCancel={() => complete({ status: 'cancelled', summary: t('common.status.cancelled') })} /> : null}
  </section>;
}
