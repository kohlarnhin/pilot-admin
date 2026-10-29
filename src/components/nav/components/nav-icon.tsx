import React from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';
import type { NavItemDataProps } from '../types';

/** 导航图标：优先渲染图标组件（lucide），兼容 Iconify 名称与任意节点。 */
export const NavIcon: React.FC<{ icon: NavItemDataProps['icon']; size: number; className?: string }> = ({ icon, size, className }) => {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return <Icon icon={icon} size={size} className={cn('shrink-0', className)} />;
  }
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon && !React.isValidElement(icon))) {
    const Component = icon as React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
    return <Component className={cn('shrink-0', className)} strokeWidth={1.9} style={{ width: size, height: size }} />;
  }
  return <>{icon as React.ReactNode}</>;
};
