export type NotificationCategory = 'system' | 'account' | 'security' | 'task';
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  recipient_id: string;
  category: NotificationCategory;
  level: NotificationLevel;
  title: string;
  body: string;
  link?: string;
  read_at?: string;
  actor_id?: string;
  create_date: string;
}
