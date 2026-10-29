import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { getFirstAccessibleRoute } from '@/api/services/menuService';
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
  { name: '超级管理员', account: 'admin', password: 'admin123' },
  { name: '运营人员', account: 'operator', password: 'operator123' },
  { name: '访客', account: 'viewer', password: 'viewer123' },
];

export const LoginPage: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const siteName = useAppStore((state) => state.siteName);
  const navigate = useNavigate();
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [isPreparingPage, setIsPreparingPage] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const isBusy = isLoading || isPreparingPage;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current) return;
    setAccountError(null); setPasswordError(null);
    if (!loginName.trim()) { setAccountError('请输入登录账号'); accountRef.current?.focus(); return; }
    if (!password) { setPasswordError('请输入密码'); passwordRef.current?.focus(); return; }
    busyRef.current = true;
    try {
      await login(loginName.trim(), password);
      setIsPreparingPage(true);
      const target = getFirstAccessibleRoute(useAuthStore.getState().menus);
      const preloading = preloadRoute(target);
      if (preloading) await Promise.race([preloading, new Promise<void>((resolve) => window.setTimeout(resolve, 500))]);
      message.success('登录成功');
      navigate(target, { replace: true });
    } catch (error) {
      setIsPreparingPage(false);
      setPasswordError(error instanceof Error ? error.message : '登录失败，请重试');
      requestAnimationFrame(() => { passwordRef.current?.focus(); passwordRef.current?.select(); });
    } finally { busyRef.current = false; }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-4 py-12 text-slate-900">
      <ParticleField clearRef={contentRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div ref={contentRef} className="relative w-full max-w-[380px] animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <Logo size={40} disableLink />
          <h1 className="mt-5 text-[22px] font-semibold leading-8 tracking-tight text-slate-900">登录 {siteName}</h1>
          <p className="mt-1 text-13 leading-5 text-slate-500">{appConfig.description}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
          <div>
            <FieldLabel htmlFor="login-name">账号</FieldLabel>
            <Input id="login-name" ref={accountRef} size="large" autoFocus autoComplete="username" value={loginName}
              onChange={(event) => { setLoginName(event.target.value); setAccountError(null); setPasswordError(null); }}
              placeholder="请输入登录账号" disabled={isBusy} aria-invalid={accountError ? true : undefined}
              aria-describedby={accountError ? 'login-account-error' : undefined} prefix={<User className="size-4" />} />
            {accountError && <FieldHint id="login-account-error" error>{accountError}</FieldHint>}
          </div>
          <div>
            <FieldLabel htmlFor="login-password">密码</FieldLabel>
            <Input.Password id="login-password" ref={passwordRef} size="large" autoComplete="current-password" value={password}
              onChange={(event) => { setPassword(event.target.value); setPasswordError(null); }} placeholder="请输入密码"
              disabled={isBusy} aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? 'login-password-error' : undefined} prefix={<Lock className="size-4" />} />
            {passwordError && <FieldHint id="login-password-error" error>{passwordError}</FieldHint>}
          </div>
          <Button type="submit" variant="primary" size="lg" className="!mt-6 w-full" loading={isBusy}>
            登录{!isBusy && <ArrowRight className="size-4" />}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200/80" />演示账号<span className="h-px flex-1 bg-slate-200/80" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((demo) => (
            <button type="button" key={demo.account} disabled={isBusy} aria-label={`填入${demo.name}账号`}
              onClick={() => { setLoginName(demo.account); setPassword(demo.password); setAccountError(null); setPasswordError(null); passwordRef.current?.focus(); }}
              className="cursor-pointer rounded-lg border border-line bg-white px-2 py-2.5 text-center transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50">
              <span className="block text-xs font-medium text-slate-700">{demo.name}</span>
              <span className="mt-1 block font-mono text-[11px] text-slate-500">{demo.account}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">点击填入账号与密码 · 所有操作仅保存在当前浏览器</p>
      </div>
      <div className="absolute bottom-6 rounded-full bg-white/85 px-2.5 py-0.5 text-xs text-slate-400">© {new Date().getFullYear()} {appConfig.name} · {appConfig.zhName}</div>
    </div>
  );
};
