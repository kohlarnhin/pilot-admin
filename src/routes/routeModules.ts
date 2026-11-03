import { lazy, type ComponentType } from 'react';
import type { MessageKey, MessageParams } from '@/i18n/types';
import { assertPageAccessPaths, createPageResolver } from './pageResolver';

type PageTitleKey = { [K in MessageKey]: [MessageParams<K>] extends [never] ? K : never }[MessageKey];

let pendingRouteLoads = 0;

const createCachedLoader = <T,>(loader: () => Promise<T>) => {
  let promise: Promise<T> | undefined;
  return () => {
    if (!promise) {
      pendingRouteLoads += 1;
      promise = loader().catch((error) => {
        promise = undefined;
        throw error;
      }).finally(() => {
        pendingRouteLoads -= 1;
      });
    }
    return promise;
  };
};

/** 路由分包保留原始异常给错误页处理，预取失败仍由 preloadRoute 静默释放。 */
export const hasPendingRouteLoads = (): boolean => pendingRouteLoads > 0;

// lazy() 与导航意图预取共用同一个 Promise；鼠标悬停命中后，点击不会再次等待新 Promise。
const loadLoginPage = createCachedLoader(() => import('../pages/login').then((module) => ({ default: module.LoginPage })));
export const LoginPage = lazy(loadLoginPage);
const loadAppLayout = createCachedLoader(() => import('../components/layout/AppLayout').then((module) => ({ default: module.AppLayout })));
export const AppLayout = lazy(loadAppLayout);
const loadAgentPage = createCachedLoader(() => import('../agent/AgentPage').then((module) => ({ default: module.AgentPage })));
export const AgentPage = lazy(loadAgentPage);

interface PageDefinition {
  path: string;
  accessPath?: string;
  load: () => Promise<{ default: ComponentType }>;
  requires?: string[];
  access?: 'menu' | 'authenticated';
  titleKey?: PageTitleKey;
  searchable?: boolean;
}

/** 仅在模块作用域注册：lazy 与预取始终共用同一个缓存 loader。 */
export function definePage({ load, access = 'menu', requires = [], ...definition }: PageDefinition) {
  const loader = createCachedLoader(load);
  return { ...definition, access, requires, load: loader, Component: lazy(loader) };
}

export const adminPages = [
  definePage({ path: '/profile', access: 'authenticated', titleKey: 'profile.title', searchable: true, load: () => import('../pages/profile').then((module) => ({ default: module.ProfilePage })) }),
  definePage({ path: '/dashboard', load: () => import('../pages/dashboard').then((module) => ({ default: module.DashboardPage })) }),
  definePage({ path: '/system/users', load: () => import('../pages/users').then((module) => ({ default: module.UsersPage })) }),
  definePage({ path: '/system/roles', load: () => import('../pages/roles').then((module) => ({ default: module.RolesPage })) }),
  definePage({ path: '/system/menus', load: () => import('../pages/menus').then((module) => ({ default: module.MenusPage })) }),
  definePage({ path: '/system/audit-logs', load: () => import('../pages/audit-logs').then((module) => ({ default: module.AuditLogsPage })) }),
  definePage({ path: '/system/settings', load: () => import('../pages/settings').then((module) => ({ default: module.SettingsPage })) }),
  definePage({ path: '/system/assistant', requires: ['agent-config:view'], load: () => import('../pages/assistant').then((module) => ({ default: module.AgentSettingsPage })) }),
  definePage({ path: '/examples/components', load: () => import('../pages/examples/components').then((module) => ({ default: module.ComponentsPage })) }),
  definePage({ path: '/examples/crud', load: () => import('../pages/examples/crud').then((module) => ({ default: module.CrudExamplePage })) }),
  definePage({ path: '/examples/crud/:id', accessPath: '/examples/crud', load: () => import('../pages/examples/crud/ProjectDetailPage').then((module) => ({ default: module.ProjectDetailPage })) }),
  definePage({ path: '/examples/directory', load: () => import('../pages/examples/directory').then((module) => ({ default: module.DirectoryExamplePage })) }),
];

if (import.meta.env.DEV || import.meta.env.MODE === 'test') assertPageAccessPaths(adminPages);

export const resolvePage = createPageResolver([
  ...adminPages,
  { path: '/agent', access: 'authenticated' as const, requires: ['agent:use'], accessPath: undefined, load: loadAgentPage },
  { path: '/login', access: 'public' as const, requires: [], accessPath: undefined, load: loadLoginPage },
]);

export const isKnownPageRoute = (path: string) => Boolean(resolvePage(path));

const preloadPromises = new Map<string, Promise<unknown>>();

/**
 * 根据用户导航意图预取路由模块。失败会静默释放缓存，正式点击时仍可正常重试。
 */
export const preloadRoute = (path: string): Promise<unknown> | undefined => {
  const resolved = resolvePage(path);
  if (!resolved) return undefined;
  const { path: normalizedPath, load: loader } = resolved.page;

  const existing = preloadPromises.get(normalizedPath);
  if (existing) return existing;

  const pending = loader().catch(() => {
    preloadPromises.delete(normalizedPath);
    return undefined;
  });
  preloadPromises.set(normalizedPath, pending);
  return pending;
};
