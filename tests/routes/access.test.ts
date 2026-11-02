import { describe, expect, it } from 'vitest';
import { canAccessPage, getFirstAccessiblePage } from '@/routes/access';
import { menu } from '../fixtures/menu';

describe('canAccessPage', () => {
  it('requires a visible, enabled menu for a registered menu-gated page', () => {
    const users = menu('users', { route_path: '/system/users' });
    expect(canAccessPage('/system/users', { menus: [users], permissions: [] })).toBe(true);
    expect(canAccessPage('/system/users', { menus: [], permissions: ['user:update'] })).toBe(false);
    expect(canAccessPage('/unknown', { menus: [menu('unknown', { route_path: '/unknown' })], permissions: [] })).toBe(false);
  });

  it('requires both the menu and every extra permission declared by the page', () => {
    const assistant = menu('assistant', { route_path: '/system/assistant' });
    expect(canAccessPage('/system/assistant', { menus: [assistant], permissions: [] })).toBe(false);
    expect(canAccessPage('/system/assistant', { menus: [assistant], permissions: ['agent-config:view'] })).toBe(true);
    expect(canAccessPage('/system/assistant', { menus: [], permissions: ['agent-config:view'] })).toBe(false);
  });

  it('allows an authenticated-only page without menu or button grants', () => {
    expect(canAccessPage('/profile', { menus: [], permissions: [] })).toBe(true);
  });

  it.each([{ visible: 0 as const }, { status: 0 as const }])('denies hidden or disabled menus and their children: %j', (flag) => {
    const users = menu('users', { route_path: '/system/users' });
    expect(canAccessPage('/system/users', { menus: [{ ...users, ...flag }], permissions: [] })).toBe(false);
    expect(canAccessPage('/system/users', { menus: [menu('system', { ...flag, children: [users] })], permissions: [] })).toBe(false);
  });
});

describe('getFirstAccessiblePage', () => {
  it('sorts siblings at every level and searches children before their routed parent', () => {
    const menus = [
      menu('users', { route_path: '/system/users', sort_no: 30 }),
      menu('root', { route_path: '/dashboard', sort_no: 10, children: [
        menu('roles', { route_path: '/system/roles', sort_no: 20 }),
        menu('crud', { route_path: '/examples/crud', sort_no: 5 }),
      ] }),
    ];
    const original = structuredClone(menus);
    expect(getFirstAccessiblePage(menus, [])).toBe('/examples/crud');
    expect(menus).toEqual(original);
  });

  it('skips excluded, hidden, disabled and permission-denied pages', () => {
    const menus = [
      menu('hidden', { route_path: '/system/users', visible: 0, sort_no: 1 }),
      menu('disabled', { status: 0, sort_no: 2, children: [menu('roles', { route_path: '/system/roles' })] }),
      menu('assistant', { route_path: '/system/assistant', sort_no: 3 }),
      menu('dashboard', { route_path: '/dashboard', sort_no: 4 }),
      menu('crud', { route_path: '/examples/crud', sort_no: 5 }),
    ];
    expect(getFirstAccessiblePage(menus, [], { exclude: ['/dashboard'] })).toBe('/examples/crud');
  });

  it('falls back to /403 if there is no accessible candidate', () => {
    expect(getFirstAccessiblePage([], [])).toBe('/403');
    expect(getFirstAccessiblePage([menu('unknown', { route_path: '/unknown' })], [])).toBe('/403');
    expect(getFirstAccessiblePage([menu('dashboard', { route_path: '/dashboard' })], [], { exclude: ['/dashboard'] })).toBe('/403');
  });
});
