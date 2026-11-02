import { describe, expect, it } from 'vitest';
import { collectMenuCatalog, getDeclaredPermissionCounts, syncPermissionCatalog } from '@/mock/permissionCatalog';
import { createSeed } from '@/mock/seed';
import { button, menu } from '../fixtures/menu';

describe('syncPermissionCatalog', () => {
  it('auto-grants only newly cataloged ids and preserves manual revocations', () => {
    const db = createSeed();
    db.permissionCatalog = { menuIds: ['old', 'retired'], buttonIds: ['old-edit', 'retired-edit'] };
    db.roles = [
      { ...db.roles[0], menuIds: [], buttonIds: [], auto_grant: true },
      { ...db.roles[1], menuIds: [], buttonIds: [], auto_grant: false },
    ];
    const original = structuredClone(db);
    const declared = [
      menu('old', { route_path: '/old', buttons: [button('old-edit', 'old')] }),
      menu('new', { route_path: '/new', buttons: [button('new-edit', 'new')] }),
    ];

    const result = syncPermissionCatalog(db, declared);

    expect(result.changed).toBe(true);
    expect(result.db.roles[0].menuIds).toEqual(['new']);
    expect(result.db.roles[0].buttonIds).toEqual(['new-edit']);
    expect(result.db.roles[1].menuIds).toEqual([]);
    expect(result.db.roles[1].buttonIds).toEqual([]);
    expect(db).toEqual(original);
    expect(syncPermissionCatalog(result.db, declared)).toEqual({ db: result.db, changed: false });
  });

  it('does not rewrite a synchronized catalog or restore revoked known grants', () => {
    const db = createSeed();
    db.permissionCatalog = { menuIds: ['known'], buttonIds: ['known-edit'] };
    db.roles = [{ ...db.roles[0], menuIds: [], buttonIds: [], auto_grant: true }];
    const result = syncPermissionCatalog(db, [menu('known', { route_path: '/known', buttons: [button('known-edit', 'known')] })]);
    expect(result.changed).toBe(false);
    expect(result.db).toBe(db);
  });

  it('adds route-less ancestors to explicit grants without granting routed ancestors', () => {
    const db = createSeed();
    const declared = [menu('root', { children: [menu('routed', {
      route_path: '/parent',
      children: [menu('section', { children: [menu('leaf', { route_path: '/leaf' })] })],
    })] })];
    db.permissionCatalog = collectMenuCatalog(declared);
    db.roles = [{ ...db.roles[1], menuIds: ['leaf'], buttonIds: [], auto_grant: false }];

    const { db: result } = syncPermissionCatalog(db, declared);
    expect(result.roles[0].menuIds).toEqual(['leaf', 'root', 'section']);
    expect(result.roles[0].menuIds).not.toContain('routed');
  });

  it('restores route-less groups for a newly declared button without restoring its routed page', () => {
    const db = createSeed();
    db.permissionCatalog = { menuIds: ['root', 'permissions', 'page'], buttonIds: [] };
    db.roles = [{ ...db.roles[0], menuIds: [], buttonIds: [], auto_grant: true }];
    const declared = [menu('root', { children: [
      menu('permissions', { buttons: [button('new-use', 'permissions')] }),
      menu('page', { route_path: '/page', buttons: [button('new-edit', 'page')] }),
    ] })];

    const { db: result } = syncPermissionCatalog(db, declared);
    expect(result.roles[0].menuIds).toEqual(['root', 'permissions']);
    expect(result.roles[0].buttonIds).toEqual(['new-use', 'new-edit']);
  });

  it('retains historical ids and grants when declarations disappear', () => {
    const db = createSeed();
    db.permissionCatalog = { menuIds: ['retired'], buttonIds: ['retired-edit'] };
    db.roles = [{ ...db.roles[0], menuIds: ['retired'], buttonIds: ['retired-edit'] }];
    const first = syncPermissionCatalog(db, [menu('current')]).db;
    const second = syncPermissionCatalog(first, []).db;
    expect(second.permissionCatalog).toEqual({ menuIds: ['retired', 'current'], buttonIds: ['retired-edit'] });
    expect(second.roles[0].menuIds).toEqual(['retired', 'current']);
    expect(second.roles[0].buttonIds).toEqual(['retired-edit']);
  });

  it('counts only declared grants, even if historical or unknown ids remain stored', () => {
    const catalog = collectMenuCatalog([menu('root', { children: [
      menu('current', { buttons: [button('current-edit', 'current')] }),
    ] })]);
    expect(getDeclaredPermissionCounts({
      menuIds: ['retired', 'root', 'current', 'unknown'],
      buttonIds: ['retired-edit', 'current-edit', 'unknown-edit'],
    }, catalog)).toEqual({ menu_count: 2, button_count: 1 });
    expect(getDeclaredPermissionCounts({ menuIds: [], buttonIds: [] }, catalog)).toEqual({ menu_count: 0, button_count: 0 });
  });
});
