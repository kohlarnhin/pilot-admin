import type { Menu } from '@/types';

interface MenuConfig {
  id: string;
  route_path: string;
  icon: string;
  sort_no: number;
  children?: MenuConfig[];
  buttons?: { id: string; permission: string }[];
}

// 路由与权限的静态定义，显示名称可在菜单管理中覆盖。
export const menuConfig: MenuConfig[] = [
  { id: 'dashboard', route_path: '/dashboard', icon: 'layout-dashboard', sort_no: 1 },
  { id: 'system', route_path: '', icon: 'settings-2', sort_no: 2, children: [
    { id: 'users', route_path: '/system/users', icon: 'users', sort_no: 1, buttons: [
      { id: 'user-create', permission: 'user:create' },
      { id: 'user-update', permission: 'user:update' },
      { id: 'user-delete', permission: 'user:delete' },
      { id: 'user-reset-password', permission: 'user:reset-password' },
    ] },
    { id: 'roles', route_path: '/system/roles', icon: 'shield-check', sort_no: 2, buttons: [
      { id: 'role-create', permission: 'role:create' },
      { id: 'role-update', permission: 'role:update' },
      { id: 'role-delete', permission: 'role:delete' },
      { id: 'role-permissions', permission: 'role:permissions' },
    ] },
    { id: 'menus', route_path: '/system/menus', icon: 'list-tree', sort_no: 3,
      buttons: [{ id: 'menu-update', permission: 'menu:update' }] },
    { id: 'audit-logs', route_path: '/system/audit-logs', icon: 'history', sort_no: 3.5, buttons: [
      { id: 'audit-log-export', permission: 'audit-log:export' },
    ] },
    { id: 'assistant', route_path: '/system/assistant', icon: 'wand-sparkles', sort_no: 5 },
    { id: 'settings', route_path: '/system/settings', icon: 'settings-2', sort_no: 4, buttons: [
      { id: 'settings-update', permission: 'settings:update' },
      { id: 'settings-reset', permission: 'settings:reset' },
    ] },
  ] },
  { id: 'ai-permissions', route_path: '', icon: 'wand-sparkles', sort_no: 4, buttons: [
    { id: 'agent-use', permission: 'agent:use' },
    { id: 'agent-config-view', permission: 'agent-config:view' },
    { id: 'agent-config-update', permission: 'agent-config:update' },
  ] },
  { id: 'examples', route_path: '', icon: 'component', sort_no: 3, children: [
    { id: 'components', route_path: '/examples/components', icon: 'component', sort_no: 1 },
  ] },
];

const audit = { create_by: 'system', create_date: '2026-01-01T08:00:00+08:00', last_update_by: 'system', last_update_date: '2026-01-01T08:00:00+08:00' };

const toMenu = (config: MenuConfig, parent_id?: string): Menu => ({
  ...audit, ...config, parent_id, menu_name: config.id, menu_code: config.id, status: 1, visible: 1,
  buttons: (config.buttons || []).map((button, index) => ({
    ...audit, id: button.id, menu_id: config.id, button_name: button.id,
    button_code: button.id, permission_code: button.permission, sort_no: index + 1, status: 1,
  })),
  children: config.children?.map((child) => toMenu(child, config.id)),
});

export const DEFAULT_MENUS = menuConfig.map((menu) => toMenu(menu));
