import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import { t, useT } from '@/i18n';
import { notificationService, type NotificationDetail as Detail } from '@/api/services/notificationService';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useAuthStore } from '@/store/authStore';
import { canNavigateToPage } from '@/routes/access';
import { NotificationLevelIcon } from '@/components/notifications/NotificationSummary';
import { Icon } from '@/components/icon';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert, Tag } from '@/ui/controls';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';

interface Props {
  id: string;
  busy: boolean;
  onBack: () => void;
  onUnread: (id: string) => void;
  onDelete: (ids: string[]) => void;
}

export function NotificationDetail({ id, busy, onBack, onUnread, onDelete }: Props) {
  const { locale } = useT();
  const navigate = useNavigate();
  const menus = useAuthStore((state) => state.menus);
  const permissions = useAuthStore((state) => state.permissions);
  const [item, setItem] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const shouldMarkRead = useRef(true);
  const loading = useRef(false);
  const body = useRef<HTMLDivElement>(null);
  useDataChanged(() => { if (!loading.current) setAttempt((value) => value + 1); });

  useEffect(() => {
    let active = true;
    loading.current = true;
    setError('');
    const load = async () => {
      const result = await notificationService.getNotification(id);
      if (!active) return;
      if (shouldMarkRead.current && !result.data.read_at) {
        await notificationService.markRead([id]);
        result.data.read_at = new Date().toISOString();
      }
      shouldMarkRead.current = false;
      if (active) setItem(result.data);
    };
    void load().catch((cause: Error) => { if (active) setError(cause.message || t('notifications.errors.load')); })
      .finally(() => { if (active) loading.current = false; });
    return () => { active = false; };
  }, [id, locale, attempt]);

  const canOpen = item && canNavigateToPage(item.link, { menus, permissions });
  return <>
    <div className="shrink-0 border-b border-line-soft px-5 py-3 lg:hidden"><Button size="xs" onClick={onBack}><Icon icon="arrow-right" className="rotate-180" size={14} />{t('notifications.back')}</Button></div>
    {error ? <Alert type="error" title={error} className="m-4 shrink-0" action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>{t('common.actions.retry')}</Button>} /> : null}
    {!item ? error ? <EmptyState title={t('notifications.empty.select')} /> : <div className="space-y-4 p-6"><Skeleton className="h-6 w-4/5" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-40 w-full" /></div> : <>
      <div className="shrink-0 border-b border-line-soft p-6">
        <div className="mb-3 flex items-center gap-2"><NotificationLevelIcon level={item.level} /><span className="text-xs text-slate-500">{t('notifications.detail')}</span></div>
        <h2 className="break-words text-[15px] font-semibold leading-6 text-slate-900" data-slot="notification-title">{item.title}</h2>
        <div className="mt-3 flex flex-wrap gap-2"><Tag>{t(`notifications.categories.${item.category}`)}</Tag><Tag color={item.level === 'success' ? 'success' : item.level === 'warning' ? 'warning' : item.level === 'error' ? 'error' : 'processing'}>{t(`notifications.levels.${item.level}`)}</Tag><Tag>{t(item.read_at ? 'notifications.read' : 'notifications.unread')}</Tag></div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><time dateTime={item.create_date} className="font-mono" title={dayjs(item.create_date).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(item.create_date).format('YYYY-MM-DD HH:mm')}</time><span>{t('notifications.actor', { name: item.actor_name ?? t('notifications.systemActor') })}</span></div>
      </div>
      <div ref={body} role="region" aria-label={t('notifications.detail')} tabIndex={0} data-slot="notification-body" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain whitespace-pre-wrap break-words px-6 py-5 text-13 leading-7 text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">{item.body}</div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line-soft px-6 py-4">
        {item.link ? <Button disabled={!canOpen} title={!canOpen ? t('notifications.linkUnavailable') : undefined} onClick={() => { if (canNavigateToPage(item.link, useAuthStore.getState())) navigate(item.link); }}><Icon icon="arrow-up-right" size={14} />{t('notifications.openLink')}</Button> : null}
        <Button disabled={busy || !item.read_at} onClick={() => onUnread(id)}>{t('notifications.markUnread')}</Button>
        <Button className="text-red-600" disabled={busy} onClick={() => onDelete([id])}><Icon icon="trash-2" size={14} />{t('notifications.delete')}</Button>
      </div>
    </>}
  </>;
}
