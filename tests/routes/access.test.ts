import { describe, expect, it } from 'vitest';
import { canAccessPage, canNavigateToPage, getFirstAccessiblePage } from '@/routes/access';
import { searchTargets } from '@/components/search/searchTargets';
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

describe('assistant navigation access', () => {
  const menus = [menu('crud', { route_path: '/examples/crud' })];
  it('grants a concrete detail route through its owning menu, including query and hash', () => {
    expect(canNavigateToPage('/examples/crud/MiXeD?tab=history#last', { menus, permissions: [] })).toBe(true);
    expect(canNavigateToPage('/examples/crud/A%20b?query=two words', { menus, permissions: [] })).toBe(true);
    expect(canNavigateToPage('/examples/crud/MiXeD', { menus: [], permissions: [] })).toBe(false);
    expect(canNavigateToPage('/system/assistant', { menus: [menu('assistant', { route_path: '/system/assistant' })], permissions: [] })).toBe(false);
  });
  it.each(['https://evil.example/examples/crud/id', '//evil.example', '/\\evil.example', 'examples/crud/id', '/examples/crud/id\n', undefined])('rejects unsafe navigation: %j', (route) => {
    expect(canNavigateToPage(route, { menus, permissions: [] })).toBe(false);
  });
  it('checks Agent permissions and keeps detail pages out of search', () => {
    expect(canNavigateToPage('/agent?session=1', { menus: [], permissions: ['agent:use'] })).toBe(true);
    expect(canNavigateToPage('/agent', { menus, permissions: [] })).toBe(false);
    expect(canNavigateToPage('/login', { menus, permissions: [] })).toBe(false);
    const targets = searchTargets([...menus, menu('detail', { route_path: '/examples/crud/id' })], []);
    expect(targets.some((page) => page.route === '/examples/crud')).toBe(true);
    expect(targets.some((page) => page.route.includes('/examples/crud/'))).toBe(false);
  });
});
