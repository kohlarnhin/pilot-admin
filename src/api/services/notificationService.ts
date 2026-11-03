import { t } from '@/i18n';
import { currentUser } from '@/mock/access';
import { getMockDb, updateMockDb } from '@/mock/db';
import { delay, matchesKeyword, pageResult, response } from '@/mock/helpers';
import { getStoredTokens } from '@/api/tokenStorage';
import { ApiRequestError } from '@/api/errors';
import type { ApiResponse, PageResult } from '@/types';
import type { Notification, NotificationCategory } from '@/types/notification';
import { triggerDataChangeSideEffects } from './agentEvents';

export interface NotificationQuery {
  status: 'all' | 'unread';
  category?: NotificationCategory;
  keyword?: string;
  pageNo?: number;
  pageSize?: number;
}
export interface NotificationDetail extends Notification {
  actor_name?: string;
}

// 请求发出和完成时均校验会话，不能让旧账号的异步操作写入新账号。
async function recipient(): Promise<string> {
  const token = getStoredTokens()?.accessToken;
  const id = currentUser().id;
  await delay();
  if (getStoredTokens()?.accessToken !== token || currentUser().id !== id) {
    throw new ApiRequestError(t('notifications.errors.session'), 401, 1002);
  }
  return id;
}

function ownedItems(ids: string[], recipientId: string): Set<string> {
  const unique = new Set(ids);
  if ([...unique].some((id) => !getMockDb().notifications.some((item) => item.id === id && item.recipient_id === recipientId))) {
    throw new ApiRequestError(t('notifications.errors.notFound'), 404);
  }
  return unique;
}

async function setReadState(ids: string[], read: boolean): Promise<ApiResponse<void>> {
  const id = await recipient();
  const selected = ownedItems(ids, id);
  const date = new Date().toISOString();
  updateMockDb((db) => {
    for (const item of db.notifications) {
      if (item.recipient_id !== id || !selected.has(item.id)) continue;
      if (read) item.read_at ??= date;
      else delete item.read_at;
    }
  });
  triggerDataChangeSideEffects();
  return response(undefined);
}

/** 用户自己的收件箱状态不进入审计；账号变更仍由来源服务审计。 */
export const notificationService = {
  async getUnreadCount(): Promise<ApiResponse<number>> {
    const id = await recipient();
    return response(getMockDb().notifications.filter((item) => item.recipient_id === id && !item.read_at).length);
  },

  async getNotifications(query: NotificationQuery): Promise<ApiResponse<PageResult<Notification>>> {
    const id = await recipient();
    const records = getMockDb().notifications.filter((item) => item.recipient_id === id
      && (query.status !== 'unread' || !item.read_at)
      && (!query.category || item.category === query.category)
      && matchesKeyword(query.keyword, item.title, item.body))
      .sort((a, b) => b.create_date.localeCompare(a.create_date) || b.id.localeCompare(a.id));
    return response(pageResult(records, { pageNo: query.pageNo, pageSize: query.pageSize }));
  },

  async getNotification(notificationId: string): Promise<ApiResponse<NotificationDetail>> {
    const id = await recipient();
    ownedItems([notificationId], id);
    const item = getMockDb().notifications.find((item) => item.id === notificationId && item.recipient_id === id)!;
    return response({
      ...item,
      actor_name: item.actor_id ? getMockDb().users.find((user) => user.id === item.actor_id)?.user_name ?? item.actor_id : undefined,
    });
  },

  markRead: (ids: string[]) => setReadState(ids, true),
  markUnread: (ids: string[]) => setReadState(ids, false),

  async markAllRead({ category }: { category?: NotificationCategory } = {}): Promise<ApiResponse<void>> {
    const id = await recipient();
    const date = new Date().toISOString();
    updateMockDb((db) => {
      for (const item of db.notifications) {
        if (item.recipient_id === id && (!category || item.category === category)) item.read_at ??= date;
      }
    });
    triggerDataChangeSideEffects();
    return response(undefined);
  },

  async deleteNotifications(ids: string[]): Promise<ApiResponse<void>> {
    const id = await recipient();
    const selected = ownedItems(ids, id);
    updateMockDb((db) => {
      db.notifications = db.notifications.filter((item) => item.recipient_id !== id || !selected.has(item.id));
    });
    triggerDataChangeSideEffects();
    return response(undefined);
  },
};
