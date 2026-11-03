import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { t, useT } from '@/i18n';
import type { Notification } from '@/types/notification';
import { useInfiniteScrollLoader } from '@/hooks/useInfiniteScrollLoader';
import { NotificationSummary } from '@/components/notifications/NotificationSummary';
import { EmptyState } from '@/components/common/EmptyState';
import { Checkbox } from '@/ui/controls';
import { Skeleton } from '@/ui/skeleton';
import { Spinner } from '@/ui/spinner';
import { cn } from '@/utils';

interface Props {
  items: Notification[];
  total?: number;
  selectedId: string | null;
  checkedIds: string[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  busy: boolean;
  emptyTitle: string;
  failed: boolean;
  onOpen: (id: string) => void;
  onCheck: (id: string, checked: boolean) => void;
  onDelete: (ids: string[]) => void;
  onLoadMore: () => Promise<void>;
}

export function NotificationList({ items, total, selectedId, checkedIds, loading, refreshing, loadingMore, hasNext, busy, emptyTitle, failed, onOpen, onCheck, onDelete, onLoadMore }: Props) {
  useT();
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedIndex = Math.max(0, items.findIndex((item) => item.id === focusedId));
  const previousIndex = useRef(0);
  const hasListFocus = useRef(false);
  useLayoutEffect(() => {
    if (!focusedId) return;
    const index = items.findIndex((item) => item.id === focusedId);
    if (index >= 0) {
      previousIndex.current = index;
      return;
    }
    // 未读筛选会移除刚打开的行，焦点留在相邻记录而不是落到文档。
    const next = items[Math.min(previousIndex.current, items.length - 1)];
    setFocusedId(next?.id ?? null);
    window.requestAnimationFrame(() => {
      if (!hasListFocus.current || document.activeElement !== document.body) return;
      const target = next ? scroller.current?.querySelector<HTMLButtonElement>(`[data-open-id="${CSS.escape(next.id)}"]`) : scroller.current;
      target?.focus({ preventScroll: true });
    });
  }, [items, focusedId]);
  const rangeExtractor = useCallback((range: Parameters<typeof defaultRangeExtractor>[0]) => (
    [...new Set([...defaultRangeExtractor(range), focusedIndex])].filter((index) => index < range.count).sort((a, b) => a - b)
  ), [focusedIndex]);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => 112,
    getItemKey: (index) => items[index].id,
    overscan: 5,
    rangeExtractor,
  });
  useInfiniteScrollLoader({ containerRef: scroller, sentinelRef: sentinel, itemCount: items.length, hasNext, initialLoading: loading || refreshing, loadingMore, onLoadMore });

  const move = (index: number) => {
    const item = items[index];
    if (!item) return;
    setFocusedId(item.id);
    virtualizer.scrollToIndex(index, { align: 'auto' });
    window.requestAnimationFrame(() => scroller.current?.querySelector<HTMLButtonElement>(`[data-open-id="${CSS.escape(item.id)}"]`)?.focus({ preventScroll: true }));
  };

  return <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    {refreshing ? <span role="status" className="absolute right-3 top-2 z-10 rounded-md bg-white p-1 text-slate-500"><Spinner size={14} /><span className="sr-only">{t('ui.loadingOptions')}</span></span> : null}
    <div ref={scroller} role="list" tabIndex={-1} onFocusCapture={() => { hasListFocus.current = true; }} onBlurCapture={(event) => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) hasListFocus.current = false;
    }} aria-label={t('notifications.list')} aria-busy={loading || refreshing || undefined} data-slot="notification-list" data-loaded-count={items.length} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
      {loading ? <div className="space-y-3 p-4">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-24 w-full" />)}</div> : items.length === 0 ? <EmptyState title={emptyTitle} description={failed ? undefined : t('notifications.empty.hint')} /> : <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index];
          return <div key={item.id} role="listitem" aria-posinset={row.index + 1} aria-setsize={total ?? items.length} data-notification-id={item.id} className={cn('absolute left-0 top-0 flex w-full min-w-0 items-start gap-3 border-b border-line-row pl-4 pr-2', selectedId === item.id ? 'bg-slate-100' : 'hover:bg-slate-50/60')} style={{ height: row.size, transform: `translateY(${row.start}px)` }}>
            <Checkbox className="mt-4 shrink-0" tabIndex={row.index === focusedIndex ? 0 : -1} aria-label={t('notifications.select', { title: item.title })} checked={checkedIds.includes(item.id)} disabled={busy} onChange={(event) => onCheck(item.id, event.target.checked)} />
            <button type="button" data-open-id={item.id} aria-current={selectedId === item.id ? 'true' : undefined} tabIndex={row.index === focusedIndex ? 0 : -1} onFocus={() => setFocusedId(item.id)} onClick={() => onOpen(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
                  event.preventDefault();
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : Math.max(0, Math.min(items.length - 1, row.index + (event.key === 'ArrowDown' ? 1 : -1)));
                  move(next);
                } else if (event.key === 'Delete') {
                  event.preventDefault();
                  if (!busy) onDelete([item.id]);
                }
              }} className="flex h-full min-w-0 flex-1 items-start gap-3 rounded-md px-2 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">
              <NotificationSummary item={item} selected={selectedId === item.id} />
            </button>
          </div>;
        })}
      </div>}
      <div ref={sentinel} role="presentation" className="h-px" />
      {loadingMore ? <div role="status" className="flex items-center justify-center gap-2 py-2 text-xs text-slate-500"><Spinner size={12} />{t('ui.loadingOptions')}</div> : null}
    </div>
  </div>;
}
