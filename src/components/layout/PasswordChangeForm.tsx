import { useId, useRef, useState } from 'react';
import { t, useT } from '@/i18n';
import { authService, PASSWORD_CONFIRM_MISMATCH, PASSWORD_CURRENT_MISMATCH } from '@/api/services/authService';
import { ApiRequestError, isUnauthorizedError } from '@/api/http';
import { useAuthStore } from '@/store/authStore';
import { Form, type FormInstance } from '@/ui/form';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { message } from '@/ui/message';

export interface PasswordFields {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** 弹窗与个人中心共享校验、字段错误和提交锁；成功后由宿主退出登录。 */
export function PasswordChangeForm({ form: providedForm, onPasswordChanged, onLoadingChange, hideSubmit = false }: {
  form?: FormInstance<PasswordFields>;
  onPasswordChanged: () => void;
  onLoadingChange?: (loading: boolean) => void;
  hideSubmit?: boolean;
}) {
  useT();
  const id = useId();
  const [form] = Form.useForm<PasswordFields>(providedForm);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const submit = async (values: PasswordFields) => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    onLoadingChange?.(true);
    try {
      await authService.changePassword({ ...values });
      form.resetFields();
      message.success(t('auth.passwordChanged'));
      onPasswordChanged();
    } catch (error) {
      const text = (error as Error).message || t('auth.passwordChangeFailed');
      if (error instanceof ApiRequestError && error.status === 400) {
        const name = error.code === PASSWORD_CURRENT_MISMATCH ? 'oldPassword' : error.code === PASSWORD_CONFIRM_MISMATCH ? 'confirmPassword' : 'newPassword';
        form.setFields([{ name, errors: [text] }]);
      } else message.error(text);
      if (isUnauthorizedError(error)) await useAuthStore.getState().refreshMe().catch(() => undefined);
    } finally {
      lock.current = false;
      setSaving(false);
      onLoadingChange?.(false);
    }
  };
  return <Form form={form} onFinish={submit} disabled={saving}>
    <Form.Item name="oldPassword" htmlFor={`${id}-old-password`} label={t('auth.oldPassword')} rules={[{ required: true, message: t('auth.oldPasswordRequired') }]}>
      <Input.Password id={`${id}-old-password`} placeholder={t('auth.oldPasswordRequired')} autoComplete="current-password" />
    </Form.Item>
    <Form.Item name="newPassword" htmlFor={`${id}-new-password`} label={t('common.fields.newPassword')} rules={[{ required: true, message: t('common.validation.passwordRequired') }]}>
      <Input.Password id={`${id}-new-password`} placeholder={t('common.validation.passwordRequired')} autoComplete="new-password" />
    </Form.Item>
    <Form.Item name="confirmPassword" htmlFor={`${id}-confirm-password`} label={t('auth.confirmPassword')} className="mb-0" dependencies={['newPassword']}
      rules={[
        { required: true, message: t('auth.confirmPasswordRequired') },
        ({ getFieldValue }) => ({ validator(_, value) {
          if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
          return Promise.reject(new Error(t('serverErrors.password.confirmMismatch')));
        } }),
      ]}>
      <Input.Password id={`${id}-confirm-password`} placeholder={t('auth.confirmPasswordRequired')} autoComplete="new-password" />
    </Form.Item>
    {hideSubmit ? <button type="submit" hidden aria-hidden="true" tabIndex={-1} /> : <div className="mt-6 flex justify-end"><Button type="submit" loading={saving}>{t('auth.confirmChange')}</Button></div>}
  </Form>;
}
