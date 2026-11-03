import { t, useT } from '@/i18n';
/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react';
import { isRouteErrorResponse } from 'react-router';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { copyToClipboard } from '@/utils';
import { isChunkLoadError, reloadOnceForChunkError } from '@/utils/chunkReload';
import { StatusPage } from './StatusPage';

interface ErrorPageProps {
  error: unknown;
  fullScreen?: boolean;
  onHome?: () => void;
}

const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === 'string') return error;
  if (isRouteErrorResponse(error)) {
    const description = error.data == null ? '' : formatError(error.data);
    return `${error.status} ${error.statusText}${description ? `\n${description}` : ''}`;
  }
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') return error.message;
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      // 无法序列化的错误仍使用通用说明，避免错误页再次抛错。
    }
  }
  return t('errors.unknown');
};

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, fullScreen = false, onHome }) => {
  useT();
  const chunkError = isChunkLoadError(error);
  const [isReloading, setIsReloading] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const handledError = useRef<{ error: unknown } | null>(null);
  const details = import.meta.env.DEV && error instanceof Error && error.stack
    ? error.stack
    : formatError(error);

  useEffect(() => {
    // StrictMode 重放 effect 时保留首次刷新结果，避免提示被第二次调用覆盖。
    if (handledError.current && handledError.current.error === error) return;
    handledError.current = { error };
    console.error(t('client.pageError'), error);
    setCopyState('idle');
    setIsReloading(chunkError && reloadOnceForChunkError());
  }, [error, chunkError]);

  const copyDetails = async () => {
    const copied = await copyToClipboard(details);
    setCopyState(copied ? 'copied' : 'failed');
  };

  return (
    <StatusPage
      fullScreen={fullScreen}
      code={chunkError ? 'UPDATE' : '500'}
      icon={chunkError ? 'refresh-cw' : 'circle-alert'}
      title={chunkError ? (isReloading ? t('errors.updating') : t('errors.updated')) : t('errors.pageProblem')}
      description={chunkError
        ? (isReloading ? t('errors.loadingUpdate') : t('errors.chunkFailed'))
        : `${onHome ? t('errors.reloadOrHome') : t('errors.reloadOnly')}${t('errors.contactAdmin')}`}
      actions={
        <>
          <Button onClick={() => window.location.reload()} disabled={isReloading}>
            <Icon icon="refresh-cw" size={16} />
            {chunkError ? t('errors.refresh') : t('errors.reload')}
          </Button>
          {onHome && (
            <Button onClick={onHome}>
              <Icon icon="arrow-right" size={16} className="rotate-180" />
              {t('common.actions.home')}</Button>
          )}
        </>
      }
    >
      <details className="mt-8 w-full max-w-xl rounded-xl border border-line bg-white text-left">
        <summary className="cursor-pointer rounded-xl px-4 py-3 text-xs font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {t('errors.details')}</summary>
        <div className="border-t border-line-soft p-4">
          <div className="mb-3 flex justify-end">
            <Button size="xs" onClick={copyDetails}>
              <Icon icon={copyState === 'copied' ? 'check-check' : 'copy'} size={14} />
              {copyState === 'copied' ? t('common.toast.copied') : t('errors.copyDetails')}
            </Button>
          </div>
          <pre className="max-h-56 select-text overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-600">{details}</pre>
          {copyState === 'failed' && <p role="status" className="mt-2 text-xs text-slate-500">{t('errors.copyFailed')}</p>}
        </div>
      </details>
    </StatusPage>
  );
};
