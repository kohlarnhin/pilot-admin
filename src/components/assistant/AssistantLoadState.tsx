import { t, useT } from '@/i18n';
import { Button } from '@/ui/button';
import { Spin } from '@/ui/spinner';

export function AssistantLoadState({ error, retry }: { error: boolean; retry: () => void }) {
  useT();
  return <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6" role={error ? 'alert' : 'status'} aria-busy={!error}>
    {error ? <><p className="text-center text-13 text-slate-500">{t('assistant.errors.loadInterface')}</p><Button size="sm" onClick={retry}>{t('common.actions.retry')}</Button></> : <Spin size="large" />}
  </div>;
}
