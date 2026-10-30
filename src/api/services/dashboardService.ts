import { allowAuditParams } from '@/audit/catalog';
import type { ApiResponse, DashboardData } from '@/types';
import { getMockDb } from '@/mock/db';
import { meResponse, mockMenus, requireMenu } from '@/mock/access';
import { delay, response } from '@/mock/helpers';
import { flattenMenuTree } from './menuService';

export const dashboardService = {
  getOverview: async (): Promise<ApiResponse<DashboardData>> => {
    await delay();
    requireMenu('/dashboard');
    const db = getMockDb();
    const granted = new Set(flattenMenuTree(meResponse().menus).map((menu) => menu.route_path));

    return response({
      totalUsers: db.users.length,
      activeUsers: db.users.filter((user) => user.status === 1).length,
      totalRoles: db.roles.length,
      totalMenus: flattenMenuTree(mockMenus()).filter((menu) => menu.route_path).length,
      todos: [
        {
          id: 'todo-users',
          code: 'users' as const,
          route: '/system/users',
          icon: 'users',
        },
        {
          id: 'todo-roles',
          code: 'roles' as const,
          route: '/system/roles',
          icon: 'shield-check',
        },
        {
          id: 'todo-components',
          code: 'components' as const,
          route: '/examples/components',
          icon: 'component',
        },
        {
          id: 'todo-settings',
          code: 'settings' as const,
          route: '/system/settings',
          icon: 'settings-2',
        },
      ].filter((todo) => granted.has(todo.route)),
      activities: db.auditLogs.filter((entry) => entry.result === 'success' && entry.action !== 'auth.login' && entry.action !== 'auth.logout').slice(0, 5).map((entry) => ({
        id: entry.id,
        actor_name: entry.actor_name,
        action: entry.action,
        target_name: entry.target_name,
        display_params: allowAuditParams(entry.action, entry.params),
        create_date: entry.create_date,
      })),
    });
  },
};
