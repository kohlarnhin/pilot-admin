import React from 'react';
import { cn } from '@/utils';
import type { NavProps } from '../types';
import { NavGroup } from './nav-group';

export const NavVertical: React.FC<NavProps> = ({ data, className, ...props }) => {
  return (
    <nav className={cn('flex w-full flex-col gap-1', className)} {...props}>
      {data.map((group, index) => (
        <NavGroup key={group.name || index} name={group.name} items={group.items} />
      ))}
    </nav>
  );
};

export * from './nav-group';
export * from './nav-item';
export * from './nav-list';
