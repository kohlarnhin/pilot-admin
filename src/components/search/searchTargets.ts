import type { Menu } from '@/types';
import { canAccessPage } from '@/routes/access';
import { adminPages, resolvePage } from '@/routes/routeModules';
import { t } from '@/i18n';
import { isParameterizedPage } from '@/routes/pageResolver';

export interface SearchPage { title: string; route: string }

export function searchTargets(menus: Menu[], permissions: string[]): SearchPage[] {
  const walk = (items: Menu[]): SearchPage[] => items.flatMap((menu) => {
    if (menu.visible === 0 || menu.status === 0) return [];
    if (menu.children?.length) return walk(menu.children);
    const page = resolvePage(menu.route_path)?.page;
    return page && !isParameterizedPage(page) && canAccessPage(menu.route_path, { menus, permissions }) ? [{ title: menu.menu_name, route: menu.route_path }] : [];
  });
  const pages = walk(menus);
  for (const page of adminPages) {
    if (!isParameterizedPage(page) && page.searchable && page.titleKey && canAccessPage(page.path, { menus, permissions }) && !pages.some((item) => item.route === page.path)) {
      pages.push({ title: t(page.titleKey), route: page.path });
    }
  }
  return pages;
}
