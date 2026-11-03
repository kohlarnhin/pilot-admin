import type { ReactNode } from 'react';

/** 控件显式传入 id/ARIA，便于复制和错误摘要的焦点跳转。 */
export function Field({ id, label, required, error, hint, children }: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return <div className="min-w-0 space-y-1.5">
    <div className="flex items-center text-13 font-medium text-slate-800"><label id={`${id}-label`} htmlFor={id}>{label}</label>{required && <span aria-hidden="true" className="ml-1 text-red-600">*</span>}</div>
    {children}
    {(error || hint) && <div id={`${id}-help`} role={error ? 'alert' : undefined} className={`text-xs leading-5 ${error ? 'text-red-600' : 'text-slate-500'}`}>{error || hint}</div>}
  </div>;
}
