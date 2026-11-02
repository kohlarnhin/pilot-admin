import { describe, expect, it, vi } from 'vitest';
import { matchRoutes } from 'react-router';
import { assertPageAccessPaths, createPageResolver, isParameterizedPage } from '@/routes/pageResolver';
import { resolvePage, isKnownPageRoute, preloadRoute } from '@/routes/routeModules';
import { menu } from '../fixtures/menu';

describe('page resolver', () => {
  const pages = [
    { path: '/examples/crud', access: 'menu' },
    { path: '/examples/crud/:id', accessPath: '/examples/crud', access: 'menu' },
    { path: '/examples/crud/new', access: 'menu' },
  ];
  const resolve = createPageResolver(pages);

  it('ranks a later static route above a parameter route exactly as the Router does', () => {
    const router = matchRoutes(pages.map((page) => ({ path: page.path })), '/examples/crud/new');
    expect(resolve('/examples/crud/new')?.page.path).toBe('/examples/crud/new');
    expect(resolve('/examples/crud/new')?.page.path).toBe(router?.at(-1)?.route.path);
  });

  it('matches trailing slashes and static case without changing parameter case', () => {
    expect(resolve('/EXAMPLES/CRUD/MiXeD/')).toMatchObject({ page: pages[1], params: { id: 'MiXeD' } });
    expect(resolve('/examples/crud/')).toMatchObject({ page: pages[0] });
  });

  it('decodes parameter segments the same way as the Router and strips query/hash', () => {
    expect(resolve('/examples/crud/A%20b%2FC?tab=history#latest')?.params.id).toBe('A b/C');
    expect(resolve('/examples/crud/%E5%BC%A0%E4%B8%89')?.params.id).toBe('张三');
  });

  it('rejects unknown and external paths, while known concrete details can preload', () => {
    expect(resolve('/unknown')).toBeUndefined();
    expect(resolve('https://example.com/examples/crud/id')).toBeUndefined();
    expect(resolve('//example.com/examples/crud/id')).toBeUndefined();
    expect(isKnownPageRoute('/examples/crud/MiXeD')).toBe(true);
    expect(resolvePage('/examples/crud/MiXeD')?.params.id).toBe('MiXeD');
    expect(preloadRoute('/unknown')).toBeUndefined();
  });

  it('asserts that every accessPath owns a registered static menu page', () => {
    expect(() => assertPageAccessPaths(pages)).not.toThrow();
    for (const accessPath of ['/missing', '/examples/crud/:id', '', '/profile']) {
      expect(() => assertPageAccessPaths([...pages, { path: '/profile', access: 'authenticated' }, { path: '/bad/:id', accessPath }])).toThrow('Invalid accessPath');
    }
    expect(isParameterizedPage(pages[1])).toBe(true);
    expect(isParameterizedPage(pages[0])).toBe(false);
  });

  it('requires both the owning menu and the parameter page’s own permissions', async () => {
    vi.doMock('@/routes/routeModules', () => ({
      resolvePage: createPageResolver([
        { path: '/owner', access: 'menu', requires: ['owner:view'] },
        { path: '/owner/:id', access: 'menu', accessPath: '/owner', requires: ['detail:view'] },
      ]),
    }));
    vi.resetModules();
    try {
      const { canAccessPage } = await import('@/routes/access');
      const menus = [menu('owner', { route_path: '/owner' })];
      expect(canAccessPage('/owner/MiXeD', { menus, permissions: ['owner:view', 'detail:view'] })).toBe(true);
      expect(canAccessPage('/owner/MiXeD', { menus, permissions: ['owner:view'] })).toBe(false);
      expect(canAccessPage('/owner/MiXeD', { menus, permissions: ['detail:view'] })).toBe(false);
      expect(canAccessPage('/owner/MiXeD', { menus: [], permissions: ['owner:view', 'detail:view'] })).toBe(false);
    } finally {
      vi.doUnmock('@/routes/routeModules');
      vi.resetModules();
    }
  });
});
