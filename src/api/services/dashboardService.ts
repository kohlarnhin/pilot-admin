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
          title: '维护用户账号',
          description: '查看账号状态，完善用户资料',
          route: '/system/users',
          icon: 'users',
        },
        {
          id: 'todo-roles',
          title: '检查角色权限',
          description: '按职责分配菜单与操作权限',
          route: '/system/roles',
          icon: 'shield-check',
        },
        {
          id: 'todo-components',
          title: '探索组件示例',
          description: '查看常用组件与交互状态',
          route: '/examples/components',
          icon: 'component',
        },
        {
          id: 'todo-settings',
          title: '完善系统设置',
          description: '设置站点信息、安全与通知',
          route: '/system/settings',
          icon: 'settings-2',
        },
      ].filter((todo) => granted.has(todo.route)),
      activities: db.activities.slice(0, 8),
    });
  },
};
