import { isMessageKey, t } from '@/i18n';
import { ApiRequestError } from '@/api/errors';
import { getStoredTokens } from '@/api/tokenStorage';
import { DEFAULT_MENUS } from '@/config/menus';
import type { AuthMeResponse, Menu, User } from '@/types';
import { getMockDb } from './db';
import type { MockUser } from './seed';

export const publicUser = ({ password: _password, preferences: _preferences, ...user }: MockUser): User => (
  structuredClone(user)
);

export function mockMenus(): Menu[] {
  const { menuNames, buttonNames } = getMockDb();
  const defaultName = (kind: 'menu' | 'button', id: string) => {
    // 权限 ID 保持不变，字典键将连字符后的字母转为大写。
    const messageId = id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const key = `${kind}.${messageId}` as const;
    return isMessageKey(key) ? t(key) : id;
  };
  const adapt = (menu: Menu): Menu => ({
    ...menu,
    menu_name: menuNames[menu.id] || defaultName('menu', menu.id),
    buttons: menu.buttons?.map((button) => ({
      ...button,
      button_name: buttonNames[button.id] || defaultName('button', button.id),
    })),
    children: menu.children?.map(adapt),
  });

  return DEFAULT_MENUS.map(adapt);
}

export function currentUser(): MockUser {
  try {
    const token = getStoredTokens()?.accessToken;
    if (!token?.startsWith('mock.')) {
      throw new Error();
    }
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string };
    const user = getMockDb().users.find((item) => item.id === payload.sub && item.status === 1);
    if (user) {
      return user;
    }
  } catch {
    // 损坏或已失效的本地会话。
  }
  throw new ApiRequestError(t('serverErrors.auth.sessionExpired'), 401, 1002);
}

export function meResponse(): AuthMeResponse {
  const user = currentUser();
  const roles = getMockDb().roles.filter((role) => user.role_ids.includes(role.id) && role.status === 1);
  const menuIds = new Set(roles.flatMap((role) => role.menuIds));
  const buttonIds = new Set(roles.flatMap((role) => role.buttonIds));
  const filter = (nodes: Menu[]): Menu[] => nodes.flatMap((menu) => {
    if (!menuIds.has(menu.id) || menu.status === 0 || menu.visible === 0) {
      return [];
    }
    const children = filter(menu.children || []);
    if (!menu.route_path && !children.length) {
      return [];
    }
    return [
      {
        ...menu,
        children,
        buttons: (menu.buttons || []).filter((button) => button.status === 1 && buttonIds.has(button.id)),
      },
    ];
  });
  const menus = filter(mockMenus());
  const permissions = new Set<string>();
  const collect = (nodes: Menu[]) => nodes.forEach((menu) => {
    menu.buttons?.forEach((button) => permissions.add(button.permission_code));
    collect(menu.children || []);
  });
  const grantedPermissionMenus = (nodes: Menu[]): Menu[] => nodes.flatMap((menu) => (
    menuIds.has(menu.id) && menu.status !== 0
      ? [
        {
          ...menu,
          buttons: menu.buttons?.filter((button) => button.status !== 0 && buttonIds.has(button.id)),
          children: grantedPermissionMenus(menu.children || []),
        },
      ]
      : []
  ));

  collect(grantedPermissionMenus(mockMenus()));
  return {
    user: publicUser(user),
    roles: roles.map((role) => role.role_code),
    roleNames: roles.map((role) => role.role_name),
    permissions: [...permissions],
    menus,
    preferences: { ...user.preferences },
  };
}

export function requirePermission(permission: string): MockUser {
  const user = currentUser();
  if (!meResponse().permissions.includes(permission)) {
    throw new ApiRequestError(t('serverErrors.access.forbiddenAction'), 403);
  }
  return user;
}

export function requireMenu(path: string): MockUser {
  const user = currentUser();
  const includes = (nodes: Menu[]): boolean => nodes.some((menu) => menu.route_path === path || includes(menu.children || []));
  if (!includes(meResponse().menus)) {
    throw new ApiRequestError(t('serverErrors.access.forbiddenPage'), 403);
  }
  return user;
}
