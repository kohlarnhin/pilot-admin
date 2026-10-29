import { t, useT } from '@/i18n';
import React, { Suspense, useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { agentReturnPath } from '@/agent/access';
import { AIAssistant } from '@/components/assistant/AIAssistant';
import { Spin } from '@/ui/spinner';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { PageSkeleton } from '../common/PageSkeleton';
import { canAccessPage } from '@/routes/access';
import { usePermission } from '@/hooks/usePermission';
import { isKnownPageRoute, preloadRoute } from '@/routes/routeModules';

export const AppLayout: React.FC = () => {
  useT();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const initAuth = useAuthStore((state) => state.initAuth);
  const menus = useAuthStore((state) => state.menus);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const location = useLocation();
  const { pathname } = location;
  const agentReturnTo = agentReturnPath(location.state?.agentReturnTo);
  const permissions = useAuthStore((state) => state.permissions);
  const canUseAgent = usePermission('agent:use');
  const routePath = (() => {
    try { return decodeURI(pathname).replace(/\/+$/, '').toLowerCase() || '/'; }
    catch { return pathname; }
  })();
  const forbidden = isKnownPageRoute(routePath) && !canAccessPage(routePath, { menus, permissions });

  useEffect(() => { void initAuth(); }, [initAuth]);

  // 深层地址的分包预取与会话恢复并行。
  useEffect(() => {
    if (isInitializing || (isAuthenticated && !forbidden)) void preloadRoute(pathname);
  }, [isInitializing, isAuthenticated, forbidden, pathname]);

  if (isInitializing) return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-white">
      <Spin size="large" />
      <span className="text-xs text-slate-500">{t('layout.restoring')}</span>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // 先拒绝渲染，避免无权限页面在跳转前发起数据请求。
  if (forbidden) return <Navigate to="/403" replace />;

  return (
    <div data-slot="pilot-admin-layout-root" className="h-screen w-full overflow-hidden bg-white">
      <Sidebar />
      <GlobalSearch />
      {canUseAgent ? <AIAssistant /> : null}
      <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col transition-[padding] duration-300 ease-in-out"
        style={{ paddingLeft: sidebarCollapsed ? 'var(--layout-nav-width-mini)' : 'var(--layout-nav-width)' }}>
        {agentReturnTo && canUseAgent ? <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-slate-50 px-6 py-2 text-xs text-slate-500"><span>{t('layout.agentBanner')}</span><Link to={agentReturnTo} className="font-medium text-slate-700 hover:text-slate-900">{t('layout.returnConversation')}</Link></div> : null}
        <main data-slot="pilot-admin-layout-main" className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden p-4 lg:p-6">
          <div data-slot="page-container" className="mx-auto flex min-h-0 min-w-0 w-full flex-1 flex-col">
            <Suspense fallback={<PageSkeleton rows={7} />}><Outlet /></Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
