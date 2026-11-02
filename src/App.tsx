import { t, useT } from '@/i18n';
import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { TooltipProvider } from '@/ui/tooltip';
import { Toaster } from '@/ui/toaster';
import { ModalHost } from '@/ui/modal';
import { ErrorPage } from './pages/error/ErrorPage';
import { useAppStore } from './store/appStore';
import { appConfig } from './config/app';

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { error: { value: unknown } | null }> {
  state: { error: { value: unknown } | null } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: { value: error } };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(t('client.appError'), error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ErrorPage error={this.state.error.value} fullScreen />;
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const { locale } = useT();
  const siteName = useAppStore((state) => state.siteName);
  const loadBrand = useAppStore((state) => state.loadBrand);
  React.useEffect(() => { void loadBrand(); }, [loadBrand]);
  React.useEffect(() => { document.title = `${siteName} · ${locale === 'zh-CN' ? appConfig.zhName : appConfig.shortName}`; }, [siteName, locale]);
  return (
    <AppErrorBoundary>
      <TooltipProvider delayDuration={250} skipDelayDuration={150}>
        <Toaster />
        <RouterProvider router={router} />
        <ModalHost />
      </TooltipProvider>
    </AppErrorBoundary>
  );
};
