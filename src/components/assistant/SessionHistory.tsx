import { t, useT } from '@/i18n';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { ArrowLeft, Check, MessageSquare } from 'lucide-react';
import type { AgentSession } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { useInfiniteScrollLoader } from '@/hooks/useInfiniteScrollLoader';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import { Spinner } from '@/ui/spinner';
import { cn } from '@/utils';

const GROUPS = ['today', 'yesterday', 'week', 'earlier'] as const;

interface SessionHistoryProps {
  error?: string;
  onRetry?: () => void;
  inline?: boolean;
  open: boolean;
  sessions: AgentSession[];
  activeSessionId: string | number | null;
  loading: boolean;
  hasNext: boolean;
  busy: boolean;
  onClose: () => void;
  onSelect: (sessionId: string | number) => void;
  onLoadMore: () => void;
}

export function SessionHistory({ error, onRetry, open, sessions, activeSessionId, loading, hasNext, busy, onClose, onSelect, onLoadMore, inline = false }: SessionHistoryProps) {
  useT();
  const backRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [present, setPresent] = useState(open);
  const loadingMore = loading && sessions.length > 0;

  useInfiniteScrollLoader({
    containerRef: scrollRef,
    sentinelRef,
    itemCount: sessions.length,
    hasNext: hasNext && open,
    initialLoading: loading && sessions.length === 0,
    loadingMore,
    onLoadMore,
  });

  useEffect(() => {
    if (open) {
      setPresent(true);
      // Focusing a translated slide-over must not scroll its panel (and header).
      if (!inline) backRef.current?.focus({ preventScroll: true });
      return;
    }
    const timer = window.setTimeout(() => setPresent(false), 180);
    return () => window.clearTimeout(timer);
  }, [open, inline]);

  if (!open && !present) return null;

  const today = dayjs().startOf('day');
  const grouped = new Map<typeof GROUPS[number], AgentSession[]>(GROUPS.map(group => [group, []]));
  for (const session of sessions) {
    const date = dayjs(session.last_message_date || session.create_date);
    const group = date.isSame(today, 'day') ? 'today'
      : date.isSame(today.subtract(1, 'day'), 'day') ? 'yesterday'
      : date.isAfter(today.subtract(7, 'day')) ? 'week' : 'earlier';
    grouped.get(group)?.push(session);
  }

  return (
    <section id="ai-assistant-history" aria-labelledby="ai-assistant-history-title" aria-hidden={!open || undefined} inert={!open || undefined} data-state={open ? 'open' : 'closed'} className={inline ? 'flex h-full min-h-0 flex-col bg-white' : 'ai-assistant-history absolute inset-0 z-20 flex min-h-0 flex-col bg-white'}>
      <div className="flex shrink-0 items-center gap-2 border-b border-line-soft px-4 py-3">
        {!inline ? <Button ref={backRef} variant="ghost" size="icon-xs" aria-label={t('assistant.history.back')} onClick={onClose} className="-ml-1"><ArrowLeft className="size-4" /></Button> : null}
        <h3 id="ai-assistant-history-title" className="flex-1 text-13 font-medium text-slate-900">{t('assistant.header.history')}</h3>
        {!inline ? <span className="text-[11px] text-slate-400">{t('assistant.history.escape')}</span> : null}
      </div>
      <div ref={scrollRef} className="ai-assistant-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3" aria-busy={loading}>
        {loading && sessions.length === 0 ? (
          <div className="space-y-4 p-2" role="status" aria-label={t('assistant.history.loading')}>
            <Skeleton className="h-3 w-12 bg-slate-100" />
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-3 rounded-xl border border-line-soft p-3"><Skeleton className="h-4 w-3/4 bg-slate-100" /><Skeleton className="h-3 w-1/2 bg-slate-100" /></div>)}
          </div>
        ) : error && sessions.length === 0 ? (<div role="alert" className="p-3 text-xs text-red-600">{error}<Button size="xs" className="ml-2" onClick={onRetry}>{t('common.actions.retry')}</Button></div>) : sessions.length === 0 ? (
          <EmptyState icon="history" title={t('assistant.history.emptyTitle')} description={t('assistant.history.emptyHint')} className="[&>div:last-child]:text-slate-500" />
        ) : (
          <>
            {GROUPS.map(group => {
              const groupSessions = grouped.get(group)!;
              if (!groupSessions.length) return null;
              return (
                <div key={group} className="mb-5">
                  <h4 className="mb-2 px-2 text-[11px] font-medium text-slate-400">{t(`history.${group}`)}</h4>
                  <div className="space-y-1">
                    {groupSessions.map(session => {
                      const active = activeSessionId !== null && String(activeSessionId) === String(session.id);
                      return (
                        <button
                          key={session.id}
                          type="button"
                          aria-current={active ? 'true' : undefined}
                          disabled={busy}
                          onClick={() => onSelect(session.id)}
                          className={cn('group flex w-full min-w-0 cursor-pointer items-start gap-2.5 rounded-lg border border-transparent p-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50', active && 'border-slate-200 bg-slate-100/80 hover:bg-slate-100')}
                        >
                          <MessageSquare className={cn('mt-0.5 size-3.5 shrink-0 text-slate-400', active && 'text-brand-600')} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-13 font-medium text-slate-700" title={session.title || t('assistant.header.newConversation')}>{session.title || t('assistant.header.newConversation')}</span>
                            <span className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                              <span>{t('assistant.history.count', { count: session.message_count })}</span><span aria-hidden="true">·</span>
                              <time dateTime={session.last_message_date}>{dayjs(session.last_message_date).format(group === 'today' ? 'HH:mm' : 'MM-DD HH:mm')}</time>
                            </span>
                          </span>
                          {active ? <Badge variant="outline" className="h-5 gap-1 border-line bg-white px-1.5 text-[11px] text-slate-700"><Check className="size-2.5" />{t('assistant.history.current')}</Badge> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {error ? <div role="alert" className="p-3 text-xs text-red-600">{error}<Button size="xs" className="ml-2" onClick={onRetry}>{t('common.actions.retry')}</Button></div> : null}
            <div ref={sentinelRef} aria-hidden="true" className="h-px" />
            {loadingMore ? <div role="status" className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400"><Spinner size={14} className="text-slate-400" />{t('assistant.history.loadingMore')}</div> : null}
          </>
        )}
      </div>
    </section>
  );
}
