import { recordAuditFailure } from '@/mock/auditFailure';
import { recordAudit } from '@/mock/audit';
import { t } from '@/i18n';
import type { ApiResponse, Menu } from '@/types';
import { mockMenus, requireMenu, requirePermission } from '@/mock/access';
import { updateMockDb } from '@/mock/db';
import { createTraceId, delay, response } from '@/mock/helpers';
import { ApiRequestError } from '../errors';

export const menuService = {
  getMenuTree: async (): Promise<ApiResponse<Menu[]>> => {
    await delay();
    requireMenu('/system/menus');
    return response(mockMenus());
  },

  updateMenu: async (menuId: string, data: { menu_name: string }): Promise<ApiResponse<void>> => {
    try {
      await delay();
      const actor = requirePermission('menu:update');
      if (!data.menu_name.trim() || !flattenMenuTree(mockMenus()).some((menu) => menu.id === menuId)) {
        throw new ApiRequestError(t('serverErrors.menu.invalidName'), 400);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.menuNames[menuId] = data.menu_name.trim();
        recordAudit(db, {
          actor,
          action: 'menu.rename',
          target_type: 'menu',
          target_id: menuId,
          target_name: data.menu_name.trim(),
          traceId,
        });
      });
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'menu.rename',
        target_type: 'menu',
        target_id: menuId,
        target_name: data.menu_name,
      }));
      throw error;
    }
  },

  updateButton: async (menuId: string, buttonId: string, data: { button_name: string }): Promise<ApiResponse<void>> => {
    try {
      await delay();
      const actor = requirePermission('menu:update');
      if (!data.button_name.trim()
        || !flattenMenuTree(mockMenus()).find((menu) => menu.id === menuId)?.buttons?.some((button) => button.id === buttonId)) {
        throw new ApiRequestError(t('serverErrors.menu.invalidActionName'), 400);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.buttonNames[buttonId] = data.button_name.trim();
        recordAudit(db, {
          actor,
          action: 'button.rename',
          target_type: 'button',
          target_id: buttonId,
          target_name: data.button_name.trim(),
          traceId,
        });
      });
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'button.rename',
        target_type: 'button',
        target_id: buttonId,
        target_name: data.button_name,
      }));
      throw error;
    }
  },
};

export const flattenMenuTree = (tree: Menu[]): Menu[] => (
  (tree || []).flatMap((menu) => [menu, ...flattenMenuTree(menu.children || [])])
);
