import type { LucideIcon } from 'lucide-react';
import { Component, FileText, Folder, LayoutDashboard, ListTree, Settings2, ShieldCheck, Users } from 'lucide-react';
import { resolveIcon } from './registry';

const ROUTE_ICONS: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard, '/system/users': Users, '/system/roles': ShieldCheck,
  '/system/menus': ListTree, '/system/settings': Settings2, '/examples/components': Component,
};

/** 优先匹配路由，其次使用静态菜单的图标。 */
export const getMenuIcon = (route: string, customIcon?: string, hasChildren = false): LucideIcon =>
  ROUTE_ICONS[route] ?? resolveIcon(customIcon) ?? (hasChildren ? Folder : FileText);
