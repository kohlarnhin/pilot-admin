import React from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';
import { Tooltip } from '@/ui/tooltip';
import { NavIcon, NavItemRenderer } from '../components';
import { navItemClasses, navItemStyles } from '../styles';
import type { NavItemProps } from '../types';

export const NavItem: React.FC<NavItemProps> = (item) => {
  const { title, icon, info, caption, open, active, disabled, depth = 1, hasChild } = item;

  const isLevelOne = depth === 1;

  const content = (
    <>
      {/* 一级菜单显示图标；子级未配置图标时显示小圆点 */}
      <span style={navItemStyles.icon} className="mr-3">
        {icon ? (
          <NavIcon
            icon={icon}
            size={isLevelOne ? 18 : 16}
            className={cn('transition-colors duration-200', active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600')}
          />
        ) : !isLevelOne ? (
          <span
            className={cn(
              'size-1.5 rounded-full transition-colors duration-200',
              active ? 'bg-brand-500' : 'bg-slate-300 group-hover:bg-slate-500'
            )}
          />
        ) : null}
      </span>

      <span style={navItemStyles.texts} className="min-h-[22px]">
        <span style={navItemStyles.title} title={typeof title === 'string' ? title : undefined} className="transition-colors duration-200">
          {title}
        </span>

        {caption && (
          <Tooltip title={caption} placement="topLeft">
            <span style={navItemStyles.caption}>{caption}</span>
          </Tooltip>
        )}
      </span>

      {info && <span style={navItemStyles.info}>{info}</span>}

      {hasChild && (
        <span
          style={navItemStyles.arrow}
          className={cn('shrink-0 transition-transform duration-300 ease-in-out', open ? 'rotate-90 text-slate-500' : 'rotate-0 text-slate-300')}
        >
          <Icon icon="chevron-right" size={14} />
        </span>
      )}
    </>
  );

  const itemClassName = cn(
    navItemClasses.base,
    'group',
    isLevelOne ? 'min-h-[40px]' : 'min-h-[36px] py-1.5',
    active && (isLevelOne ? navItemClasses.active : navItemClasses.subActive),
    !active && navItemClasses.hover,
    disabled && navItemClasses.disabled
  );

  return (
    <NavItemRenderer item={item} className={itemClassName}>
      {content}
    </NavItemRenderer>
  );
};
