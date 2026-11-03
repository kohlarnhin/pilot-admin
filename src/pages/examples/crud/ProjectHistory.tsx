import { useCallback, useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import dayjs from 'dayjs';
import { t, useT } from '@/i18n';
import { exampleProjectService, type ProjectHistoryEntry } from '@/api/services/exampleProjectService';
import { formatAuditAction, formatAuditModule, formatAuditReason } from '@/audit/format';
import { useInfinitePage } from '@/hooks/useInfinitePage';
import { useInfiniteScrollLoader } from '@/hooks/useInfiniteScrollLoader';
import { Alert } from '@/ui/controls';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import { Spinner } from '@/ui/spinner';

export function ProjectHistory({ id, refreshToken }: { id: string; refreshToken: number }) {
  const { locale } = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastRefresh = useRef(refreshToken);
  const [error, setError] = useState('');
  const fetchPage = useCallback((pageNo: number, pageSize: number) => exampleProjectService.getProjectHistory(id, { pageNo, pageSize }).then((result) => result.data), [id]);
  const page = useInfinitePage<ProjectHistoryEntry>({
    fetchPage,
    scopeKey: id,
    getKey: (entry) => entry.id,
    onError: (cause) => setError((cause as Error).message || t('exampleProjects.detail.historyError')),
  });
  const { reload } = page;
  useEffect(() => { setError(''); }, [id, locale]);
  useEffect(() => {
    if (lastRefresh.current === refreshToken) return;
    lastRefresh.current = refreshToken;
    setError('');
    reload();
  }, [refreshToken, reload]);
  useInfiniteScrollLoader({
    containerRef: scrollRef,
    sentinelRef,
    itemCount: page.records.length,
    hasNext: page.hasNext && !error,
    initialLoading: page.loading || page.refreshing,
    loadingMore: page.loadingMore,
    onLoadMore: page.loadMore,
  });
  const virtualizer = useVirtualizer({
    count: page.records.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    getItemKey: (index) => page.records[index].id,
    overscan: 5,
  });

  return <section className="flex min-h-[225px] flex-auto flex-col border-t border-line-soft [@media(max-height:640px)]:flex-none">
    <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-3">
      <h2 id="project-history-title" className="text-13 font-medium text-slate-900">{t('exampleProjects.detail.history')}</h2>
      <span className="text-xs tabular-nums text-slate-500" aria-live="polite">{t('exampleProjects.detail.historyCount', { count: page.records.length })}</span>
    </div>
    <div ref={scrollRef} data-slot="project-history-scroll" role="region" aria-labelledby="project-history-title" tabIndex={0} className="h-[180px] min-h-0 flex-auto overflow-y-auto overscroll-contain px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus [@media(max-height:640px)]:flex-none">
      {page.loading ? <div className="space-y-4 py-3">{[0, 1, 2].map((key) => <div key={key} className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>)}</div> : <>
        {page.records.length ? <div role="list" className="relative" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((row) => {
            const entry = page.records[row.index];
            return <div key={row.key} ref={virtualizer.measureElement} data-index={row.index} data-entry-id={entry.id} role="listitem" className="absolute left-0 top-0 w-full border-b border-line-soft py-3" style={{ transform: `translateY(${row.start}px)` }}>
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 rounded-full ${entry.result === 'failure' ? 'bg-red-400' : 'bg-slate-300'}`} />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-13 leading-5 text-slate-700">{formatAuditAction(entry)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-slate-500"><span>{entry.actor_name}</span><span>{formatAuditModule(entry.module)}</span><time className="font-mono text-[11px]" dateTime={entry.create_date}>{dayjs(entry.create_date).format('YYYY-MM-DD HH:mm:ss')}</time>{entry.result === 'failure' ? <span className="text-red-600">{entry.reason ? formatAuditReason(entry.reason) : t('common.status.failed')}</span> : null}</div>
                </div>
              </div>
            </div>;
          })}
        </div> : !error ? <p className="py-8 text-center text-xs text-slate-500">{t('exampleProjects.detail.historyEmpty')}</p> : null}
        {error ? <Alert type="error" title={error} className="my-3" action={<Button size="xs" onClick={() => { setError(''); void page.retry(); }}>{t('common.actions.retry')}</Button>} /> : null}
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
        {page.loadingMore ? <div role="status" className="flex items-center justify-center gap-2 py-3 text-xs text-slate-500"><Spinner size={14} />{t('common.status.loading')}</div> : null}
      </>}
    </div>
  </section>;
}
