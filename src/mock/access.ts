import { ApiRequestError } from '@/api/http';
import { getStoredTokens } from '@/api/tokenStorage';
import { DEFAULT_MENUS } from '@/config/menus';
import type { AuthMeResponse, Menu, User } from '@/types';
import { getMockDb } from './db';
import type { MockUser } from './seed';

export const publicUser = ({ password: _password, preferences: _preferences, ...user }: MockUser): User => structuredClone(user);

export function mockMenus(): Menu[] {
  const { menuNames, buttonNames } = getMockDb();
  const adapt = (menu: Menu): Menu => ({
    ...menu, menu_name: menuNames[menu.id] || menu.menu_name,
    buttons: menu.buttons?.map((button) => ({ ...button, button_name: buttonNames[button.id] || button.button_name })),
    children: menu.children?.map(adapt),
  });
  return DEFAULT_MENUS.map(adapt);
}

export function currentUser(): MockUser {
  try {
    const token = getStoredTokens()?.accessToken;
    if (!token?.startsWith('mock.')) throw new Error();
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string };
    const user = getMockDb().users.find((item) => item.id === payload.sub && item.status === 1);
    if (user) return user;
  } catch { /* 损坏或已失效的本地会话。 */ }
  throw new ApiRequestError('登录状态已失效，请重新登录', 401, 1002);
}

export function meResponse(): AuthMeResponse {
  const user = currentUser();
  const roles = getMockDb().roles.filter((role) => user.role_ids.includes(role.id) && role.status === 1);
  const menuIds = new Set(roles.flatMap((role) => role.menuIds));
  const buttonIds = new Set(roles.flatMap((role) => role.buttonIds));
  const filter = (nodes: Menu[]): Menu[] => nodes.flatMap((menu) => {
    if (!menuIds.has(menu.id) || menu.status === 0 || menu.visible === 0) return [];
    const children = filter(menu.children || []);
    if (!menu.route_path && !children.length) return [];
    return [{ ...menu, children, buttons: (menu.buttons || []).filter((button) => button.status === 1 && buttonIds.has(button.id)) }];
  });
  const menus = filter(mockMenus());
  const permissions = new Set<string>();
  const collect = (nodes: Menu[]) => nodes.forEach((menu) => {
    menu.buttons?.forEach((button) => permissions.add(button.permission_code));
    collect(menu.children || []);
  });
  collect(menus);
  return { user: publicUser(user), roles: roles.map((role) => role.role_code), roleNames: roles.map((role) => role.role_name), permissions: [...permissions], menus, preferences: { ...user.preferences } };
}

export function requirePermission(permission: string): MockUser {
  const user = currentUser();
  if (!meResponse().permissions.includes(permission)) throw new ApiRequestError('没有执行此操作的权限', 403);
  return user;
}

export function requireMenu(path: string): MockUser {
  const user = currentUser();
  const includes = (nodes: Menu[]): boolean => nodes.some((menu) => menu.route_path === path || includes(menu.children || []));
  if (!includes(meResponse().menus)) throw new ApiRequestError('没有访问此页面的权限', 403);
  return user;
}
