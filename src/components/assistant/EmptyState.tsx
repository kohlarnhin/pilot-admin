import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { LogoMark } from '@/components/logo';
import { EmptyState as CommonEmptyState } from '@/components/common/EmptyState';
import { Button, buttonVariants } from '@/ui/button';
import { DEFAULT_AGENT_PROFILE, type AgentProfile } from '@/api/services/agentProfileService';
import { useAuthStore } from '@/store/authStore';
import { canAccessPage } from '@/routes/access';

export function EmptyState({ profile = DEFAULT_AGENT_PROFILE, notConfigured, disabled, onPrompt, fullScreen = false }: {
  profile?: AgentProfile; notConfigured?: boolean; disabled?: boolean; onPrompt: (prompt: string) => void; fullScreen?: boolean;
}) {
  const { menus, permissions } = useAuthStore();
  const canConfigure = canAccessPage('/system/assistant', { menus, permissions });
  if (notConfigured) return <CommonEmptyState icon="settings-2" title="尚未配置可用模型" description={canConfigure ? '请启用一个模型配置后再试。' : '请联系管理员配置可用模型。'}
    className="min-h-64 [&>div:last-child]:text-slate-500" action={canConfigure ? <Link to="/system/assistant" className={buttonVariants({ size: 'sm' })}>前往助手设置</Link> : undefined} />;
  return <div className={`mx-auto flex w-full flex-col items-center px-1 py-10 sm:py-12 ${fullScreen ? 'my-auto max-w-[640px]' : 'max-w-md'}`}>
    <div className="mb-5 rounded-2xl border border-line-soft bg-slate-50 p-3"><LogoMark size={40} /></div>
    {fullScreen ? <p className="mb-2 font-mono text-[11px] tracking-[0.18em] text-brand-700">AGENT / 工作空间</p> : null}
    <h3 className={fullScreen ? 'text-2xl font-semibold tracking-tight text-slate-900' : 'text-lg font-semibold tracking-tight text-slate-900'}>{profile.name}</h3>
    <p className="mt-2 whitespace-pre-wrap text-center text-13 leading-6 text-slate-500">{profile.greeting}</p>
    <div className={`mt-8 grid w-full grid-cols-1 gap-2 ${fullScreen ? 'sm:grid-cols-3' : 'min-[360px]:grid-cols-2'}`}>
      {profile.suggestions.map(({ label, prompt }, index) => <Button key={index} variant="outline" disabled={disabled} onClick={() => onPrompt(prompt)} className="group h-auto min-w-0 justify-start gap-2 rounded-xl px-3 py-3 text-left font-normal shadow-none hover:border-slate-300 hover:bg-slate-50"><span className="min-w-0 flex-1 text-xs">{label}</span><ArrowUpRight className="size-3 text-slate-300 group-hover:text-brand-700" /></Button>)}
    </div>
    <p className="mt-5 text-[11px] text-slate-400">从一个问题开始，或直接描述你的需求</p>
  </div>;
}
