import type { Menu } from '@/types';
import { resolvePage } from './routeModules';

export interface PageAccessContext {
  menus: Menu[];
  permissions: string[];
}

const visibleMenus = (menus: Menu[]): Menu[] => menus
  .filter((menu) => menu.visible !== 0 && menu.status !== 0)
  .flatMap((menu) => [menu, ...visibleMenus(menu.children || [])]);

/** 菜单来自服务端，页面与额外权限来自客户端注册表。 */
export function canAccessPage(path: string, { menus, permissions }: PageAccessContext): boolean {
  const page = resolvePage(path)?.page;
  if (!page || page.access === 'public' || !page.requires.every((code) => permissions.includes(code))) return false;
  if (page.accessPath) return canAccessPage(page.accessPath, { menus, permissions });
  if (page.access === 'authenticated') return true;
  return visibleMenus(menus).some((menu) => resolvePage(menu.route_path)?.page === page);
}

/** 助手卡片和自动打开共用；只允许本站 Router 路径，查询和 hash 不参与授权。 */
export function canNavigateToPage(route: unknown, context: PageAccessContext): route is string {
  return typeof route === 'string' && route.startsWith('/') && !route.startsWith('//')
    && !route.includes('\\') && !Array.from(route).some((character) => character.charCodeAt(0) < 32)
    && canAccessPage(route.split(/[?#]/, 1)[0], context);
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
