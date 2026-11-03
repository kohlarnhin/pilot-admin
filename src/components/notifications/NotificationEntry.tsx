import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { t, useT } from '@/i18n';
import { notificationService } from '@/api/services/notificationService';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useAuthStore } from '@/store/authStore';
import type { Notification } from '@/types/notification';
import { canNavigateToPage } from '@/routes/access';
import { preloadRoute } from '@/routes/routeModules';
import { Icon } from '@/components/icon';
import { EmptyState } from '@/components/common/EmptyState';
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/ui/popover';
import { Button } from '@/ui/button';
import { Alert } from '@/ui/controls';
import { Skeleton } from '@/ui/skeleton';
import { Tooltip } from '@/ui/tooltip';
import { cn } from '@/utils';
import { NotificationSummary } from './NotificationSummary';

export function NotificationEntry({ collapsed }: { collapsed: boolean }) {
  const { locale } = useT();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [countError, setCountError] = useState('');
  const [actionError, setActionError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const generation = useRef(0);
  useDataChanged(() => setAttempt((value) => value + 1));

  useEffect(() => {
    let active = true;
    setCount(null);
    setCountError('');
    void notificationService.getUnreadCount().then((result) => { if (active) setCount(result.data); })
      .catch((error: Error) => { if (active) setCountError(error.message || t('notifications.errors.load')); });
    return () => { active = false; };
  }, [userId, attempt, open]);
  useEffect(() => {
    const version = ++generation.current;
    if (!open) return;
    setLoadError('');
    void notificationService.getNotifications({ status: 'all', pageNo: 1, pageSize: 6 }).then((result) => {
      if (generation.current === version) setItems(result.data.records);
    }).catch((error: Error) => {
      if (generation.current === version) setLoadError(error.message || t('notifications.errors.load'));
    });
    return () => { generation.current += 1; };
  }, [userId, open, attempt, locale]);

  const run = async (item?: Notification) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setActionError('');
    try {
      if (item) await notificationService.markRead([item.id]);
      else await notificationService.markAllRead();
      if (userId !== useAuthStore.getState().user?.id) return;
      if (item) {
        setOpen(false);
        const route = canNavigateToPage(item.link, useAuthStore.getState()) ? item.link : `/notifications?id=${encodeURIComponent(item.id)}`;
        navigate(route);
      }
    } catch (error) {
      setActionError((error as Error).message || t('notifications.errors.action'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return <PopoverRoot open={open} onOpenChange={(value) => { setOpen(value); setActionError(''); }}>
    <Tooltip title={collapsed ? t('notifications.entry') : undefined} placement="right">
      <PopoverTrigger asChild>
        <button ref={trigger} type="button" data-slot="notification-entry" aria-label={collapsed ? t('notifications.entry') : undefined} aria-description={count === null ? undefined : t('notifications.unreadCount', { count })}
          onPointerEnter={() => void preloadRoute('/notifications')} onFocus={() => void preloadRoute('/notifications')}
          className={cn('mb-2 flex h-10 w-full items-center rounded-lg text-13 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', collapsed ? 'justify-center' : 'gap-3 px-3', open && 'bg-slate-100')}>
          <span className="relative flex size-[22px] shrink-0 items-center justify-center"><Icon icon="bell" size={18} />{collapsed && count !== null && count > 0 ? <span data-slot="notification-dot" className="absolute right-0 top-0 size-1.5 rounded-full bg-brand-500" /> : null}</span>
          {!collapsed ? <><span className="flex-1 text-left">{t('notifications.entry')}</span>{count !== null && count > 0 ? <span data-slot="notification-badge" className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] tabular-nums text-slate-600">{count > 99 ? '99+' : count}</span> : null}</> : null}
        </button>
      </PopoverTrigger>
    </Tooltip>
    <PopoverContent aria-label={t('notifications.title')} side="right" align="end" onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }} className="flex max-h-[calc(100dvh-32px)] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden p-0">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <h2 className="text-13 font-semibold text-slate-900">{t('notifications.title')}</h2>
        <Button size="xs" variant="ghost" disabled={count === 0 || count === null} loading={busy} onClick={() => void run()}>{t('notifications.markAllRead')}</Button>
      </div>
      {loadError || countError || actionError ? <Alert type="error" title={actionError || loadError || countError} className="mx-3 mt-3 shrink-0" action={loadError || countError ? <Button size="xs" onClick={() => { setLoadError(''); setAttempt((value) => value + 1); }}>{t('common.actions.retry')}</Button> : undefined} /> : null}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-slot="notification-popover-list">
        {items === null ? loadError ? <div className="h-24" /> : <div className="space-y-3 p-4">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div> : items.length === 0 ? <EmptyState title={t('notifications.empty.title')} className="py-8" /> : items.map((item) => <button key={item.id} type="button" disabled={busy} data-notification-id={item.id} onClick={() => void run(item)} className="flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus disabled:opacity-60"><NotificationSummary item={item} /></button>)}
      </div>
      <div className="shrink-0 border-t border-line-soft p-3"><Button className="w-full" onClick={() => { setOpen(false); navigate('/notifications'); }}>{t('notifications.viewAll')}<Icon icon="arrow-right" size={14} /></Button></div>
    </PopoverContent>
  </PopoverRoot>;
}
