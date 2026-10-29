import { t, useT } from '@/i18n';
import { useState } from 'react';
import { authService } from '@/api/services/authService';
import { message } from '@/ui/message';
import { Modal } from '@/ui/modal';
import { Form } from '@/ui/form';
import { Input } from '@/ui/input';

/** The sidebar and workspace use the same password form and logout behavior. */
export function PasswordChangeModal({ open, onClose, onPasswordChanged }: {
  open: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
}) {
  useT();
  const [changingPassword, setChangingPassword] = useState(false);
  const [form] = Form.useForm();
  const handleChangePassword = async (values: any) => {
    try {
      setChangingPassword(true);
      await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      message.success(t('auth.passwordChanged'));
      onClose();
      form.resetFields();
      onPasswordChanged();
    } catch (error: any) {
      message.error(error.message || t('auth.passwordChangeFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Modal
      title={t('auth.changePassword')}
      icon="key-round"
      description={t('auth.passwordDescription')}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('auth.confirmChange')}
      confirmLoading={changingPassword}
      width={420}
    >
      <Form form={form} onFinish={handleChangePassword}>
        <Form.Item name="oldPassword" label={t('auth.oldPassword')} rules={[{ required: true, message: t('auth.oldPasswordRequired') }]}>
          <Input.Password placeholder={t('auth.oldPasswordRequired')} autoComplete="current-password" />
        </Form.Item>
        <Form.Item name="newPassword" label={t('auth.newPassword')} rules={[{ required: true, message: t('auth.newPasswordRequired') }]}>
          <Input.Password placeholder={t('auth.newPasswordRequired')} autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t('auth.confirmPassword')}
          className="mb-0"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('auth.confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error(t('auth.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password placeholder={t('auth.confirmPasswordRequired')} autoComplete="new-password" />
        </Form.Item>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </Form>
    </Modal>
  );
}
