import { t, useT } from '@/i18n';
import { useState } from 'react';
import { Modal } from '@/ui/modal';
import { Form } from '@/ui/form';
import { PasswordChangeForm, type PasswordFields } from './PasswordChangeForm';

export function PasswordChangeModal({ open, onClose, onPasswordChanged }: {
  open: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
}) {
  useT();
  const [changingPassword, setChangingPassword] = useState(false);
  const [form] = Form.useForm<PasswordFields>();
  return <Modal title={t('auth.changePassword')} icon="key-round" description={t('auth.passwordDescription')}
    open={open} onCancel={onClose} onOk={() => form.submit()} okText={t('auth.confirmChange')} confirmLoading={changingPassword} width={420}>
    <PasswordChangeForm form={form} hideSubmit onLoadingChange={setChangingPassword} onPasswordChanged={() => { onClose(); onPasswordChanged(); }} />
  </Modal>;
}
