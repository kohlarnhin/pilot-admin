import { t, useT, type MessageKey } from '@/i18n';
import { Check, CircleSlash, ListChecks, Loader2, PauseCircle, XCircle } from 'lucide-react';
import type { AgentExecutionPlan, AgentPlanStepStatus } from '@/types';
import { Button } from '@/ui/button';
import { cn } from '@/utils';

const PLAN_STATUS = {
  proposed: { label: 'assistant.plan.status.proposed', className: 'bg-slate-100 text-slate-600' },
  running: { label: 'common.status.running', className: 'bg-brand-50 text-brand-700' },
  waiting_user: { label: 'assistant.plan.status.waitingUser', className: 'bg-amber-50 text-amber-700' },
  failed: { label: 'common.status.failed', className: 'bg-red-50 text-red-700' },
  stopped: { label: 'common.status.stopped', className: 'bg-slate-100 text-slate-500' },
  completed: { label: 'common.status.completed', className: 'bg-emerald-50 text-emerald-700' },
} as const satisfies Record<AgentExecutionPlan['status'], { label: MessageKey; className: string }>;

const STEP_STATUS = {
  pending: { label: 'assistant.plan.status.pending', className: 'text-slate-400' },
  running: { label: 'common.status.running', className: 'text-brand-600' },
  completed: { label: 'common.status.completed', className: 'text-emerald-600' },
  waiting_user: { label: 'assistant.plan.status.waitingUser', className: 'text-amber-700' },
  failed: { label: 'common.status.failed', className: 'text-red-600' },
  stopped: { label: 'common.status.stopped', className: 'text-slate-400' },
} as const satisfies Record<AgentPlanStepStatus, { label: MessageKey; className: string }>;

function StepStatus({ status }: { status: AgentPlanStepStatus }) {
  useT();
  const meta = STEP_STATUS[status];
  return <span className={cn('mt-0.5 flex shrink-0 items-center gap-1 text-[11px]', meta.className)}>
    {status === 'running' ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" />
      : status === 'completed' ? <Check className="size-3" />
        : status === 'failed' ? <XCircle className="size-3" />
          : status === 'waiting_user' ? <PauseCircle className="size-3" />
            : status === 'stopped' ? <CircleSlash className="size-3" /> : null}
    {t(meta.label)}
  </span>;
}

export interface PlanActions {
  onConfirm: () => void;
  onResume: () => void;
  onStop: () => void;
  onAdjust: () => void;
}

interface ExecutionPlanCardProps {
  plan: AgentExecutionPlan;
  busy: boolean;
  actions: PlanActions;
}

/** 计划卡片展示运行状态，停止后让当前步骤完成。 */
export function ExecutionPlanCard({ plan, busy, actions }: ExecutionPlanCardProps) {
  useT();
  const status = PLAN_STATUS[plan.status] ?? PLAN_STATUS.proposed;
  const proposed = plan.status === 'proposed';
  const running = plan.status === 'running';
  const resumable = plan.status === 'failed' || plan.status === 'stopped';
  const hint = plan.status === 'proposed'
    ? t('assistant.plan.hints.proposed')
    : plan.status === 'running'
      ? t('assistant.plan.hints.running')
      : plan.status === 'waiting_user'
        ? t('assistant.plan.hints.waitingUser')
        : plan.status === 'completed' ? t('assistant.plan.hints.completed')
          : plan.reason ?? t('assistant.plan.hints.paused');
  return <section aria-label={t('assistant.plan.region')} className="mt-3 min-w-0 overflow-hidden rounded-xl border border-line bg-white">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-700">
        <ListChecks className="size-3.5 shrink-0 text-slate-500" />
        <span className="truncate" title={t('assistant.plan.title', { title: plan.title })}>{t('assistant.plan.title', { title: plan.title })}</span>
      </span>
      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', status.className)} role="status">{t(status.label)}</span>
    </div>
    <ol className="min-w-0 divide-y divide-line-row">
      {plan.steps.map((step, index) => <li key={`${step.type}-${index}`} className="flex min-w-0 items-start gap-2.5 px-3 py-2.5">
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line text-[11px] tabular-nums text-slate-500">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 [overflow-wrap:anywhere]">
            <span className="text-xs font-medium text-slate-700">{step.title}</span>
            <span className="text-[11px] text-slate-500"></span>
          </div>
          <p className="mt-0.5 break-words text-[11px] leading-5 text-slate-500">{step.description}</p>
          {step.reason ? <p className="mt-1 text-[11px] leading-5 text-red-600" role="alert">{step.reason}</p> : null}
        </div>
        <StepStatus status={step.status} />
      </li>)}
    </ol>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-slate-50/50 px-3 py-2.5">
      <p className="min-w-0 flex-1 text-[11px] leading-5 text-slate-500">{hint}</p>
      <div className="flex shrink-0 items-center gap-2">
        {proposed ? <>
          <Button variant="ghost" size="xs" disabled={busy} onClick={actions.onAdjust}>{t('assistant.plan.adjust')}</Button>
          <Button variant="primary" size="xs" disabled={busy} onClick={actions.onConfirm}>{t('assistant.plan.confirm')}</Button>
        </> : null}
        {running ? <Button variant="outline" size="xs" onClick={actions.onStop}>{t('assistant.plan.stop')}</Button> : null}
        {resumable ? <Button variant="primary" size="xs" disabled={busy} onClick={actions.onResume}>{t('assistant.plan.resume')}</Button> : null}
      </div>
    </div>
  </section>;
}
