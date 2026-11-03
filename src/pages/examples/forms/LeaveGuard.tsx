import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { useT } from '@/i18n';
import { Modal } from '@/ui/modal';

/** Router 内跳转与浏览器关闭都保护未提交输入。 */
export function LeaveGuard({ dirty, busy = false }: { dirty: boolean; busy?: boolean }) {
  const { t } = useT();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && (
    currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search
  ));
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  useEffect(() => {
    if (!dirty && blocker.state === 'blocked') blocker.reset();
  }, [dirty, blocker]);
  return <Modal open={blocker.state === 'blocked'} title={t('exampleForms.leave.title')} icon="triangle-alert"
    onOk={busy ? undefined : () => blocker.state === 'blocked' && blocker.proceed()}
    onCancel={busy ? undefined : () => blocker.state === 'blocked' && blocker.reset()}
    okText={t('exampleForms.leave.leave')} cancelText={t('exampleForms.leave.stay')}
    confirmLoading={busy} closable={!busy} keyboard={!busy} maskClosable={!busy}>
    <p className="text-13 leading-6 text-slate-600">{t('exampleForms.leave.description')}</p>
  </Modal>;
}
