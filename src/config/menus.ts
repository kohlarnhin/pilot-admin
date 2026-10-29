import type { Menu } from '@/types';

interface MenuConfig {
  id: string;
  menu_name: string;
  route_path: string;
  icon: string;
  sort_no: number;
  children?: MenuConfig[];
  buttons?: { id: string; button_name: string; permission: string }[];
}

// 路由与权限的静态定义，显示名称可在菜单管理中覆盖。
export const menuConfig: MenuConfig[] = [
  { id: 'dashboard', menu_name: '概览', route_path: '/dashboard', icon: 'layout-dashboard', sort_no: 1 },
  { id: 'system', menu_name: '系统管理', route_path: '', icon: 'settings-2', sort_no: 2, children: [
    { id: 'users', menu_name: '用户管理', route_path: '/system/users', icon: 'users', sort_no: 1, buttons: [
      { id: 'user-create', button_name: '新增用户', permission: 'user:create' },
      { id: 'user-update', button_name: '编辑用户', permission: 'user:update' },
      { id: 'user-delete', button_name: '删除用户', permission: 'user:delete' },
      { id: 'user-reset-password', button_name: '重置密码', permission: 'user:reset-password' },
    ] },
    { id: 'roles', menu_name: '角色管理', route_path: '/system/roles', icon: 'shield-check', sort_no: 2, buttons: [
      { id: 'role-create', button_name: '新增角色', permission: 'role:create' },
      { id: 'role-update', button_name: '编辑角色', permission: 'role:update' },
      { id: 'role-delete', button_name: '删除角色', permission: 'role:delete' },
      { id: 'role-permissions', button_name: '配置权限', permission: 'role:permissions' },
    ] },
    { id: 'menus', menu_name: '菜单管理', route_path: '/system/menus', icon: 'list-tree', sort_no: 3,
      buttons: [{ id: 'menu-update', button_name: '重命名', permission: 'menu:update' }] },
    { id: 'assistant', menu_name: 'AI 助手', route_path: '/system/assistant', icon: 'wand-sparkles', sort_no: 5 },
    { id: 'settings', menu_name: '系统设置', route_path: '/system/settings', icon: 'settings-2', sort_no: 4, buttons: [
      { id: 'settings-update', button_name: '保存设置', permission: 'settings:update' },
      { id: 'settings-reset', button_name: '重置演示数据', permission: 'settings:reset' },
    ] },
  ] },
  { id: 'ai-permissions', menu_name: 'AI 助手权限', route_path: '', icon: 'wand-sparkles', sort_no: 4, buttons: [
    { id: 'agent-use', button_name: '使用助手与 Agent', permission: 'agent:use' },
    { id: 'agent-config-view', button_name: '查看助手配置', permission: 'agent-config:view' },
    { id: 'agent-config-update', button_name: '修改助手配置', permission: 'agent-config:update' },
  ] },
  { id: 'examples', menu_name: '示例', route_path: '', icon: 'component', sort_no: 3, children: [
    { id: 'components', menu_name: '组件示例', route_path: '/examples/components', icon: 'component', sort_no: 1 },
  ] },
];

const audit = { create_by: 'system', create_date: '2026-01-01T08:00:00+08:00', last_update_by: 'system', last_update_date: '2026-01-01T08:00:00+08:00' };

const toMenu = (config: MenuConfig, parent_id?: string): Menu => ({
  ...audit, ...config, parent_id, menu_code: config.id, status: 1, visible: 1,
  buttons: (config.buttons || []).map((button, index) => ({
    ...audit, id: button.id, menu_id: config.id, button_name: button.button_name,
    button_code: button.id, permission_code: button.permission, sort_no: index + 1, status: 1,
  })),
  children: config.children?.map((child) => toMenu(child, config.id)),
});

export const DEFAULT_MENUS = menuConfig.map((menu) => toMenu(menu));
