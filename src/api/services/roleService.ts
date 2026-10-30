import { recordAuditFailure } from '@/mock/auditFailure';
import { recordAudit } from '@/mock/audit';
import { t } from '@/i18n';
import type { ApiResponse, Button, Menu, PageResult, Role } from '@/types';
import type { PageQuery } from './pagination';
import { flattenMenuTree } from './menuService';
import { getMockDb, updateMockDb } from '@/mock/db';
import { currentUser, mockMenus, requireMenu, requirePermission } from '@/mock/access';
import { createTraceId, delay, matchesKeyword, pageResult, response } from '@/mock/helpers';
import { ApiRequestError } from '../http';
import { cachedQuery } from '../queryCache';
import type { MockRole } from '@/mock/seed';
import { addRouteLessAncestors, collectMenuCatalog, getDeclaredPermissionCounts, getDeclaredRoleGrants } from '@/mock/permissionCatalog';
import { createId } from '@/utils/id';

export type RoleWithPermissions = Role & {
  menuIds: string[];
  buttonIds: string[];
  permissionsLoaded: boolean;
};

const publicRole = ({ auto_grant: _autoGrant, ...role }: MockRole): RoleWithPermissions => ({
  ...role,
  ...getDeclaredRoleGrants(role),
  ...getDeclaredPermissionCounts(role),
  permissionsLoaded: true,
});

const getRole = (id: string) => {
  const role = getMockDb().roles.find((item) => item.id === id);
  if (!role) {
    throw new ApiRequestError(t('serverErrors.role.notFound'), 404);
  }
  return role;
};

export const roleService = {
  getRoles: async (params: PageQuery = {}): Promise<ApiResponse<PageResult<RoleWithPermissions>>> => {
    await delay();
    requireMenu('/system/roles');
    const roles = getMockDb().roles
      .filter((role) => matchesKeyword(params.keyword, role.role_name, role.role_code))
      .map(publicRole);

    return response(pageResult(roles, params));
  },

  getAllRoles: async (): Promise<RoleWithPermissions[]> => {
    // 用户表单也需要角色选项；仅返回元数据，不暴露权限编辑能力。
    currentUser();
    return cachedQuery('roles:all', async () => {
      await delay();
      return structuredClone(getMockDb().roles.map(publicRole));
    });
  },

  countRoles: async (): Promise<number> => {
    await delay();
    requireMenu('/system/roles');
    return getMockDb().roles.length;
  },

  getRolePermissions: async (roleId: string): Promise<{ menuIds: string[]; buttonIds: string[] }> => {
    await delay();
    requireMenu('/system/roles');
    const role = getRole(roleId);
    return getDeclaredRoleGrants(role);
  },

  getMenusAndButtons: async (): Promise<ApiResponse<{ menus: Menu[]; buttons: Button[] }>> => {
    await delay();
    requireMenu('/system/roles');
    const menus = mockMenus();
    return response({
      menus,
      buttons: flattenMenuTree(menus).flatMap((menu) => menu.buttons || []),
    });
  },

  createRole: async (data: {
    role_name: string;
    role_code: string;
    description?: string;
  }): Promise<ApiResponse<Role>> => {
    try {
      await delay();
      const actor = requirePermission('role:create');
      if (!data.role_name.trim() || !/^[a-zA-Z0-9_]+$/.test(data.role_code)) {
        throw new ApiRequestError(t('serverErrors.role.invalidRole'), 400);
      }
      if (getMockDb().roles.some((role) => role.role_code === data.role_code)) {
        throw new ApiRequestError(t('serverErrors.role.codeExists'), 409);
      }

      const date = new Date().toISOString();
      const role = {
        ...data,
        id: `role-${createId()}`,
        role_name: data.role_name.trim(),
        status: 1 as const,
        menuIds: [],
        buttonIds: [],
        auto_grant: false,
        menu_count: 0,
        button_count: 0,
        create_by: actor.id,
        create_date: date,
        last_update_by: actor.id,
        last_update_date: date,
      };
      const traceId = createTraceId();
      updateMockDb((db) => {
        db.roles.push(role);
        recordAudit(db, {
          actor,
          action: 'role.create',
          target_type: 'role',
          target_id: role.id,
          target_name: role.role_name,
          traceId,
        });
      });
      return response(publicRole(role), traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'role.create',
        target_type: 'role',
        target_name: data.role_name,
      }));
      throw error;
    }
  },

  updateRole: async (roleId: string, data: {
    role_name?: string;
    role_code?: string;
    description?: string;
  }): Promise<ApiResponse<Role>> => {
    try {
      await delay();
      const actor = requirePermission('role:update');
      getRole(roleId);
      if (data.role_name !== undefined && !data.role_name.trim()) {
        throw new ApiRequestError(t('serverErrors.role.nameRequired'), 400);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        const role = db.roles.find((item) => item.id === roleId)!;
        if (data.role_name !== undefined) {
          role.role_name = data.role_name.trim();
        }
        if (data.description !== undefined) {
          role.description = data.description;
        }
        recordAudit(db, {
          actor,
          action: 'role.update',
          target_type: 'role',
          target_id: roleId,
          target_name: role.role_name,
          traceId,
        });
      });
      return response(publicRole(getRole(roleId)), traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'role.update',
        target_type: 'role',
        target_id: roleId,
        target_name: getMockDb().roles.find((item) => item.id === roleId)?.role_name,
      }));
      throw error;
    }
  },

  updateRoleStatus: async (roleId: string, status: 0 | 1): Promise<ApiResponse<void>> => {
    try {
      await delay();
      const actor = requirePermission('role:update');
      getRole(roleId);
      const traceId = createTraceId();
      updateMockDb((db) => {
        const role = db.roles.find((item) => item.id === roleId)!;
        role.status = status;
        recordAudit(db, {
          actor,
          action: 'role.status',
          target_type: 'role',
          target_id: roleId,
          target_name: role.role_name,
          params: { status },
          traceId,
        });
      });
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'role.status',
        target_type: 'role',
        target_id: roleId,
        target_name: getMockDb().roles.find((item) => item.id === roleId)?.role_name,
        params: { status },
      }));
      throw error;
    }
  },

  updateRolePermissions: async (roleId: string, menuIds: string[], buttonIds: string[]): Promise<ApiResponse<boolean>> => {
    try {
      await delay();
      const actor = requirePermission('role:permissions');
      getRole(roleId);
      const catalog = collectMenuCatalog(mockMenus());
      const menus = catalog.entries.map(({ menu }) => menu);
      const menuMap = new Map(menus.map((menu) => [menu.id, menu]));
      const selected = new Set(menuIds.filter((id) => menuMap.has(id)));
      const selectedButtons = menus.flatMap((menu) => menu.buttons || []).filter((button) => buttonIds.includes(button.id));

      selectedButtons.forEach((button) => selected.add(button.menu_id));
      const selectedMenus = addRouteLessAncestors([...selected], catalog);

      const traceId = createTraceId();
      updateMockDb((db) => {
        const role = db.roles.find((item) => item.id === roleId)!;
        role.menuIds = selectedMenus;
        role.buttonIds = selectedButtons.map((button) => button.id);
        role.menu_count = role.menuIds.length;
        role.button_count = role.buttonIds.length;
        recordAudit(db, {
          actor,
          action: 'role.permissions',
          target_type: 'role',
          target_id: roleId,
          target_name: role.role_name,
          params: getDeclaredPermissionCounts(role),
          traceId,
        });
      });
      return response(true, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'role.permissions',
        target_type: 'role',
        target_id: roleId,
        target_name: getMockDb().roles.find((item) => item.id === roleId)?.role_name,
        params: { menu_count: new Set(menuIds).size, button_count: new Set(buttonIds).size },
      }));
      throw error;
    }
  },

  deleteRole: async (roleId: string): Promise<ApiResponse<void>> => {
    try {
      await delay();
      const actor = requirePermission('role:delete');
      getRole(roleId);
      if (roleId === 'role-admin') {
        throw new ApiRequestError(t('serverErrors.role.builtInProtected'), 400);
      }
      if (getMockDb().users.some((user) => user.role_ids.includes(roleId))) {
        throw new ApiRequestError(t('serverErrors.role.inUse'), 400);
      }

      const role = getRole(roleId);
      const traceId = createTraceId();
      updateMockDb((db) => {
        db.roles = db.roles.filter((item) => item.id !== roleId);
        recordAudit(db, {
          actor,
          action: 'role.delete',
          target_type: 'role',
          target_id: roleId,
          target_name: role.role_name,
          traceId,
        });
      });
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'role.delete',
        target_type: 'role',
        target_id: roleId,
        target_name: getMockDb().roles.find((item) => item.id === roleId)?.role_name,
      }));
      throw error;
    }
  },
};
