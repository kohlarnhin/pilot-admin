import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/authStore';
import { Spin } from '@/ui/spinner';

const AssistantProvider = lazy(() => import('./AssistantRuntime').then((module) => ({ default: module.AssistantProvider })));

/** 认证与权限边界外不加载助手；两个宿主仍共用路由上层的唯一实例。 */
export function AssistantRuntimeLayout() {
  const location = useLocation();
  const { user, isAuthenticated, initAuth } = useAuthStore();
  useEffect(() => { void initAuth(); }, [initAuth]);
  const canUseAgent = usePermission('agent:use');
  const enabled = location.pathname.replace(/\/+$/, '') !== '/login' && isAuthenticated && user && canUseAgent;
  // 登录页保持原挂载位置，认证成功时不重挂表单或丢失本次选择弹窗。
  return enabled ? <Suspense fallback={<div className="flex h-dvh items-center justify-center bg-white"><Spin size="large" /></div>}>
    <AssistantProvider key={user.id} userId={user.id}><Outlet /></AssistantProvider>
  </Suspense> : <Outlet />;
}
