import React from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';
import { NavIcon, NavItemRenderer } from '../components';
import { navItemClasses } from '../styles';
import type { NavItemProps } from '../types';

export const NavSubItem: React.FC<NavItemProps> = (item) => {
  const { title, icon, active, disabled, hasChild } = item;

  const content = (
    <>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <NavIcon icon={icon} size={16} className={active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
        ) : (
          <span className={cn('size-1.5 shrink-0 rounded-full', active ? 'bg-brand-500' : 'bg-slate-300')} />
        )}
        <span className="truncate" title={typeof title === 'string' ? title : undefined}>{title}</span>
      </div>

      {hasChild && <Icon icon="chevron-right" size={12} className="ml-1 shrink-0 text-slate-400" />}
    </>
  );

  const itemClassName = cn(
    'group flex min-h-[34px] w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-13 transition-colors',
    active ? 'font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900',
    disabled && navItemClasses.disabled
  );

  return (
    <NavItemRenderer item={item} className={itemClassName}>
      {content}
    </NavItemRenderer>
  );
};
