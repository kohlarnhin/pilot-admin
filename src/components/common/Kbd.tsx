import type { ComponentProps } from 'react';
import { cn } from '@/utils';

export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn('inline-flex shrink-0 items-center rounded border border-white/15 bg-white/10 px-1 py-px font-sans text-[11px] leading-4 text-slate-300', className)}
      {...props}
    />
  );
}
