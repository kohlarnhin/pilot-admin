import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/mock/helpers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/mock/helpers')>(),
  delay: () => Promise.resolve(),
}));

let db: typeof import('@/mock/db');
let service: typeof import('@/api/services/notificationService')['notificationService'];
let users: typeof import('@/api/services/userService')['userService'];
let tokens: typeof import('@/api/tokenStorage');
const login = (id: string) => tokens.saveStoredTokens({ accessToken: `mock.${btoa(JSON.stringify({ sub: id }))}.local`, refreshToken: 'test' });

beforeEach(async () => {
  vi.resetModules();
  tokens = await import('@/api/tokenStorage');
  login('u-0001');
  db = await import('@/mock/db');
  service = (await import('@/api/services/notificationService')).notificationService;
  users = (await import('@/api/services/userService')).userService;
});

describe('user-owned notifications', () => {
  it('requires authentication for every operation, including empty writes', async () => {
    tokens.clearStoredTokens();
    for (const operation of [() => service.getUnreadCount(), () => service.getNotifications({ status: 'all' }), () => service.getNotification('unknown'), () => service.markRead([]), () => service.markUnread([]), () => service.markAllRead(), () => service.deleteNotifications([])]) {
      await expect(operation()).rejects.toMatchObject({ status: 401 });
    }
  });

  it('rejects cross-recipient reads and writes atomically even for admin', async () => {
    const own = db.getMockDb().notifications.find((item) => item.recipient_id === 'u-0001')!;
    const other = db.getMockDb().notifications.find((item) => item.recipient_id === 'u-0003')!;
    const before = structuredClone(db.getMockDb().notifications);
    await expect(service.getNotification(other.id)).rejects.toMatchObject({ status: 404 });
    for (const method of [service.markRead, service.markUnread, service.deleteNotifications]) {
      await expect(method([own.id, other.id])).rejects.toMatchObject({ status: 404 });
      expect(db.getMockDb().notifications).toEqual(before);
    }
    login('u-0003');
    expect((await service.getNotifications({ status: 'all', pageSize: 200 })).data.records.every((item) => item.recipient_id === 'u-0003')).toBe(true);
    db.updateMockDb((draft) => { draft.roles.find((role) => role.id === 'role-viewer')!.menuIds = []; });
    expect((await service.getUnreadCount()).data).toBe(10);
  });

  it('pages stably and combines status, category and keyword filters without exposing private actor fields', async () => {
    const first = (await service.getNotifications({ status: 'all', pageSize: 20 })).data;
    const second = (await service.getNotifications({ status: 'all', pageNo: 2, pageSize: 20 })).data;
    expect(first).toMatchObject({ total: 70, hasNext: true });
    expect(new Set([...first.records, ...second.records].map((item) => item.id)).size).toBe(40);
    const filtered = (await service.getNotifications({ status: 'unread', category: 'security', keyword: '密码 策略', pageSize: 200 })).data;
    expect(filtered.total).toBeGreaterThan(0);
    expect(filtered.records.every((item) => item.category === 'security' && !item.read_at)).toBe(true);
    expect((await service.getNotifications({ status: 'all', keyword: 'missing-notification' })).data).toMatchObject({ total: 0, hasNext: false, records: [] });
    login('u-0003');
    const detail = (await service.getNotification('notification-u-0003-003')).data;
    expect(detail.actor_name).toBe(db.getMockDb().users[0].user_name);
    expect(detail).not.toHaveProperty('password');
  });

  it('counts unread, preserves read timestamps, scopes mark-all to category and emits changes without auditing', async () => {
    const audits = db.getMockDb().auditLogs.length;
    const onData = vi.fn();
    window.addEventListener('pilot-admin:agent:data-changed', onData);
    expect((await service.getUnreadCount()).data).toBe(47);
    const id = 'notification-u-0001-001';
    await service.markRead([id, id]);
    const date = (await service.getNotification(id)).data.read_at;
    await service.markRead([id]);
    expect((await service.getNotification(id)).data.read_at).toBe(date);
    expect((await service.getUnreadCount()).data).toBe(46);
    await service.markUnread([id]);
    expect((await service.getUnreadCount()).data).toBe(47);
    await service.markAllRead({ category: 'security' });
    expect((await service.getNotifications({ status: 'unread', category: 'security' })).data.total).toBe(0);
    expect((await service.getUnreadCount()).data).toBeGreaterThan(0);
    await service.markAllRead();
    expect((await service.getUnreadCount()).data).toBe(0);
    expect(db.getMockDb().notifications.filter((item) => item.recipient_id === 'u-0003' && !item.read_at)).toHaveLength(10);
    await service.deleteNotifications([id]);
    await expect(service.getNotification(id)).rejects.toMatchObject({ status: 404 });
    expect(db.getMockDb().auditLogs.length).toBe(audits);
    expect(onData).toHaveBeenCalledTimes(6);
  });

  it('discards a write if the account switches during its delay', async () => {
    const before = structuredClone(db.getMockDb().notifications);
    const pending = service.markAllRead();
    login('u-0003');
    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(db.getMockDb().notifications).toEqual(before);
  });

  it('keeps inbox input state unchanged when persistence fails', async () => {
    const before = structuredClone(db.getMockDb());
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });
    await expect(service.markRead(['notification-u-0001-001'])).rejects.toThrow('Quota exceeded');
    expect(db.getMockDb()).toEqual(before);
  });
});

describe('notification generation', () => {
  it('notifies only the affected user for changed role sets, in the same persisted update', async () => {
    const before = db.getMockDb().notifications.length;
    await users.updateUser('u-0003', { role_ids: ['role-viewer', 'role-operator'] });
    expect(db.getMockDb().notifications).toHaveLength(before + 1);
    expect(db.getMockDb().notifications[0]).toMatchObject({ recipient_id: 'u-0003', actor_id: 'u-0001', category: 'account', title: '角色授权已变更' });
    const stored = JSON.parse(localStorage.getItem(db.MOCK_DB_KEY)!);
    expect(stored.users.find((user: { id: string }) => user.id === 'u-0003').role_ids).toEqual(['role-viewer', 'role-operator']);
    expect(stored.notifications[0]).toEqual(db.getMockDb().notifications[0]);
    await users.updateUser('u-0003', { role_ids: ['role-operator', 'role-viewer'] });
    await users.updateUser('u-0001', { role_ids: ['role-admin', 'role-viewer'] });
    expect(db.getMockDb().notifications).toHaveLength(before + 1);
  });

  it('generates security notifications for both password reset paths, without storing passwords in messages', async () => {
    await users.resetPassword('u-0003', 'Changed123');
    await users.updateUser('u-0002', { password: 'Changed456' });
    expect(db.getMockDb().notifications.slice(0, 2).map((item) => item.category)).toEqual(['security', 'security']);
    expect(JSON.stringify(db.getMockDb().notifications)).not.toMatch(/Changed123|Changed456/);
    expect(db.getMockDb().notifications[0]).toMatchObject({ recipient_id: 'u-0002', actor_id: 'u-0001' });
  });

  it('notifies enable/disable changes once and rechecks action permissions', async () => {
    const before = db.getMockDb().notifications.length;
    await users.updateStatus('u-0003', 0);
    await users.updateStatus('u-0003', 0);
    await users.updateStatus('u-0003', 1);
    expect(db.getMockDb().notifications).toHaveLength(before + 2);
    expect(db.getMockDb().notifications[0].title).toBe('账号已启用');
    login('u-0003');
    await expect(users.resetPassword('u-0002', 'Changed123')).rejects.toMatchObject({ status: 403 });
    expect(db.getMockDb().notifications).toHaveLength(before + 2);
  });

  it('caps at the newest 300 for the recipient without pruning anyone else', async () => {
    const template = db.getMockDb().notifications.find((item) => item.recipient_id === 'u-0003')!;
    const others = db.getMockDb().notifications.filter((item) => item.recipient_id !== 'u-0003');
    db.updateMockDb((draft) => {
      draft.notifications = [...others, ...Array.from({ length: 300 }, (_, index) => ({ ...template, id: `old-${index}`, create_date: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString() }))];
    });
    await users.resetPassword('u-0003', 'Changed123');
    const own = db.getMockDb().notifications.filter((item) => item.recipient_id === 'u-0003');
    expect(own).toHaveLength(300);
    expect(own.some((item) => item.id === 'old-0')).toBe(false);
    expect(own.some((item) => item.id === 'old-299')).toBe(true);
    expect(own[0].title).toBe('密码已由管理员重置');
    expect(db.getMockDb().notifications.filter((item) => item.recipient_id !== 'u-0003')).toEqual(others);
  });
});
