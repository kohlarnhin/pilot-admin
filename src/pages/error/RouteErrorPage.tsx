import { useNavigate, useRouteError } from 'react-router';
import { ErrorPage } from './ErrorPage';

export const RouteErrorPage: React.FC<{ fullScreen?: boolean }> = ({ fullScreen = false }) => {
  const error = useRouteError();
  const navigate = useNavigate();

  return <ErrorPage error={error} fullScreen={fullScreen} onHome={() => navigate('/')} />;
};
