import type { ApiResponse, Menu } from '@/types';
import { mockMenus, requireMenu, requirePermission } from '@/mock/access';
import { updateMockDb } from '@/mock/db';
import { delay, response } from '@/mock/helpers';
import { ApiRequestError } from '../http';

export const menuService = {
  getMenuTree: async (): Promise<ApiResponse<Menu[]>> => {
    await delay();
    requireMenu('/system/menus');
    return response(mockMenus());
  },

  updateMenu: async (menuId: string, data: { menu_name: string }): Promise<ApiResponse<void>> => {
    await delay();
    requirePermission('menu:update');
    if (!data.menu_name.trim() || !flattenMenuTree(mockMenus()).some((menu) => menu.id === menuId)) {
      throw new ApiRequestError('菜单不存在或名称为空', 400);
    }

    updateMockDb((db) => {
      db.menuNames[menuId] = data.menu_name.trim();
    });
    return response(undefined);
  },

  updateButton: async (menuId: string, buttonId: string, data: { button_name: string }): Promise<ApiResponse<void>> => {
    await delay();
    requirePermission('menu:update');
    if (!data.button_name.trim()
      || !flattenMenuTree(mockMenus()).find((menu) => menu.id === menuId)?.buttons?.some((button) => button.id === buttonId)) {
      throw new ApiRequestError('按钮不存在或名称为空', 400);
    }

    updateMockDb((db) => {
      db.buttonNames[buttonId] = data.button_name.trim();
    });
    return response(undefined);
  },
};

export const flattenMenuTree = (tree: Menu[]): Menu[] => (
  (tree || []).flatMap((menu) => [menu, ...flattenMenuTree(menu.children || [])])
);
