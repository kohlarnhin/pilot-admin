import dayjs from 'dayjs';
import { t, useT } from '@/i18n';
import { Icon, type IconName } from '@/components/icon';
import type { Notification, NotificationLevel } from '@/types/notification';
import { cn } from '@/utils';

const levels: Record<NotificationLevel, { icon: IconName; className: string }> = {
  info: { icon: 'bell', className: 'text-slate-500' },
  success: { icon: 'circle-check', className: 'text-emerald-600' },
  warning: { icon: 'triangle-alert', className: 'text-amber-700' },
  error: { icon: 'circle-x', className: 'text-red-600' },
};

export function NotificationLevelIcon({ level }: { level: NotificationLevel }) {
  return <span role="img" aria-label={t(`notifications.levels.${level}`)} title={t(`notifications.levels.${level}`)} className={cn('shrink-0', levels[level].className)}><Icon icon={levels[level].icon} size={18} /></span>;
}

function relativeTime(date: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(date)) / 60_000));
  if (minutes < 1) return t('notifications.relative.now');
  if (minutes < 60) return t('notifications.relative.minutes', { count: minutes });
  if (minutes < 1440) return t('notifications.relative.hours', { count: Math.floor(minutes / 60) });
  return t('notifications.relative.days', { count: Math.floor(minutes / 1440) });
}

export function NotificationSummary({ item, selected = false }: { item: Notification; selected?: boolean }) {
  useT();
  return <>
    <NotificationLevelIcon level={item.level} />
    <span className="min-w-0 flex-1">
      <span className="flex min-w-0 items-center gap-2">
        <span title={item.title} className={cn('min-w-0 flex-1 truncate text-13 text-slate-800', !item.read_at && 'font-semibold')}>{item.title}</span>
        {!item.read_at ? <span role="img" aria-label={t('notifications.unread')} className="size-1.5 shrink-0 rounded-full bg-brand-500" /> : null}
      </span>
      <span className={cn('mt-1 line-clamp-2 break-words text-xs leading-5', selected ? 'text-slate-600' : 'text-slate-500')}>{item.body}</span>
      <time dateTime={item.create_date} title={dayjs(item.create_date).format('YYYY-MM-DD HH:mm:ss')} className={cn('mt-1 block text-[11px]', selected ? 'text-slate-600' : 'text-slate-500')}>{relativeTime(item.create_date)}</time>
    </span>
  </>;
}
