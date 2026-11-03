import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';

export type ResultStatus = 'success' | 'error' | 'info' | 'warning' | '403' | '404' | '500' | 'network' | 'maintenance';

const illustrations: Record<ResultStatus, { icon: string; tone: string }> = {
  success: { icon: 'circle-check', tone: 'text-emerald-600' },
  error: { icon: 'circle-x', tone: 'text-red-600' },
  info: { icon: 'circle-help', tone: 'text-slate-600' },
  warning: { icon: 'triangle-alert', tone: 'text-amber-700' },
  '403': { icon: 'shield-check', tone: 'text-brand-500' },
  '404': { icon: 'map-pin', tone: 'text-brand-500' },
  '500': { icon: 'circle-alert', tone: 'text-brand-500' },
  network: { icon: 'globe', tone: 'text-slate-600' },
  maintenance: { icon: 'wrench', tone: 'text-slate-600' },
};

interface ResultProps {
  status: ResultStatus;
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  children?: ReactNode;
  headingLevel?: 1 | 2 | 3;
  className?: string;
  /** 错误页适配保留原有状态码与图标。 */
  code?: string;
  icon?: string;
}

/** 结果内容不拥有页面滚动；宿主选择有限高面板或自然滚动页面。 */
export function Result({ status, title, description, extra, children, headingLevel = 2, className, code, icon }: ResultProps) {
  const illustration = illustrations[status];
  const Heading = `h${headingLevel}` as const;
  const label = code ?? (/^\d{3}$/.test(status) ? status : undefined);
  return <div data-result-status={status} className={cn('flex w-full shrink-0 flex-col items-center py-6 text-center', className)}>
    <span className={cn('flex size-14 items-center justify-center rounded-2xl border border-line bg-white shadow-2xs', illustration.tone)}>
      <Icon icon={icon || illustration.icon} size={28} />
    </span>
    {label && <div className="mt-5 font-mono text-xs font-medium tracking-[0.2em] text-slate-500">{label}</div>}
    <Heading className={cn('text-lg font-semibold text-slate-900', label ? 'mt-1.5' : 'mt-5')}>{title}</Heading>
    {description && <p className="mt-2 max-w-md text-13 leading-6 text-slate-500">{description}</p>}
    {extra && <div className="mt-6 flex flex-wrap justify-center gap-3">{extra}</div>}
    {children}
  </div>;
}
