import type { Menu } from '@/types';
import { adminPages } from './routeModules';

interface PageAccessContext {
  menus: Menu[];
  permissions: string[];
}

const visibleMenus = (menus: Menu[]): Menu[] => menus
  .filter((menu) => menu.visible !== 0 && menu.status !== 0)
  .flatMap((menu) => [menu, ...visibleMenus(menu.children || [])]);

/** 菜单来自服务端，页面与额外权限来自客户端注册表。 */
export function canAccessPage(path: string, { menus, permissions }: PageAccessContext): boolean {
  const page = adminPages.find((item) => item.path === path);
  if (!page) return false;
  if (page.access === 'authenticated') return true;
  return page.requires.every((code) => permissions.includes(code))
    && visibleMenus(menus).some((menu) => menu.route_path === path);
}

export function getFirstAccessiblePage(menus: Menu[], permissions: string[], { exclude = [] }: { exclude?: string[] } = {}): string {
  const walk = (items: Menu[]): string | undefined => {
    for (const menu of [...items].sort((a, b) => a.sort_no - b.sort_no)) {
      if (menu.visible === 0 || menu.status === 0) continue;
      const child = walk(menu.children || []);
      if (child) return child;
      if (!exclude.includes(menu.route_path) && canAccessPage(menu.route_path, { menus, permissions })) return menu.route_path;
    }
    return undefined;
  };
  return walk(menus) || '/403';
}
