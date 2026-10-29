import type React from 'react';

export type NavIconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

export type NavItemOptionsProps = {
  depth?: number;
  hasChild?: boolean;
};

export type NavItemStateProps = {
  open?: boolean;
  active?: boolean;
  disabled?: boolean;
  hidden?: boolean;
};

export type NavItemDataProps = {
  path: string;
  title: string;
  /** Iconify 名称、React 节点或图标组件（推荐：lucide 图标组件，随代码打包不闪烁） */
  icon?: string | React.ReactNode | NavIconComponent;
  info?: React.ReactNode;
  caption?: string;
  auth?: string[];
  children?: NavItemDataProps[];
  onClick?: React.MouseEventHandler<HTMLDivElement>;
} & NavItemStateProps;

/**
 * Item Props
 */
export type NavItemProps = React.ComponentProps<'div'> & NavItemDataProps & NavItemOptionsProps;

/**
 * List Props
 */
export type NavListProps = Pick<NavItemProps, 'depth'> & {
  data: NavItemDataProps;
  authenticate?: (auth?: string[]) => boolean;
};

/**
 * Group Props
 */
export type NavGroupProps = Omit<NavListProps, 'data' | 'depth'> & {
  name?: string;
  items: NavItemDataProps[];
};

/**
 * Main Nav Props
 */
export type NavProps = React.ComponentProps<'nav'> &
  Omit<NavListProps, 'data' | 'depth'> & {
    data: {
      name?: string;
      items: NavItemDataProps[];
    }[];
  };
