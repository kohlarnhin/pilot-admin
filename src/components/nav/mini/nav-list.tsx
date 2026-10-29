import React from 'react';
import { useLocation } from 'react-router';
import { Tooltip } from '@/ui/tooltip';
import { Popover } from '@/ui/popover';
import type { NavListProps, NavItemDataProps } from '../types';
import { NavRootItem } from './nav-root-item';
import { NavSubItem } from './nav-sub-item';

const checkIsActive = (pathname: string, item: NavItemDataProps): boolean => {
  if (pathname === item.path) return true;
  if (item.path && item.path !== '/' && pathname.startsWith(`${item.path}/`)) return true;
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => checkIsActive(pathname, child));
  }
  return false;
};

export const NavList: React.FC<NavListProps> = ({ data, depth = 1 }) => {
  const location = useLocation();
  const hasChild = Boolean(data.children && data.children.length > 0);
  const isActive = data.active ?? checkIsActive(location.pathname, data);

  if (data.hidden) {
    return null;
  }

  if (depth === 1) {
    const rootItem = (
      <NavRootItem
        title={data.title}
        onClick={data.onClick}
        path={data.path}
        icon={data.icon}
        info={data.info}
        caption={data.caption}
        auth={data.auth}
        active={isActive}
        disabled={data.disabled}
        hasChild={hasChild}
        depth={depth}
      />
    );

    if (hasChild) {
      const popoverContent = (
        <div className="flex flex-col gap-0.5">
          <div className="mb-1 border-b border-line-soft px-2.5 pb-1.5 pt-1 text-xs font-medium text-slate-400">
            {data.title}
          </div>
          {data.children?.map((child, index) => (
            <NavList key={child.title || child.path || index} data={child} depth={depth + 1} />
          ))}
        </div>
      );

      return (
        <Popover
          content={popoverContent}
          placement="rightTop"
          mouseEnterDelay={0.1}
          className="w-44 p-1.5"
        >
          <div className="w-full">{rootItem}</div>
        </Popover>
      );
    }

    return (
      <Tooltip title={data.title} placement="right" mouseEnterDelay={0.2}>
        <div className="w-full">{rootItem}</div>
      </Tooltip>
    );
  }

  // Depth > 1: Sub-level in Popover
  return (
    <NavSubItem
      title={data.title}
      onClick={data.onClick}
      path={data.path}
      icon={data.icon}
      info={data.info}
      caption={data.caption}
      auth={data.auth}
      active={data.active ?? (location.pathname === data.path || (data.path !== '/' && location.pathname.startsWith(`${data.path}/`)))}
      disabled={data.disabled}
      hasChild={hasChild}
      depth={depth}
    />
  );
};
