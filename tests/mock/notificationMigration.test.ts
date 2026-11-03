import { beforeEach, describe, expect, it, vi } from 'vitest';
import v7 from '../fixtures/mock-db-v7.json';
import { createMockDbMigrations } from '@/mock/migrations';
import { createNotificationSeed } from '@/mock/notificationSeed';
import { seedText as zh } from '@/i18n/locales/zh-CN/seed';
import { seedText as en } from '@/i18n/locales/en-US/seed';
import type { MockDb } from '@/mock/seed';

beforeEach(() => { vi.resetModules(); });

describe('v7 to v8 notification migration', () => {
  it('preserves every old collection and edit, adds fixed seeds and never mutates its input', async () => {
    const source = structuredClone(v7);
    source.users[0].user_name = 'Preserved name';
    source.exampleProjects[0].description = 'Preserved description';
    const snapshot = structuredClone(source);
    const migrate = createMockDbMigrations(zh)[7];
    const result = migrate(source) as MockDb;
    expect(source).toEqual(snapshot);
    expect(result).toEqual({ ...snapshot, version: 8, notifications: createNotificationSeed(zh.notifications, source.users) });
    expect(migrate(source)).toEqual(result);
    const { isMockDb } = await import('@/mock/db');
    expect(isMockDb(result)).toBe(true);
    expect(result.notifications.filter((item) => item.recipient_id === 'u-0001')).toHaveLength(70);
    expect(result.notifications.filter((item) => item.recipient_id === 'u-0002')).toHaveLength(15);
    expect(result.notifications.filter((item) => item.recipient_id === 'u-0003')).toHaveLength(15);
    expect(new Set(result.notifications.map((item) => item.id)).size).toBe(100);
    const english = createMockDbMigrations(en)[7](source) as MockDb;
    expect(english.notifications[0].title).toContain('Scheduled maintenance');
    expect(english.notifications.map(({ title: _title, body: _body, ...item }) => item)).toEqual(result.notifications.map(({ title: _title, body: _body, ...item }) => item));
  });

  it('persists v8, retains v7 until the next startup and keeps user grants', async () => {
    localStorage.setItem('pilot-admin:locale:v1', 'en-US');
    const serialized = JSON.stringify(v7);
    localStorage.setItem('pilot-admin:mock-db:v7', serialized);
    const { getMockDb, resetMockDb } = await import('@/mock/db');
    expect(getMockDb().version).toBe(8);
    expect(getMockDb().notifications[0].title).toContain('Scheduled maintenance');
    expect(localStorage.getItem('pilot-admin:mock-db:v7')).toBe(serialized);
    expect(JSON.parse(localStorage.getItem('pilot-admin:mock-db:v8')!)).toEqual(getMockDb());
    for (const role of v7.roles.filter((role) => !role.auto_grant)) {
      expect(getMockDb().roles.find((item) => item.id === role.id)?.menuIds).toEqual(role.menuIds);
    }
    resetMockDb();
    expect(getMockDb().notifications).toHaveLength(100);
    vi.resetModules();
    await import('@/mock/db');
    expect(localStorage.getItem('pilot-admin:mock-db:v7')).toBeNull();
  });

  it('rejects malformed collection fields, duplicate ids, unsafe links and more than 300 per recipient', async () => {
    const { getMockDb, isMockDb } = await import('@/mock/db');
    const db = getMockDb();
    const item = db.notifications[0];
    for (const notifications of [undefined, [{}], [{ ...item, recipient_id: 1 }], [{ ...item, category: 'sales' }], [{ ...item, level: 'bad' }], [{ ...item, body: {} }], [{ ...item, read_at: 1 }], [item, item]]) {
      expect(isMockDb({ ...db, notifications })).toBe(false);
    }
    for (const link of ['https://example.com', '//example.com', '/\\example.com', '/profile\n']) {
      expect(isMockDb({ ...db, notifications: [{ ...item, link }] })).toBe(false);
    }
    expect(isMockDb({ ...db, notifications: Array.from({ length: 301 }, (_, index) => ({ ...item, id: String(index) })) })).toBe(false);
    expect(() => createMockDbMigrations(zh)[7]({ version: 6 })).toThrow(TypeError);
    expect(() => createMockDbMigrations(zh)[7]({ version: 7, users: [{}] })).toThrow(TypeError);
  });
});
