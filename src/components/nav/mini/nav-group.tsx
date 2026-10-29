import React from 'react';
import type { NavGroupProps } from '../types';
import { NavList } from './nav-list';

export const NavGroup: React.FC<NavGroupProps> = ({ items }) => {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {items.map((item, index) => (
        <NavList key={item.title || item.path || index} data={item} depth={1} />
      ))}
    </div>
  );
};
