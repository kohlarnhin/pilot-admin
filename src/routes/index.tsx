import { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AssistantRuntimeLayout } from '@/components/assistant/AssistantRuntime';
import { Spin } from '@/ui/spinner';
import { Page403, Page404 } from '@/pages/error';
import { RouteErrorPage } from '@/pages/error/RouteErrorPage';
import { getFirstAccessiblePage } from './access';
import { useAuthStore } from '@/store/authStore';
import { adminPages, LoginPage, AgentPage, AppLayout } from './routeModules';

const IndexRedirect = () => {
  const menus = useAuthStore((state) => state.menus);
  const permissions = useAuthStore((state) => state.permissions);
  return <Navigate to={getFirstAccessiblePage(menus, permissions)} replace />;
};

const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || undefined;

export const router = createBrowserRouter([{ element: <AssistantRuntimeLayout />, errorElement: <RouteErrorPage fullScreen />, children: [
  {
    path: '/login', errorElement: <RouteErrorPage fullScreen />,
    element: <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white"><Spin size="large" /></div>}><LoginPage /></Suspense>,
  },
  { path: '/agent', element: <Suspense fallback={<div className="flex h-dvh items-center justify-center"><Spin size="large" /></div>}><AgentPage /></Suspense> },
  {
    path: '/', element: <Suspense fallback={<div className="flex h-dvh items-center justify-center bg-white"><Spin size="large" /></div>}><AppLayout /></Suspense>, errorElement: <RouteErrorPage fullScreen />,
    children: [{ errorElement: <RouteErrorPage />, children: [
      { index: true, element: <IndexRedirect /> },
      { path: 'system', element: <IndexRedirect /> },
      ...adminPages.map(({ path, Component }) => ({ path: path.slice(1), element: <Component /> })),
      { path: '403', element: <Page403 /> },
      { path: '404', element: <Page404 /> },
      { path: '*', element: <Page404 /> },
    ] }],
  },
] }], { basename });
