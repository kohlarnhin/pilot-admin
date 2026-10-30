import { useRef, useState } from 'react';
import { t, useT } from '@/i18n';
import { ApiRequestError, isUnauthorizedError } from '@/api/errors';
import { profileService, PROFILE_EMAIL_INVALID, PROFILE_NAME_INVALID, type ProfileInput } from '@/api/services/profileService';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { Button } from '@/ui/button';
import { CardContent, CardFooter } from '@/ui/card';
import { Form } from '@/ui/form';
import { Input } from '@/ui/input';
import { message } from '@/ui/message';

export function ProfileDetails() {
  useT();
  const user = useAuthStore((state) => state.user);
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const [form] = Form.useForm<ProfileInput>();
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const save = async (values: ProfileInput) => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    try {
      const result = await profileService.updateProfile(values);
      form.setFieldsValue({ user_name: result.data.user_name, email: result.data.email || '' });
      await refreshMe();
      message.success(t('profile.toast.saved'));
    } catch (error) {
      if (error instanceof ApiRequestError && [PROFILE_NAME_INVALID, PROFILE_EMAIL_INVALID].includes(error.code ?? 0)) {
        form.setFields([{ name: error.code === PROFILE_NAME_INVALID ? 'user_name' : 'email', errors: [error.message] }]);
      } else message.error((error as Error).message || t('common.toast.saveFailed'));
      if (isUnauthorizedError(error)) await refreshMe().catch(() => undefined);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  return <Form form={form} initialValues={{ user_name: user?.user_name || '', email: user?.email || '' }} onFinish={save} disabled={saving} className="flex min-h-0 flex-1 flex-col">
    <CardContent className="min-h-0 flex-1 overflow-y-auto">
      <div className="max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <Avatar className="size-12 shrink-0"><AvatarFallback className="text-lg">{user?.user_name.slice(0, 1)}</AvatarFallback></Avatar>
          <div className="min-w-0"><div className="truncate text-13 font-medium text-slate-900" title={user?.user_name}>{user?.user_name}</div><div className="mt-1 font-mono text-xs text-slate-500">@{user?.login_name}</div></div>
        </div>
        <Form.Item label={t('profile.fields.loginName')} htmlFor="profile-login-name" help={t('profile.fields.loginHint')}>
          <Input id="profile-login-name" aria-describedby="profile-login-name_help" value={user?.login_name || ''} readOnly className="font-mono" />
        </Form.Item>
        <Form.Item name="user_name" label={t('profile.fields.displayName')} help={t('profile.fields.nameHint')}
          rules={[{ required: true, whitespace: true, message: t('common.validation.nameRequired') }, { max: 40, message: t('serverErrors.profile.invalidName') }]}>
          <Input maxLength={40} autoComplete="name" />
        </Form.Item>
        <Form.Item name="email" label={t('common.fields.email')} className="mb-0" help={t('profile.fields.emailHint')} rules={[{ type: 'email', message: t('common.validation.emailInvalid') }]}>
          <Input autoComplete="email" inputMode="email" />
        </Form.Item>
      </div>
    </CardContent>
    <CardFooter className="shrink-0 justify-end"><Button type="submit" loading={saving}>{t('common.actions.save')}</Button></CardFooter>
  </Form>;
}
