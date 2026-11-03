import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { t, useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/common/PageHeader';
import { PasswordChangeForm, type PasswordFields } from '@/components/layout/PasswordChangeForm';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Form } from '@/ui/form';
import { getRovingTabProps } from '@/ui/roving-tabs';
import { cn } from '@/utils';
import { ProfileDetails } from './ProfileDetails';
import { ProfilePreferences } from './ProfilePreferences';
import { ProfilePermissions } from './ProfilePermissions';

const SECTIONS = [
  { key: 'basic', icon: 'user', title: 'profile.sections.basic.title', description: 'profile.sections.basic.description' },
  { key: 'security', icon: 'shield-check', title: 'profile.sections.security.title', description: 'profile.sections.security.description' },
  { key: 'preferences', icon: 'settings-2', title: 'profile.sections.preferences.title', description: 'profile.sections.preferences.description' },
  { key: 'permissions', icon: 'key-round', title: 'profile.sections.permissions.title', description: 'profile.sections.permissions.description' },
] as const;

function ProfileSecurity() {
  const [form] = Form.useForm<PasswordFields>();
  const [saving, setSaving] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  return <>
    <CardContent className="min-h-0 flex-1 overflow-y-auto"><div className="max-w-xl">
      <p className="mb-5 text-xs leading-5 text-slate-500">{t('auth.passwordDescription')}</p>
      <PasswordChangeForm form={form} hideSubmit onLoadingChange={setSaving} onPasswordChanged={() => { logout(); navigate('/login', { replace: true }); }} />
    </div></CardContent>
    <CardFooter className="shrink-0 justify-end"><Button loading={saving} onClick={() => form.submit()}>{t('auth.confirmChange')}</Button></CardFooter>
  </>;
}

export function ProfilePage() {
  useT();
  const [params, setParams] = useSearchParams();
  const section = SECTIONS.find((item) => item.key === params.get('tab')) || SECTIONS[0];
  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
    <PageHeader title={t('profile.title')} description={t('profile.description')} />
    <div className="flex min-h-0 min-w-0 flex-1 gap-5">
      <Card className="w-64 shrink-0 xl:w-72">
        <div role="tablist" aria-label={t('profile.sectionLabel')} aria-orientation="vertical" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {SECTIONS.map((item) => <button key={item.key} type="button" role="tab" id={`profile-tab-${item.key}`} aria-selected={item.key === section.key} aria-controls={`profile-panel-${item.key}`}
            {...getRovingTabProps(item.key === section.key, () => setParams({ tab: item.key }, { replace: true }), 'vertical')}
            onClick={() => setParams({ tab: item.key }, { replace: true })}
            className={cn('flex w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus', item.key === section.key ? 'border-line bg-slate-100 text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50')}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500"><Icon icon={item.icon} size={18} /></span>
            <span className="min-w-0"><span className="block text-13 font-medium">{t(item.title)}</span><span className="mt-0.5 block text-[11px] text-slate-600">{t(item.description)}</span></span>
          </button>)}
        </div>
      </Card>
      <Card className="min-h-0 min-w-0 flex-1">
        <CardHeader className="shrink-0"><div><CardTitle>{t(section.title)}</CardTitle><CardDescription>{t(section.description)}</CardDescription></div></CardHeader>
        {/* 保留各分区实例，语言或分区切换不会丢失未保存的资料。 */}
        {SECTIONS.map((item) => <section key={item.key} role="tabpanel" id={`profile-panel-${item.key}`} aria-labelledby={`profile-tab-${item.key}`} tabIndex={item.key === section.key ? 0 : -1} className={cn('min-h-0 min-w-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus', item.key === section.key ? 'flex' : 'hidden')}>
          {item.key === 'basic' ? <ProfileDetails /> : item.key === 'security' ? <ProfileSecurity /> : item.key === 'preferences' ? <ProfilePreferences /> : <ProfilePermissions />}
        </section>)}
      </Card>
    </div>
  </div>;
}
