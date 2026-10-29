import { ApiRequestError } from '@/api/http';
import { LocaleSwitcher } from '@/components/common/LocaleSwitcher';
import { t, useT } from '@/i18n';
import commonSource from '@/i18n/locales/zh-CN/common';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { canAccessAgent, getLoginLandingRoute } from '@/agent/access';
import { AgentEntryDialog } from '@/agent/AgentEntryDialog';
import { appConfig } from '@/config/app';
import { message } from '@/ui/message';
import { Input } from '@/ui/input';
import { FieldHint, FieldLabel } from '@/ui/form';
import { Button } from '@/ui/button';
import { Logo } from '@/components/logo';
import { ParticleField } from './ParticleField';
import { preloadRoute } from '@/routes/routeModules';
import { User, Lock, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'auth.adminRole', account: 'admin', password: 'admin123' },
  { name: 'auth.operatorRole', account: 'operator', password: 'operator123' },
  { name: 'auth.viewerRole', account: 'viewer', password: 'viewer123' },
] as const;

export const LoginPage: React.FC = () => {
  const { locale } = useT();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const siteName = useAppStore((state) => state.siteName);
  const siteDescription = useAppStore((state) => state.siteDescription);
  const navigate = useNavigate();
  const [askEntry, setAskEntry] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [isPreparingPage, setIsPreparingPage] = useState(false);
  const [accountError, setAccountError] = useState<'auth.accountRequired' | null>(null);
  const [passwordError, setPasswordError] = useState<'auth.passwordRequired' | 'serverErrors.auth.invalidCredentials' | 'serverErrors.auth.accountDisabled' | 'auth.loginFailed' | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const isBusy = isLoading || isPreparingPage;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current) return;
    setAccountError(null); setPasswordError(null);
    if (!loginName.trim()) { setAccountError('auth.accountRequired'); accountRef.current?.focus(); return; }
    if (!password) { setPasswordError('auth.passwordRequired'); passwordRef.current?.focus(); return; }
    busyRef.current = true;
    try {
      await login(loginName.trim(), password);
      setIsPreparingPage(true);
      const state = useAuthStore.getState();
      if (canAccessAgent(state.menus, state.permissions) && state.preferences.agent_mode_entry === 'ask') { setAskEntry(true); setIsPreparingPage(false); return; }
      const target = getLoginLandingRoute(state.menus, state.permissions, state.preferences);
      const preloading = preloadRoute(target);
      if (preloading) await Promise.race([preloading, new Promise<void>((resolve) => window.setTimeout(resolve, 500))]);
      message.success(t('auth.loginSuccess'));
      navigate(target, { replace: true });
    } catch (error) {
      setIsPreparingPage(false);
      setPasswordError(error instanceof ApiRequestError && error.status === 400 ? 'serverErrors.auth.invalidCredentials'
        : error instanceof ApiRequestError && error.status === 403 ? 'serverErrors.auth.accountDisabled' : 'auth.loginFailed');
      requestAnimationFrame(() => { passwordRef.current?.focus(); passwordRef.current?.select(); });
    } finally { busyRef.current = false; }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-12 text-slate-900">
      {askEntry ? <AgentEntryDialog onChoose={(agent) => { setAskEntry(false); const state = useAuthStore.getState(); navigate(agent ? '/agent' : getLoginLandingRoute(state.menus, state.permissions, { agent_mode_entry: 'console' }), { replace: true }); }} /> : null}
      <ParticleField clearRef={contentRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div ref={contentRef} className="relative w-full max-w-[380px] animate-fade-up">
        <div className="absolute right-0 top-0 z-10"><LocaleSwitcher /></div>
        <div className="flex flex-col items-center text-center">
          <Logo size={40} disableLink />
          <h1 className="mt-5 text-[22px] font-semibold leading-8 tracking-tight text-slate-900">{t('auth.loginTitle', { name: siteName })}</h1>
          <p className="mt-1 text-13 leading-5 text-slate-500">{siteDescription === commonSource.appDescription ? t('common.appDescription') : siteDescription}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
          <div>
            <FieldLabel htmlFor="login-name">{t('common.fields.account')}</FieldLabel>
            <Input id="login-name" ref={accountRef} size="large" autoFocus autoComplete="username" value={loginName}
              onChange={(event) => { setLoginName(event.target.value); setAccountError(null); setPasswordError(null); }}
              placeholder={t('auth.accountRequired')} disabled={isBusy} aria-invalid={accountError ? true : undefined}
              aria-describedby={accountError ? 'login-account-error' : undefined} prefix={<User className="size-4" />} />
            {accountError && <FieldHint id="login-account-error" error>{t(accountError)}</FieldHint>}
          </div>
          <div>
            <FieldLabel htmlFor="login-password">{t('common.fields.password')}</FieldLabel>
            <Input.Password id="login-password" ref={passwordRef} size="large" autoComplete="current-password" value={password}
              onChange={(event) => { setPassword(event.target.value); setPasswordError(null); }} placeholder={t('auth.passwordRequired')}
              disabled={isBusy} aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? 'login-password-error' : undefined} prefix={<Lock className="size-4" />} />
            {passwordError && <FieldHint id="login-password-error" error>{t(passwordError)}</FieldHint>}
          </div>
          <Button type="submit" variant="primary" size="lg" className="!mt-6 w-full" loading={isBusy}>
            {t('auth.login')}{!isBusy && <ArrowRight className="size-4" />}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200/80" />{t('auth.demoAccounts')}<span className="h-px flex-1 bg-slate-200/80" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((demo) => (
            <button type="button" key={demo.account} disabled={isBusy} aria-label={t('auth.fillDemo', { role: t(demo.name) })}
              onClick={() => { setLoginName(demo.account); setPassword(demo.password); setAccountError(null); setPasswordError(null); passwordRef.current?.focus(); }}
              className="cursor-pointer rounded-lg border border-line bg-white px-2 py-2.5 text-center transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50">
              <span className="block text-xs font-medium text-slate-700">{t(demo.name)}</span>
              <span className="mt-1 block font-mono text-[11px] text-slate-500">{demo.account}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">{t('auth.demoNote')}</p>
      </div>
      <div className="absolute bottom-6 rounded-full bg-white/85 px-2.5 py-0.5 text-xs text-slate-400">© {new Date().getFullYear()} {appConfig.name} · {locale === 'zh-CN' ? appConfig.zhName : appConfig.shortName}</div>
    </div>
  );
};
