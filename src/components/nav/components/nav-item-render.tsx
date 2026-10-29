import React from 'react';
import { NavLink, useNavigate } from 'react-router';
import { preloadRoute } from '@/routes/routeModules';
import type { NavItemProps } from '../types';

type NavItemRendererProps = {
  item: NavItemProps;
  className: string;
  children: React.ReactNode;
};

/**
 * Renderer for Navigation Items.
 * Handles disabled, external link, clickable child container, and internal NavLink.
 */
export const NavItemRenderer: React.FC<NavItemRendererProps> = ({ item, className, children }) => {
  const { disabled, hasChild, path, onClick } = item;
  const navigate = useNavigate();
  const [isPending, startNavigationTransition] = React.useTransition();

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  if (hasChild) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  const handleInternalClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    handleAnchorClick(event);
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    event.preventDefault();
    startNavigationTransition(() => navigate(path));
  };

  const handleNavigationIntent = () => {
    void preloadRoute(path);
  };

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return (
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={handleAnchorClick}
      >
        {children}
      </a>
    );
  }

  return (
    <NavLink
      to={path}
      end={item.active === false}
      className={className}
      onClick={handleInternalClick}
      onPointerEnter={handleNavigationIntent}
      onFocus={handleNavigationIntent}
      onTouchStart={handleNavigationIntent}
      aria-busy={isPending}
    >
      {children}
    </NavLink>
  );
};
