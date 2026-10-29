import React from 'react';
import { cn } from '@/utils';
import { NavIcon, NavItemRenderer } from '../components';
import { navItemClasses } from '../styles';
import type { NavItemProps } from '../types';

export const NavRootItem: React.FC<NavItemProps> = (item) => {
  const { title, icon, active, disabled, hasChild } = item;

  const content = (
    <>
      <span className="inline-flex size-[22px] shrink-0 items-center justify-center">
        <NavIcon
          icon={icon}
          size={20}
          className={cn('transition-colors duration-200', active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600')}
        />
      </span>

      {hasChild && (
        <span className="absolute right-2 top-2 size-1 rounded-full bg-slate-300 transition-colors group-hover:bg-slate-500" />
      )}

      <span
        title={typeof title === 'string' ? title : undefined}
        className={cn(
          'max-w-[64px] truncate text-center text-[11px] leading-tight transition-colors duration-200',
          active ? 'font-medium text-slate-900' : 'text-slate-500 group-hover:text-slate-900'
        )}
      >
        {title}
      </span>
    </>
  );

  const itemClassName = cn(
    'relative group flex min-h-[58px] w-full cursor-pointer select-none flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 transition-colors duration-200',
    disabled && navItemClasses.disabled
  );

  return (
    <NavItemRenderer item={item} className={itemClassName}>
      {content}
    </NavItemRenderer>
  );
};
