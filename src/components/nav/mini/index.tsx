import React from 'react';
import { cn } from '@/utils';
import type { NavProps } from '../types';
import { NavGroup } from './nav-group';

export const NavMini: React.FC<NavProps> = ({ data, className, ...props }) => {
  return (
    <nav className={cn('flex w-full flex-col gap-2', className)} {...props}>
      {data.map((item, index) => (
        <NavGroup key={item.name || index} name={item.name} items={item.items} />
      ))}
    </nav>
  );
};

export * from './nav-group';
export * from './nav-root-item';
export * from './nav-sub-item';
export * from './nav-list';
