import type { Menu } from '@/types';

export interface SearchPage { title: string; route: string }

export function searchTargets(menus: Menu[]): SearchPage[] {
  return menus.flatMap((menu) => {
    if (menu.visible === 0 || menu.status === 0) return [];
    if (menu.children?.length) return searchTargets(menu.children);
    return menu.route_path ? [{ title: menu.menu_name, route: menu.route_path }] : [];
  });
}
