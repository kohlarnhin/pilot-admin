import type React from 'react';
import { Icon } from '@/components/icon';

interface StatusPageProps {
  code: string;
  icon: string;
  title: string;
  description: React.ReactNode;
  actions: React.ReactNode;
  fullScreen?: boolean;
  children?: React.ReactNode;
}

export const StatusPage: React.FC<StatusPageProps> = ({
  code, icon, title, description, actions, fullScreen = false, children,
}) => (
  <div className={`flex w-full flex-col items-center overflow-y-auto p-6 text-center ${fullScreen ? 'min-h-svh bg-white' : 'h-full min-h-[60vh]'}`}>
    <div className="my-auto flex w-full shrink-0 flex-col items-center py-6">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-line bg-white text-brand-500 shadow-2xs">
        <Icon icon={icon} size={28} />
      </span>
      <div className="mt-5 font-mono text-xs font-medium tracking-[0.2em] text-slate-500">{code}</div>
      <h1 className="mt-1.5 text-lg font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-md text-13 leading-6 text-slate-500">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
      {children}
    </div>
  </div>
);
