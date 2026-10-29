import type { Menu } from '@/types';
import { canAccessPage } from '@/routes/access';

export interface SearchPage { title: string; route: string }

export function searchTargets(menus: Menu[], permissions: string[]): SearchPage[] {
  const walk = (items: Menu[]): SearchPage[] => items.flatMap((menu) => {
    if (menu.visible === 0 || menu.status === 0) return [];
    if (menu.children?.length) return walk(menu.children);
    return canAccessPage(menu.route_path, { menus, permissions }) ? [{ title: menu.menu_name, route: menu.route_path }] : [];
  });
  return walk(menus);
}
