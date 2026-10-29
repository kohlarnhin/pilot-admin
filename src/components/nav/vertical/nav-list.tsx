import React, { useState } from 'react';
import { useLocation } from 'react-router';
import { cn } from '@/utils';
import type { NavListProps, NavItemDataProps } from '../types';
import { NavItem } from './nav-item';

const checkIsActive = (pathname: string, item: NavItemDataProps): boolean => {
  if (pathname === item.path) return true;
  if (item.path && item.path !== '/' && pathname.startsWith(`${item.path}/`)) return true;
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => checkIsActive(pathname, child));
  }
  return false;
};

// Smooth CSS Grid Collapse animation
const CollapseContainer: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => (
  <div
    className={cn(
      'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    )}
  >
    <div className="overflow-hidden">{children}</div>
  </div>
);

export const NavList: React.FC<NavListProps> = ({ data, depth = 1 }) => {
  const location = useLocation();
  const hasChild = Boolean(data.children && data.children.length > 0);
  
  // Exact leaf match for active style; for parent item, check exact or child
  const isLeafActive = location.pathname === data.path || (data.path !== '/' && location.pathname.startsWith(`${data.path}/`));
  const isActive = hasChild ? false : (data.active ?? isLeafActive);
  
  const [open, setOpen] = useState<boolean>(() => {
    return checkIsActive(location.pathname, data);
  });

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    data.onClick?.(event);
    if (!event.defaultPrevented && hasChild) {
      setOpen(!open);
    }
  };

  if (data.hidden) {
    return null;
  }

  return (
    <div data-nav-type="list" className="w-full">
      <NavItem
        // data
        title={data.title}
        path={data.path}
        icon={data.icon}
        info={data.info}
        caption={data.caption}
        auth={data.auth}
        // state
        open={open}
        active={isActive}
        disabled={data.disabled}
        // options
        hasChild={hasChild}
        depth={depth}
        // event
        onClick={handleClick}
      />
      {hasChild && (
        <CollapseContainer open={open}>
          <div className="ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2">
            {data.children?.map((child, index) => (
              <NavList key={child.title || child.path || index} data={child} depth={depth + 1} />
            ))}
          </div>
        </CollapseContainer>
      )}
    </div>
  );
};
