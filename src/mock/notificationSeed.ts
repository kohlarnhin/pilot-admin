import type { Notification } from '@/types/notification';
import type { User } from '@/types';

export type NotificationSeedText = Record<'maintenance' | 'password' | 'roles' | 'export' | 'summary', { title: string; body: string }>;

/** 固定 ID、时间和接收人；迁移、首次创建与重置共用，不读取环境。 */
export function createNotificationSeed(text: NotificationSeedText, users: Pick<User, 'id'>[]): Notification[] {
  const templates = [
    { key: 'maintenance', category: 'system', level: 'info' },
    { key: 'password', category: 'security', level: 'warning', link: '/profile' },
    { key: 'roles', category: 'account', level: 'info', link: '/profile?tab=permissions' },
    { key: 'export', category: 'task', level: 'success' },
    { key: 'summary', category: 'system', level: 'info' },
  ] as const;
  const anchor = Date.parse('2026-11-03T02:00:00Z');
  return ['u-0001', 'u-0002', 'u-0003'].filter((id) => users.some((user) => user.id === id)).flatMap((recipient_id, userIndex) => (
    Array.from({ length: userIndex === 0 ? 70 : 15 }, (_, index): Notification => {
      const template = templates[index % templates.length];
      const create_date = new Date(anchor - index * 6 * 60 * 60 * 1000).toISOString();
      return {
        id: `notification-${recipient_id}-${String(index + 1).padStart(3, '0')}`,
        recipient_id,
        category: template.category,
        level: index % 17 === 16 ? 'error' : template.level,
        title: `${text[template.key].title} · ${String(index + 1).padStart(2, '0')}`,
        body: text[template.key].body,
        link: 'link' in template ? template.link : undefined,
        read_at: index % 3 === 2 ? create_date : undefined,
        actor_id: template.key === 'roles' && recipient_id !== 'u-0001' ? 'u-0001' : undefined,
        create_date,
      };
    })
  ));
}
