import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { exampleApprovalService, type ApprovalAction, type ApprovalRequest } from '@/api/services/exampleApprovalService';
import { approvalTotal, COMMENT_MAX, validateComment, type ApprovalCommentError, type ApprovalNode } from '@/api/services/exampleApprovalRules';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Icon } from '@/components/icon';
import { useCan } from '@/hooks/usePermission';
import { useT } from '@/i18n';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Alert, Tag } from '@/ui/controls';
import { TextArea } from '@/ui/input';
import { message } from '@/ui/message';
import { Modal } from '@/ui/modal';
import { Skeleton } from '@/ui/skeleton';
import { cn } from '@/utils';

type StepKey = 'submit' | ApprovalNode | 'done';
type StepState = 'done' | 'current' | 'rejected' | 'waiting';
const STEPS: StepKey[] = ['submit', 'manager', 'finance', 'done'];
const STATUS_COLOR = { pending: 'processing', approved: 'success', rejected: 'error' } as const;

function stepState(request: ApprovalRequest, step: StepKey): StepState {
  if (step === 'submit') return 'done';
  if (request.status === 'approved') return 'done';
  if (step === 'done') return 'waiting';
  const current = STEPS.indexOf(request.node ?? 'manager');
  const index = STEPS.indexOf(step);
  if (index < current) return 'done';
  if (index > current) return 'waiting';
  return request.status === 'rejected' ? 'rejected' : 'current';
}

export function ApprovalExamplePage() {
  const { t, locale } = useT();
  const can = useCan();
  const canDecide = can('example:update');
  const [requests, setRequests] = useState<ApprovalRequest[] | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [action, setAction] = useState<ApprovalAction | null>(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<ApprovalCommentError | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const alive = useRef(true);
  const lock = useRef(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    setLoadError('');
    exampleApprovalService.list().then(({ data }) => {
      if (!active) return;
      setRequests(data);
      setSelectedId((previous) => data.some((item) => item.id === previous) ? previous : data[0]?.id ?? '');
    }).catch((error: Error) => { if (active) setLoadError(error.message || t('exampleApproval.errors.load')); });
    return () => { active = false; };
  }, [attempt, t]);

  const selected = requests?.find((item) => item.id === selectedId) ?? null;
  const pending = requests?.filter((item) => item.status === 'pending').length ?? 0;
  const money = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }), [locale]);
  const time = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm');
  const nodeLabel = (request: ApprovalRequest) => request.status === 'approved' ? t('exampleApproval.node.done') : t(`exampleApproval.node.${request.node ?? 'manager'}`);

  const openDecision = (next: ApprovalAction) => { setAction(next); setComment(''); setCommentError(undefined); };
  const closeDecision = () => { if (!submitting) setAction(null); };
  const submitDecision = async () => {
    if (!selected || !action || lock.current) return;
    const local = validateComment(action, comment);
    if (local) { setCommentError(local); commentRef.current?.focus(); return; }
    lock.current = true;
    setSubmitting(true);
    try {
      const { data } = await exampleApprovalService.decide(selected, action, comment);
      if (!alive.current) return;
      if (!data.success) { setCommentError(data.error); commentRef.current?.focus(); return; }
      const before = selected;
      setRequests((previous) => previous?.map((item) => item.id === data.request.id ? data.request : item) ?? previous);
      setAction(null);
      message.success(action === 'approve' ? t('exampleApproval.decide.approved', { node: nodeLabel(before) })
        : action === 'reject' ? t('exampleApproval.decide.rejected') : t('exampleApproval.decide.resubmitted'));
    } catch (error) {
      if (alive.current) message.error((error as Error).message || t('exampleApproval.errors.decide'));
    } finally {
      lock.current = false;
      if (alive.current) setSubmitting(false);
    }
  };

  const decisionActions = selected && canDecide ? selected.status === 'pending' ? <>
    <Button variant="danger" onClick={() => openDecision('reject')}><Icon icon="circle-x" size={16} />{t('exampleApproval.decide.reject')}</Button>
    <Button variant="primary" onClick={() => openDecision('approve')}><Icon icon="circle-check" size={16} />{t('exampleApproval.decide.approve')}</Button>
  </> : selected.status === 'rejected' ? <Button onClick={() => openDecision('resubmit')}><Icon icon="rotate-ccw" size={16} />{t('exampleApproval.decide.resubmit')}</Button> : null : null;

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
    <PageHeader title={t('menu.approvalFlow')} description={t('exampleApproval.description')} />
    {loadError ? <Alert type="error" title={loadError} action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>{t('common.actions.retry')}</Button>} className="mb-4 shrink-0" /> : null}
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <Card className="max-h-60 w-full shrink-0 lg:max-h-none lg:w-72 xl:w-80">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5">
          <h2 id="approval-list-title" className="text-13 font-medium text-slate-900">{t('exampleApproval.listLabel')}</h2>
          <span className="text-xs tabular-nums text-slate-500" aria-live="polite">{t('exampleApproval.pendingCount', { count: pending })}</span>
        </div>
        <nav aria-labelledby="approval-list-title" className="min-h-0 flex-1 overflow-y-auto p-2">
          {!requests ? <div className="space-y-3 p-3">{[0, 1, 2, 3].map((key) => <div key={key} className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>)}</div> : <ul className="space-y-1">
            {requests.map((request) => <li key={request.id}>
              <button type="button" aria-current={request.id === selectedId ? 'true' : undefined} onClick={() => setSelectedId(request.id)}
                className={cn('block w-full rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                  request.id === selectedId ? 'bg-slate-100' : 'hover:bg-slate-50')}>
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-13 font-medium text-slate-900">{request.title}</span>
                  <Tag color={STATUS_COLOR[request.status]}>{t(`exampleApproval.status.${request.status}`)}</Tag>
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="min-w-0 truncate">{t(`exampleApproval.type.${request.type}`)} · {request.applicant}</span>
                  <span className="shrink-0 tabular-nums">{money.format(approvalTotal(request))}</span>
                </span>
              </button>
            </li>)}
          </ul>}
        </nav>
      </Card>
      <Card className="min-h-0 min-w-0 flex-1">
        {!selected ? requests ? <EmptyState icon="clipboard-check" title={t('exampleApproval.errors.load')} /> : <div className="space-y-4 p-6"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24 w-full" /></div> : <>
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line-soft px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500"><span>{t(`exampleApproval.type.${selected.type}`)}</span><span aria-hidden="true">·</span><code className="font-mono">{selected.code}</code></div>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <h2 className="truncate text-[15px] font-semibold leading-6 text-slate-900">{selected.title}</h2>
                <Tag color={STATUS_COLOR[selected.status]}>{t(`exampleApproval.status.${selected.status}`)}</Tag>
              </div>
            </div>
            {decisionActions ? <div className="flex shrink-0 items-center gap-2.5" data-slot="approval-actions">{decisionActions}</div> : null}
          </div>
          <div data-slot="approval-detail-scroll" className="min-h-0 flex-1 overflow-y-auto">
            {!canDecide ? <Alert type="info" title={t('exampleApproval.readOnly')} description={t('exampleApproval.readOnlyHint')} className="mx-6 mt-4" /> : null}
            <section className="border-b border-line-soft px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 xl:grid-cols-4">
                {[
                  [t('exampleApproval.fields.applicant'), `${selected.applicant} · ${selected.department}`],
                  [t('exampleApproval.fields.amount'), <span className="tabular-nums">{money.format(approvalTotal(selected))}</span>],
                  [t('exampleApproval.fields.submittedAt'), <time dateTime={selected.submittedAt}>{time(selected.submittedAt)}</time>],
                  [t('exampleApproval.fields.currentNode'), nodeLabel(selected)],
                ].map(([label, value], index) => <div key={index} className="min-w-0"><dt className="mb-1 text-xs text-slate-500">{label}</dt><dd className="break-words text-13 leading-5 text-slate-700">{value}</dd></div>)}
              </dl>
              <ol aria-label={t('exampleApproval.stepsLabel')} className="mt-6 grid grid-cols-4 gap-2" data-slot="approval-steps">
                {STEPS.map((step, index) => {
                  const state = stepState(selected, step);
                  return <li key={step} data-state={state} aria-current={state === 'current' ? 'step' : undefined} className="relative min-w-0">
                    {index < STEPS.length - 1 ? <span aria-hidden="true" className={cn('absolute left-8 right-0 top-3 h-px', state === 'done' ? 'bg-slate-900' : 'bg-line')} /> : null}
                    <span className={cn('relative flex size-6 items-center justify-center rounded-full border text-xs',
                      state === 'done' && 'border-slate-900 bg-slate-900 text-white',
                      state === 'current' && 'border-brand-500 bg-white text-brand-600 ring-4 ring-brand-500/15',
                      state === 'rejected' && 'border-red-500 bg-red-500 text-white',
                      state === 'waiting' && 'border-line bg-white text-slate-400')}>
                      {state === 'done' ? <Icon icon="check" size={14} /> : state === 'rejected' ? <Icon icon="x" size={14} /> : index + 1}
                    </span>
                    <span className="mt-2 block truncate text-13 font-medium text-slate-800">{t(`exampleApproval.node.${step}`)}</span>
                    <span className={cn('block truncate text-xs', state === 'rejected' ? 'text-red-600' : state === 'current' ? 'text-brand-600' : 'text-slate-500')}>{t(`exampleApproval.step.${state}`)}</span>
                  </li>;
                })}
              </ol>
            </section>
            <section className="grid gap-6 border-b border-line-soft px-6 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <h3 className="text-13 font-medium text-slate-900">{t('exampleApproval.fields.reason')}</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-13 leading-6 text-slate-600">{selected.reason}</p>
              </div>
              <div className="min-w-0">
                <h3 className="text-13 font-medium text-slate-900">{t('exampleApproval.fields.items')}</h3>
                <dl className="mt-2 divide-y divide-line-row rounded-lg border border-line-soft text-13">
                  {selected.items.map((item, index) => <div key={index} className="flex items-center justify-between gap-3 px-3 py-2"><dt className="min-w-0 truncate text-slate-600">{item.name}</dt><dd className="shrink-0 tabular-nums text-slate-800">{money.format(item.amount)}</dd></div>)}
                  <div className="flex items-center justify-between gap-3 bg-slate-50/60 px-3 py-2 font-medium"><dt className="text-slate-700">{t('exampleApproval.fields.total')}</dt><dd className="tabular-nums text-slate-900">{money.format(approvalTotal(selected))}</dd></div>
                </dl>
              </div>
            </section>
            <section className="px-6 py-5">
              <h3 id="approval-history-title" className="text-13 font-medium text-slate-900">{t('exampleApproval.history')}</h3>
              <ol aria-labelledby="approval-history-title" className="mt-3 space-y-4" data-slot="approval-history">
                {[...selected.records].reverse().map((record) => <li key={record.id} className="flex gap-3">
                  <span aria-hidden="true" className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    record.action === 'reject' ? 'bg-red-50 text-red-600' : record.action === 'approve' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{record.actor.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-13 text-slate-800">
                      <span className="font-medium">{record.actor}</span>
                      <span>{record.action === 'submit' || record.action === 'resubmit' ? t(`exampleApproval.action.${record.action}`) : `${t(`exampleApproval.action.${record.action}`)} · ${t(`exampleApproval.node.${record.node}`)}`}</span>
                      <time className="font-mono text-xs text-slate-500" dateTime={record.time}>{time(record.time)}</time>
                    </p>
                    {record.action !== 'submit' ? <p className={cn('mt-1.5 whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-13 leading-5',
                      record.comment ? 'bg-slate-50 text-slate-600' : 'text-slate-400')}>{record.comment || t('exampleApproval.noComment')}</p> : null}
                  </div>
                </li>)}
              </ol>
              <p className="mt-6 text-xs text-slate-500">{t('exampleApproval.demoHint')}</p>
            </section>
          </div>
        </>}
      </Card>
    </div>
    <Modal open={Boolean(action && selected)} icon={action === 'reject' ? 'circle-x' : action === 'resubmit' ? 'rotate-ccw' : 'circle-check'}
      title={action === 'reject' ? t('exampleApproval.decide.rejectTitle') : action === 'resubmit' ? t('exampleApproval.decide.resubmitTitle') : selected ? t('exampleApproval.decide.approveTitle', { node: nodeLabel(selected) }) : ''}
      description={action ? t(`exampleApproval.decide.${action}Hint`) : undefined}
      okText={action ? t(`exampleApproval.decide.${action}`) : undefined} okType={action === 'reject' ? 'danger' : 'primary'}
      confirmLoading={submitting} closable={!submitting} keyboard={!submitting} maskClosable={!submitting}
      onOk={() => void submitDecision()} onCancel={closeDecision}>
      <label htmlFor="approval-comment" className="mb-1.5 block text-13 font-medium text-slate-800">{t('exampleApproval.decide.comment')}</label>
      <TextArea id="approval-comment" ref={commentRef} rows={4} showCount maxLength={COMMENT_MAX} value={comment} placeholder={t('exampleApproval.decide.commentPlaceholder')}
        status={commentError ? 'error' : undefined} aria-invalid={commentError ? true : undefined} aria-describedby={commentError ? 'approval-comment-error' : undefined}
        onChange={(event) => { setComment(event.target.value); if (commentError) setCommentError(undefined); }} />
      {commentError ? <p id="approval-comment-error" role="alert" className="mt-1.5 text-xs text-red-600">{t(commentError)}</p> : null}
    </Modal>
  </div>;
}
