import React, { Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Spin } from '@/ui/spinner';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { PageSkeleton } from '../common/PageSkeleton';
import { flattenMenuTree } from '@/api/services/menuService';
import { isKnownPageRoute, preloadRoute } from '@/routes/routeModules';

export const AppLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initAuth = useAuthStore((state) => state.initAuth);
  const menus = useAuthStore((state) => state.menus);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const { pathname } = useLocation();
  const routePath = (() => {
    try { return decodeURI(pathname).replace(/\/+$/, '').toLowerCase() || '/'; }
    catch { return pathname; }
  })();
  const hasRoutePermission = flattenMenuTree(menus).some((menu) => menu.visible !== 0 && menu.status !== 0 && menu.route_path === routePath);
  const forbidden = isKnownPageRoute(routePath) && !hasRoutePermission;

  useEffect(() => { void initAuth(); }, [initAuth]);

  // 深层地址的分包预取与会话恢复并行。
  useEffect(() => {
    if (isInitializing || (isAuthenticated && !forbidden)) void preloadRoute(pathname);
  }, [isInitializing, isAuthenticated, forbidden, pathname]);

  if (isInitializing) return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-white">
      <Spin size="large" />
      <span className="text-xs text-slate-500">正在恢复会话…</span>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // 先拒绝渲染，避免无权限页面在跳转前发起数据请求。
  if (forbidden) return <Navigate to="/403" replace />;

  return (
    <div data-slot="pilot-admin-layout-root" className="h-screen w-full overflow-hidden bg-white">
      <Sidebar />
      <GlobalSearch />
      <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col transition-[padding] duration-300 ease-in-out"
        style={{ paddingLeft: sidebarCollapsed ? 'var(--layout-nav-width-mini)' : 'var(--layout-nav-width)' }}>
        <main data-slot="pilot-admin-layout-main" className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden p-4 lg:p-6">
          <div data-slot="page-container" className="mx-auto flex min-h-0 min-w-0 w-full flex-1 flex-col">
            <Suspense fallback={<PageSkeleton rows={7} />}><Outlet /></Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
