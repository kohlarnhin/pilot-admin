import { Check, CircleSlash, ListChecks, Loader2, PauseCircle, XCircle } from 'lucide-react';
import type { AgentExecutionPlan, AgentPlanStepStatus } from '@/types';
import { Button } from '@/ui/button';
import { cn } from '@/utils';

const PLAN_STATUS: Record<AgentExecutionPlan['status'], { label: string; className: string }> = {
  proposed: { label: '待确认', className: 'bg-slate-100 text-slate-600' },
  running: { label: '进行中', className: 'bg-brand-50 text-brand-700' },
  waiting_user: { label: '需要你操作', className: 'bg-amber-50 text-amber-700' },
  failed: { label: '失败', className: 'bg-red-50 text-red-700' },
  stopped: { label: '已停止', className: 'bg-slate-100 text-slate-500' },
  completed: { label: '已完成', className: 'bg-emerald-50 text-emerald-700' },
};

const STEP_STATUS: Record<AgentPlanStepStatus, { label: string; className: string }> = {
  pending: { label: '待执行', className: 'text-slate-400' },
  running: { label: '进行中', className: 'text-brand-600' },
  completed: { label: '已完成', className: 'text-emerald-600' },
  waiting_user: { label: '需要你操作', className: 'text-amber-700' },
  failed: { label: '失败', className: 'text-red-600' },
  stopped: { label: '已停止', className: 'text-slate-400' },
};

function StepStatus({ status }: { status: AgentPlanStepStatus }) {
  const meta = STEP_STATUS[status];
  return <span className={cn('mt-0.5 flex shrink-0 items-center gap-1 text-[11px]', meta.className)}>
    {status === 'running' ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" />
      : status === 'completed' ? <Check className="size-3" />
        : status === 'failed' ? <XCircle className="size-3" />
          : status === 'waiting_user' ? <PauseCircle className="size-3" />
            : status === 'stopped' ? <CircleSlash className="size-3" /> : null}
    {meta.label}
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
  const status = PLAN_STATUS[plan.status] ?? PLAN_STATUS.proposed;
  const proposed = plan.status === 'proposed';
  const running = plan.status === 'running';
  const resumable = plan.status === 'failed' || plan.status === 'stopped';
  const hint = plan.status === 'proposed'
    ? '确认后按顺序执行，每一步都会在对话中展示进度。'
    : plan.status === 'running'
      ? '正在按顺序执行，可随时停止；停止后当前请求结束，不再开始新步骤。'
      : plan.status === 'waiting_user'
        ? '等待你完成上一步操作。'
        : plan.status === 'completed' ? '全部步骤已完成。'
          : plan.reason ?? '计划已暂停，可继续执行剩余步骤。';
  return <section aria-label="执行计划" className="mt-3 min-w-0 overflow-hidden rounded-xl border border-line bg-white">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-700">
        <ListChecks className="size-3.5 shrink-0 text-slate-500" />
        <span className="truncate">执行计划 · {plan.title}</span>
      </span>
      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', status.className)} role="status">{status.label}</span>
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
          <Button variant="ghost" size="xs" disabled={busy} onClick={actions.onAdjust}>调整计划</Button>
          <Button variant="primary" size="xs" disabled={busy} onClick={actions.onConfirm}>确认执行</Button>
        </> : null}
        {running ? <Button variant="outline" size="xs" onClick={actions.onStop}>停止</Button> : null}
        {resumable ? <Button variant="primary" size="xs" disabled={busy} onClick={actions.onResume}>继续执行</Button> : null}
      </div>
    </div>
  </section>;
}
