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

function MiniNavGroup({ title, disabled, children, trigger }: {
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const keyboardOpen = React.useRef(false);
  const links = () => Array.from(contentRef.current?.querySelectorAll<HTMLAnchorElement>('a[href]:not([aria-disabled="true"])') ?? []);
  const focusFirst = () => links()[0]?.focus();

  return <Popover
    open={open}
    onOpenChange={(next) => {
      if (!next && keyboardOpen.current && contentRef.current?.contains(document.activeElement)) return;
      if (!disabled) setOpen(next);
    }}
    content={<div ref={contentRef} className="flex flex-col gap-0.5">{children}</div>}
    placement="rightTop"
    mouseEnterDelay={0.1}
    className="w-44 p-1.5"
    contentProps={{
      'aria-label': title,
      onOpenAutoFocus: () => { if (keyboardOpen.current) focusFirst(); },
      onCloseAutoFocus: (event) => event.preventDefault(),
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        keyboardOpen.current = false;
        setOpen(false);
        triggerRef.current?.focus();
      },
      onPointerDownOutside: () => { keyboardOpen.current = false; },
      onFocusOutside: () => { keyboardOpen.current = false; },
      onClick: (event) => {
        if (!(event.target instanceof Element) || !event.target.closest('a[href]')) return;
        keyboardOpen.current = false;
        setOpen(false);
      },
      onKeyDown: (event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const items = links();
        const current = items.indexOf(document.activeElement as HTMLAnchorElement);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        event.preventDefault();
        items[index]?.focus();
      },
    }}
  >
    <button ref={triggerRef} type="button" disabled={disabled} className="w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      onKeyDown={(event) => {
        if (!['Enter', ' ', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        keyboardOpen.current = true;
        setOpen(true);
        if (open) focusFirst();
      }}>
      {trigger}
    </button>
  </Popover>;
}

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
          <div className="mb-1 border-b border-line-soft px-2.5 pb-1.5 pt-1 text-xs font-medium text-slate-500">
            {data.title}
          </div>
          {data.children?.map((child, index) => (
            <NavList key={child.title || child.path || index} data={child} depth={depth + 1} />
          ))}
        </div>
      );

      return (
        <MiniNavGroup title={data.title} disabled={data.disabled} trigger={rootItem}>
          {popoverContent}
        </MiniNavGroup>
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
