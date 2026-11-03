import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { t, useT } from '@/i18n';
import { notificationService } from '@/api/services/notificationService';
import type { Notification, NotificationCategory } from '@/types/notification';
import { useAuthStore } from '@/store/authStore';
import { useInfinitePage } from '@/hooks/useInfinitePage';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDataChanged } from '@/hooks/useDataChanged';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/icon';
import { Card } from '@/ui/card';
import { Alert, Checkbox } from '@/ui/controls';
import { Button } from '@/ui/button';
import { SearchInput } from '@/ui/input';
import { Select } from '@/ui/select';
import { Tabs } from '@/ui/tabs';
import { Modal } from '@/ui/modal';
import { message } from '@/ui/message';
import { cn } from '@/utils';
import { NotificationList } from './NotificationList';
import { NotificationDetail } from './NotificationDetail';

export function NotificationsPage() {
  const { locale } = useT();
  const userId = useAuthStore((state) => state.user?.id);
  const [params, setParams] = useSearchParams();
  const id = params.get('id');
  const [openVersion, setOpenVersion] = useState(0);
  const selectedId = useRef(id);
  selectedId.current = id;
  const [status, setStatus] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<NotificationCategory | ''>('');
  const [keyword, setKeyword] = useState('');
  const queryKeyword = useDebouncedValue(keyword.trim(), 350);
  const filters = useMemo(() => ({ category: category || undefined, keyword: queryKeyword || undefined }), [category, queryKeyword]);
  const scope = JSON.stringify({ userId, status, ...filters });
  const resultScope = `${scope}:${locale}`;
  const [checked, setChecked] = useState<string[]>([]);
  const [loadError, setLoadError] = useState({ scope: '', message: '' });
  const [actionError, setActionError] = useState('');
  const [counts, setCounts] = useState<{ scope: string; all?: number; unread?: number; error?: string }>({ scope: '' });
  const [countAttempt, setCountAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const lock = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const returnToList = useRef(false);
  const focusAfterDelete = useRef(false);
  const afterDeleteClose = useCallback(() => {
    // 删除会卸载详情按钮或批量栏，等待弹窗退场后回到稳定控件。
    if (focusAfterDelete.current) {
      focusAfterDelete.current = false;
      searchInput.current?.focus({ preventScroll: true });
    }
  }, []);
  useEffect(() => {
    if (!id && returnToList.current) {
      returnToList.current = false;
      searchInput.current?.focus();
    }
  }, [id]);
  const fetchPage = useCallback((pageNo: number, pageSize: number) => notificationService.getNotifications({ status, ...filters, pageNo, pageSize }).then((result) => result.data), [status, filters]);
  const page = useInfinitePage<Notification>({ fetchPage, scopeKey: scope, pageSize: 20, getKey: (item) => item.id, onError: (error) => setLoadError({ scope: resultScope, message: (error as Error).message || t('notifications.errors.load') }) });
  const error = (loadError.scope === resultScope ? loadError.message : '') || (counts.scope === resultScope ? counts.error : '');
  const currentCounts = counts.scope === resultScope ? counts : undefined;
  const total = status === 'all' ? currentCounts?.all : currentCounts?.unread;

  useEffect(() => { setChecked([]); }, [scope]);
  useEffect(() => {
    let active = true;
    void Promise.all([
      notificationService.getNotifications({ status: 'all', ...filters, pageSize: 1 }),
      notificationService.getNotifications({ status: 'unread', ...filters, pageSize: 1 }),
    ]).then(([all, unread]) => { if (active) setCounts({ scope: resultScope, all: all.data.total, unread: unread.data.total }); })
      .catch((cause: Error) => { if (active) setCounts((current) => ({ ...(current.scope === resultScope ? current : {}), scope: resultScope, error: cause.message || t('notifications.errors.load') })); });
    return () => { active = false; };
  }, [filters, resultScope, countAttempt]);
  const refresh = () => { setLoadError({ scope: resultScope, message: '' }); page.reload(); setCountAttempt((value) => value + 1); };
  useDataChanged(() => refresh());
  const retry = () => { setLoadError({ scope: resultScope, message: '' }); void page.retry(); setCountAttempt((value) => value + 1); };
  const open = (notificationId: string | null) => {
    if (notificationId && notificationId === selectedId.current) {
      setOpenVersion((value) => value + 1);
      return;
    }
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (notificationId) next.set('id', notificationId);
      else next.delete('id');
      return next;
    });
  };
  const run = async (action: 'read' | 'unread' | 'all' | 'delete', ids: string[] = []) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setActionError('');
    try {
      if (action === 'read') await notificationService.markRead(ids);
      if (action === 'unread') await notificationService.markUnread(ids);
      if (action === 'all') await notificationService.markAllRead({ category: category || undefined });
      if (action === 'delete') await notificationService.deleteNotifications(ids);
      if (useAuthStore.getState().user?.id !== userId) return;
      if (action === 'delete') {
        focusAfterDelete.current = true;
        setChecked((current) => current.filter((value) => !ids.includes(value)));
        if (selectedId.current && ids.includes(selectedId.current)) open(null);
        setDeleteIds(null);
      }
      if (action === 'read' || action === 'all') setChecked([]);
      message.success(t(action === 'delete' ? 'notifications.toast.deleted' : action === 'unread' ? 'notifications.toast.unread' : 'notifications.toast.read'));
    } catch (cause) {
      setActionError((cause as Error).message || t('notifications.errors.action'));
      if (action === 'delete') throw cause;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const allChecked = page.records.length > 0 && page.records.every((item) => checked.includes(item.id));
  const emptyTitle = error ? t('notifications.errors.load') : queryKeyword ? t('notifications.empty.search') : status === 'unread' ? t('notifications.empty.unread') : t('notifications.empty.title');

  return <div className="flex h-full min-h-0 min-w-0 flex-col">
    <PageHeader title={t('notifications.title')} description={t('notifications.description')} actions={<Button disabled={busy} onClick={() => void run('all')}><Icon icon="check-check" size={16} />{t('notifications.markAllRead')}</Button>} />
    {actionError && !deleteIds ? <Alert type="error" title={actionError} className="mb-4 shrink-0" /> : null}
    <div className="flex min-h-0 min-w-0 flex-1 gap-4 xl:gap-5">
      <Card data-slot="notification-list-card" className={cn('min-h-0 min-w-0 flex-1 lg:flex lg:w-[44%] lg:flex-none', id && 'hidden')}>
        <Tabs className="px-5" value={status} onChange={setStatus} items={[{ key: 'all', label: t('notifications.all'), count: currentCounts?.all }, { key: 'unread', label: t('notifications.unread'), count: currentCounts?.unread }]} />
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-line-soft px-4 py-3">
          <SearchInput ref={searchInput} className="min-w-0 flex-1 basis-36" aria-label={t('notifications.search')} placeholder={t('notifications.search')} value={keyword} onChange={(event) => setKeyword(event.target.value)} onPressEnter={refresh} />
          <Select className="w-32 shrink-0" aria-label={t('notifications.category')} placeholder={t('notifications.allCategories')} value={category} onChange={(value) => setCategory(value as NotificationCategory | '')} options={[{ value: '', label: t('notifications.allCategories') }, ...(['system', 'account', 'security', 'task'] as const).map((value) => ({ value, label: t(`notifications.categories.${value}`) }))]} />
        </div>
        <div className="flex shrink-0 items-center gap-3 border-b border-line-soft px-4 py-2 text-[11px] text-slate-500">
          <Checkbox aria-label={t('notifications.selectLoaded')} checked={allChecked} indeterminate={!allChecked && checked.length > 0} disabled={busy || !page.records.length} onChange={(event) => setChecked(event.target.checked ? page.records.map((item) => item.id) : [])} />
          <span>{t('notifications.keyboardHint')}</span>
        </div>
        {checked.length > 0 ? <div data-slot="selection-bar" className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line-soft bg-slate-50/60 px-4 py-2"><span className="text-xs text-slate-600" aria-live="polite">{t('notifications.selected', { count: checked.length })}</span><Button size="xs" disabled={busy} onClick={() => void run('read', [...checked])}>{t('notifications.markRead')}</Button><Button size="xs" disabled={busy} onClick={() => setDeleteIds([...checked])}>{t('notifications.delete')}</Button><Button size="xs" variant="ghost" disabled={busy} onClick={() => setChecked([])}>{t('notifications.clearSelection')}</Button></div> : null}
        {error ? <Alert type="error" title={error} className="m-3 shrink-0" action={<Button size="xs" onClick={retry}>{t('common.actions.retry')}</Button>} /> : null}
        <NotificationList items={page.records} total={total} selectedId={id} checkedIds={checked} loading={page.loading} refreshing={page.refreshing} loadingMore={page.loadingMore} hasNext={page.hasNext && !error} busy={busy} emptyTitle={emptyTitle} failed={Boolean(error)} onOpen={open} onCheck={(value, selected) => setChecked((current) => selected ? [...new Set([...current, value])] : current.filter((id) => id !== value))} onDelete={setDeleteIds} onLoadMore={page.loadMore} />
      </Card>
      <Card data-slot="notification-detail-card" className={cn('min-h-0 min-w-0 flex-1 lg:flex', !id && 'hidden')}>
        {id ? <NotificationDetail key={`${userId}:${id}:${openVersion}`} id={id} busy={busy} onBack={() => { returnToList.current = true; open(null); }} onUnread={(value) => void run('unread', [value])} onDelete={setDeleteIds} /> : <EmptyState title={t('notifications.empty.select')} description={t('notifications.empty.selectHint')} />}
      </Card>
    </div>
    <Modal open={deleteIds !== null} title={t('notifications.deleteConfirm')} icon="trash-2" okType="danger" okText={t('common.actions.confirmDelete')} returnFocusRef={searchInput} afterClose={afterDeleteClose} onCancel={() => { setDeleteIds(null); setActionError(''); }} onOk={() => run('delete', deleteIds ?? [])}>
      <p>{t('notifications.deleteDescription', { count: deleteIds?.length ?? 0 })}</p>
      {actionError ? <p role="alert" className="mt-3 text-xs text-red-600">{actionError}</p> : null}
    </Modal>
  </div>;
}
