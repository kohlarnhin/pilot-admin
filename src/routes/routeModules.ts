import { lazy } from 'react';

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
const loadDashboardPage = createCachedLoader(() => import('../pages/dashboard').then((module) => ({ default: module.DashboardPage })));
export const DashboardPage = lazy(loadDashboardPage);
const loadUsersPage = createCachedLoader(() => import('../pages/users').then((module) => ({ default: module.UsersPage })));
export const UsersPage = lazy(loadUsersPage);
const loadRolesPage = createCachedLoader(() => import('../pages/roles').then((module) => ({ default: module.RolesPage })));
export const RolesPage = lazy(loadRolesPage);
const loadMenusPage = createCachedLoader(() => import('../pages/menus').then((module) => ({ default: module.MenusPage })));
export const MenusPage = lazy(loadMenusPage);
const loadSettingsPage = createCachedLoader(() => import('../pages/settings').then((module) => ({ default: module.SettingsPage })));
export const SettingsPage = lazy(loadSettingsPage);
const loadComponentsPage = createCachedLoader(() => import('../pages/examples/components').then((module) => ({ default: module.ComponentsPage })));
export const ComponentsPage = lazy(loadComponentsPage);

const loadAgentPage = createCachedLoader(() => import('../agent/AgentPage').then((module) => ({ default: module.AgentPage })));
export const AgentPage = lazy(loadAgentPage);
const loadAgentSettingsPage = createCachedLoader(() => import('../pages/assistant').then((module) => ({ default: module.AgentSettingsPage })));
export const AgentSettingsPage = lazy(loadAgentSettingsPage);

const routeLoaders: Record<string, () => Promise<unknown>> = {
  '/agent': loadAgentPage,
  '/system/assistant': loadAgentSettingsPage,
  '/login': loadLoginPage,
  '/dashboard': loadDashboardPage,
  '/system/users': loadUsersPage,
  '/system/roles': loadRolesPage,
  '/system/menus': loadMenusPage,
  '/system/settings': loadSettingsPage,
  '/examples/components': loadComponentsPage,
};

export const isKnownPageRoute = (path: string) => Boolean(routeLoaders[path]);

const preloadPromises = new Map<string, Promise<unknown>>();

const normalizeRoutePath = (path: string): string => {
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  if (pathname === '/system') return '/system/users';
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
};

/**
 * 根据用户导航意图预取路由模块。失败会静默释放缓存，正式点击时仍可正常重试。
 */
export const preloadRoute = (path: string): Promise<unknown> | undefined => {
  const normalizedPath = normalizeRoutePath(path);
  const loader = routeLoaders[normalizedPath];
  if (!loader) return undefined;

  const existing = preloadPromises.get(normalizedPath);
  if (existing) return existing;

  const pending = loader().catch(() => {
    preloadPromises.delete(normalizedPath);
    return undefined;
  });
  preloadPromises.set(normalizedPath, pending);
  return pending;
};
