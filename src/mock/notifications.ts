import { t } from '@/i18n';
import { createId } from '@/utils/id';
import type { MockDb } from './seed';

export const MAX_NOTIFICATIONS_PER_USER = 300;
type NotificationEvent = 'roles' | 'password' | 'enabled' | 'disabled';

/** 账号动作和通知在同一份 draft 中提交；不向操作人发送自己的琐碎操作。 */
export function notifyAccountChange(db: MockDb, recipient_id: string, actor_id: string, event: NotificationEvent): void {
  if (recipient_id === actor_id) return;
  db.notifications.unshift({
    id: `notification-${createId()}`,
    recipient_id,
    actor_id,
    category: event === 'password' ? 'security' : 'account',
    level: event === 'password' || event === 'disabled' ? 'warning' : 'info',
    title: t(`notifications.generated.${event}.title`),
    body: t(`notifications.generated.${event}.body`),
    link: '/profile',
    create_date: new Date().toISOString(),
  });
  const ordered = db.notifications.filter((item) => item.recipient_id === recipient_id)
    .sort((a, b) => b.create_date.localeCompare(a.create_date) || b.id.localeCompare(a.id));
  const retained = new Set(ordered.slice(0, MAX_NOTIFICATIONS_PER_USER).map((item) => item.id));
  db.notifications = db.notifications.filter((item) => item.recipient_id !== recipient_id || retained.has(item.id));
}
