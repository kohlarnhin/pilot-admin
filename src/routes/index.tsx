import { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { Spin } from '@/ui/spinner';
import { Page403, Page404 } from '@/pages/error';
import { RouteErrorPage } from '@/pages/error/RouteErrorPage';
import { getFirstAccessibleRoute } from '@/api/services/menuService';
import { useAuthStore } from '@/store/authStore';
import { ComponentsPage, DashboardPage, LoginPage, MenusPage, RolesPage, SettingsPage, UsersPage } from './routeModules';

const IndexRedirect = () => {
  const menus = useAuthStore((state) => state.menus);
  return <Navigate to={getFirstAccessibleRoute(menus)} replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login', errorElement: <RouteErrorPage fullScreen />,
    element: <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white"><Spin size="large" /></div>}><LoginPage /></Suspense>,
  },
  {
    path: '/', element: <AppLayout />, errorElement: <RouteErrorPage fullScreen />,
    children: [{ errorElement: <RouteErrorPage />, children: [
      { index: true, element: <IndexRedirect /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'system', element: <IndexRedirect /> },
      { path: 'system/users', element: <UsersPage /> },
      { path: 'system/roles', element: <RolesPage /> },
      { path: 'system/menus', element: <MenusPage /> },
      { path: 'system/settings', element: <SettingsPage /> },
      { path: 'examples/components', element: <ComponentsPage /> },
      { path: '403', element: <Page403 /> },
      { path: '404', element: <Page404 /> },
      { path: '*', element: <Page404 /> },
    ] }],
  },
]);
