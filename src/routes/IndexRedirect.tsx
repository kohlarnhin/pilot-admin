import { Navigate } from 'react-router';
import { getFirstAccessiblePage } from './access';
import { useAuthStore } from '@/store/authStore';

export const IndexRedirect = () => {
  const menus = useAuthStore((state) => state.menus);
  const permissions = useAuthStore((state) => state.permissions);
  return <Navigate to={getFirstAccessiblePage(menus, permissions)} replace />;
};

