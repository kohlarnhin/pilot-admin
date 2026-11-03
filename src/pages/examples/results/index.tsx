import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { exampleResultService } from '@/api/services/exampleResultService';
import { PageHeader } from '@/components/common/PageHeader';
import { Result, type ResultStatus } from '@/components/common/Result';
import { Icon } from '@/components/icon';
import { useT } from '@/i18n';
import { Button } from '@/ui/button';
import { buttonVariants } from '@/ui/button-variants';
import { Card } from '@/ui/card';

const variants = [
  { status: 'success', key: 'success' }, { status: 'error', key: 'error' },
  { status: 'info', key: 'info' }, { status: 'warning', key: 'warning' },
  { status: '403', key: 'forbidden' }, { status: '404', key: 'notFound' },
  { status: '500', key: 'server' }, { status: 'network', key: 'network' },
  { status: 'maintenance', key: 'maintenance' },
] as const satisfies ReadonlyArray<{ status: ResultStatus; key: string }>;

export function ResultPagesPage() {
  const { t } = useT();
  const [connection, setConnection] = useState<'disconnected' | 'pending' | 'connected' | 'failed'>('disconnected');
  const requestLock = useRef(false);
  const alive = useRef(true);
  const demo = useRef<HTMLHeadingElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const retry = async () => {
    if (requestLock.current) return;
    requestLock.current = true;
    setConnection('pending');
    try {
      const { data } = await exampleResultService.retryConnection();
      if (alive.current) setConnection(data.connected ? 'connected' : 'failed');
    } catch {
      if (alive.current) setConnection('failed');
    } finally {
      requestLock.current = false;
    }
  };
  const openDemo = () => {
    demo.current?.scrollIntoView({ block: 'start' });
    retryButton.current?.focus({ preventScroll: true });
  };
  return <div className="flex h-full min-h-0 min-w-0 flex-col">
    <PageHeader title={t('exampleResults.title')} description={t('exampleResults.description')} />
    <Card className="min-h-0 flex-1">
      <div role="region" aria-label={t('exampleResults.title')} tabIndex={0} className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">
        <section aria-labelledby="result-retry-heading" className="rounded-xl border border-line p-5">
          <h2 id="result-retry-heading" ref={demo} className="text-[15px] font-semibold text-slate-900">{t('exampleResults.demo')}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{t('exampleResults.demoHint')}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4" aria-busy={connection === 'pending'}>
            <div role="status" aria-live="polite" aria-atomic="true" className="flex min-w-0 items-center gap-3">
              <Icon icon={connection === 'connected' ? 'circle-check' : connection === 'pending' ? 'loader-circle' : 'globe'} size={24} className={connection === 'pending' ? 'animate-spin text-slate-600' : 'text-slate-600'} />
              <div><h3 className="text-13 font-medium text-slate-900">{t(connection === 'connected' ? 'exampleResults.connected' : connection === 'pending' ? 'exampleResults.retrying' : 'exampleResults.variants.network.title')}</h3>
                <p className="mt-1 text-xs text-slate-600">{t(connection === 'connected' ? 'exampleResults.connectedHint' : connection === 'failed' ? 'exampleResults.retryFailed' : 'exampleResults.variants.network.description')}</p></div>
            </div>
            <Button ref={retryButton} loading={connection === 'pending'} onClick={() => connection === 'connected' ? setConnection('disconnected') : void retry()}>
              <Icon icon="refresh-cw" size={15} />{t(connection === 'connected' ? 'exampleResults.restart' : 'exampleResults.retry')}
            </Button>
          </div>
        </section>
        <section aria-labelledby="result-catalog-heading">
          <h2 id="result-catalog-heading" className="mb-4 text-[15px] font-semibold text-slate-900">{t('exampleResults.catalog')}</h2>
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {variants.map(({ status, key }) => <section key={status} aria-label={t(`exampleResults.variants.${key}.title`)} className="rounded-xl border border-line p-5">
              <Result status={status} headingLevel={3} title={t(`exampleResults.variants.${key}.title`)} description={t(`exampleResults.variants.${key}.description`)} extra={
                status === 'network' ? <Button onClick={openDemo}>{t('exampleResults.retry')}</Button> :
                  <Link className={buttonVariants()} to={['403', '404', '500', 'maintenance', 'success'].includes(status) ? '/dashboard' : '/examples/forms/sections'}>{t(['403', '404', '500', 'maintenance', 'success'].includes(status) ? 'exampleResults.home' : status === 'error' ? 'exampleResults.edit' : status === 'warning' ? 'exampleResults.continue' : 'exampleResults.tryForm')}</Link>
              } />
            </section>)}
          </div>
        </section>
      </div>
    </Card>
  </div>;
}
