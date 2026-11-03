import React, { useId, useState } from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';
import type { NavGroupProps } from '../types';
import { NavList } from './nav-list';

// Smooth CSS Grid Collapse animation
const CollapseContainer: React.FC<{ id: string; open: boolean; children: React.ReactNode }> = ({ id, open, children }) => (
  <div
    id={id}
    inert={!open}
    className={cn(
      'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    )}
  >
    <div className="overflow-hidden">{children}</div>
  </div>
);

export const NavGroup: React.FC<NavGroupProps> = ({ name, items }) => {
  const [open, setOpen] = useState(true);
  const contentId = useId();

  return (
    <div className="w-full">
      {name && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          className={cn(
            'group w-full inline-flex items-center justify-start relative gap-1.5 cursor-pointer pt-4 pr-2 pb-1.5 pl-3 transition-all duration-200 ease-in-out select-none',
            'hover:pl-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
          )}
          onClick={() => setOpen(!open)}
        >
          <Icon
            icon="chevron-right"
            size={14}
            className={cn(
              'absolute left-[-2px] shrink-0 text-slate-400 transition-all duration-200 ease-in-out opacity-0 group-hover:opacity-100',
              open && 'rotate-90'
            )}
          />
          <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-600">
            {name}
          </span>
        </button>
      )}

      <CollapseContainer id={contentId} open={open}>
        <div className="mt-0.5 flex w-full flex-col gap-0.5">
          {items.map((item, index) => (
            <NavList key={item.title || item.path || index} data={item} depth={1} />
          ))}
        </div>
      </CollapseContainer>
    </div>
  );
};
