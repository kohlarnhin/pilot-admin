import { DEFAULT_MENUS } from '@/config/menus';
import type { Menu } from '@/types';
import type { MockDb, MockRole } from './seed';

export interface PermissionCatalog {
  menuIds: string[];
  buttonIds: string[];
}

/** 递归目录是种子、同步与角色计数的共同来源，不限制菜单层数。 */
export function collectMenuCatalog(menus: Menu[]) {
  const entries: { menu: Menu; ancestors: Menu[] }[] = [];
  const walk = (items: Menu[], ancestors: Menu[]) => {
    for (const menu of items) {
      entries.push({ menu, ancestors });
      walk(menu.children || [], [...ancestors, menu]);
    }
  };
  walk(menus, []);
  return {
    entries,
    menuIds: entries.map(({ menu }) => menu.id),
    buttonIds: entries.flatMap(({ menu }) => (menu.buttons || []).map((button) => button.id)),
  };
}

const declaredCatalog = collectMenuCatalog(DEFAULT_MENUS);
const sameIds = (left: string[], right: string[]) => left.length === right.length && left.every((id, index) => id === right[index]);

export function addRouteLessAncestors(menuIds: string[], catalog = declaredCatalog): string[] {
  const selected = new Set(menuIds);
  for (const { menu, ancestors } of catalog.entries) {
    if (!selected.has(menu.id)) continue;
    for (const parent of ancestors) {
      if (!parent.route_path) selected.add(parent.id);
    }
  }
  return [...selected];
}

export function getDeclaredRoleGrants(role: Pick<MockRole, 'menuIds' | 'buttonIds'>, catalog = declaredCatalog) {
  return {
    menuIds: catalog.menuIds.filter((id) => role.menuIds.includes(id)),
    buttonIds: catalog.buttonIds.filter((id) => role.buttonIds.includes(id)),
  };
}

export function getDeclaredPermissionCounts(role: Pick<MockRole, 'menuIds' | 'buttonIds'>, catalog = declaredCatalog) {
  const grants = getDeclaredRoleGrants(role, catalog);
  return {
    menu_count: grants.menuIds.length,
    button_count: grants.buttonIds.length,
  };
}

/** 纯同步：只补发未见过的声明和无路由祖先；旧授权及历史目录永不删减。 */
export function syncPermissionCatalog(db: MockDb, menus = DEFAULT_MENUS): { db: MockDb; changed: boolean } {
  const declared = collectMenuCatalog(menus);
  const newMenus = declared.menuIds.filter((id) => !db.permissionCatalog.menuIds.includes(id));
  const newButtons = declared.buttonIds.filter((id) => !db.permissionCatalog.buttonIds.includes(id));
  const menuIds = [...new Set([...db.permissionCatalog.menuIds, ...declared.menuIds])];
  const buttonIds = [...new Set([...db.permissionCatalog.buttonIds, ...declared.buttonIds])];
  let changed = !sameIds(menuIds, db.permissionCatalog.menuIds) || !sameIds(buttonIds, db.permissionCatalog.buttonIds);
  // 计数在 service 返回时按当前声明投影，避免新旧构建因计数不同反复写回。
  const roles = db.roles.map((role) => {
    const selected = new Set(role.menuIds);
    const buttons = new Set(role.buttonIds);
    if (role.auto_grant) {
      newMenus.forEach((id) => selected.add(id));
      newButtons.forEach((id) => buttons.add(id));
      // 权限专用分组自身也是按钮的无路由祖先；不会恢复被撤回的有路由页面。
      for (const { menu, ancestors } of declared.entries) {
        if (!(menu.buttons || []).some((button) => newButtons.includes(button.id))) continue;
        for (const parent of [...ancestors, menu]) {
          if (!parent.route_path) selected.add(parent.id);
        }
      }
    }
    const nextMenus = addRouteLessAncestors([...selected], declared);
    const nextButtons = [...buttons];
    if (sameIds(nextMenus, role.menuIds) && sameIds(nextButtons, role.buttonIds)) return role;
    changed = true;
    return { ...role, menuIds: nextMenus, buttonIds: nextButtons };
  });
  return changed ? { db: { ...db, roles, permissionCatalog: { menuIds, buttonIds } }, changed } : { db, changed };
}
