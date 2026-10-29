import { appConfig } from '@/config/app';
import { DEFAULT_MENUS } from '@/config/menus';
import type { Activity, Role, SystemSettings, User, UserPreferences } from '@/types';

export interface MockUser extends User { password: string; preferences: UserPreferences }
export interface MockRole extends Role { menuIds: string[]; buttonIds: string[] }
export interface MockDb {
  version: 1;
  users: MockUser[];
  roles: MockRole[];
  menuNames: Record<string, string>;
  buttonNames: Record<string, string>;
  settings: SystemSettings;
  activities: Activity[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = { agent_mode_entry: 'ask', agent_entries_prompt: 'ask' };
export const SEED_USER_COUNT = 150;
const audit = { create_by: 'system', create_date: '2026-01-01T08:00:00+08:00', last_update_by: 'system', last_update_date: '2026-01-01T08:00:00+08:00' };
const flatMenus = DEFAULT_MENUS.flatMap((menu) => [menu, ...(menu.children || [])]);
const allButtons = flatMenus.flatMap((menu) => menu.buttons || []);

export function createSeed(): MockDb {
  const role = (id: string, role_name: string, role_code: string, description: string, menuIds: string[], buttonIds: string[]): MockRole => ({
    ...audit, id, role_name, role_code, description, status: 1, menuIds, buttonIds, menu_count: menuIds.length, button_count: buttonIds.length,
  });
  const roles = [
    role('role-admin', '超级管理员', 'ROLE_ADMIN', '管理所有菜单、账号与系统配置', flatMenus.map((menu) => menu.id), allButtons.map((button) => button.id)),
    role('role-operator', '运营人员', 'ROLE_OPERATOR', '查看概览，维护用户信息与状态', ['dashboard', 'system', 'users', 'examples', 'components'], ['user-update', 'agent-use']),
    role('role-viewer', '访客', 'ROLE_VIEWER', '只读浏览概览与组件示例', ['dashboard', 'examples', 'components'], []),
  ];
  const accounts = [
    { login_name: 'admin', user_name: '林知行', password: 'admin123', role_ids: ['role-admin'] },
    { login_name: 'operator', user_name: '陈思远', password: 'operator123', role_ids: ['role-operator'] },
    { login_name: 'viewer', user_name: '许清和', password: 'viewer123', role_ids: ['role-viewer'] },
  ];
  const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '胡', '朱', '林', '何', '高', '郭', '马', '罗', '梁'];
  const givenNames = ['雨桐', '子涵', '思源', '明轩', '若宁', '嘉禾', '星辰', '书瑶', '沐阳', '景行', '安然', '知夏', '亦凡', '清越', '文博', '语棠', '致远', '欣怡', '一诺'];
  const users: MockUser[] = Array.from({ length: SEED_USER_COUNT }, (_, index) => {
    const account = accounts[index];
    const date = new Date(Date.UTC(2026, 0, 2 + index, 1 + index % 8, index % 60)).toISOString();
    return {
      ...audit, id: `u-${String(index + 1).padStart(4, '0')}`,
      login_name: account?.login_name || `user_${String(index + 1).padStart(3, '0')}`,
      user_name: account?.user_name || `${surnames[index % surnames.length]}${givenNames[index % givenNames.length]}`,
      email: `${account?.login_name || `user${String(index + 1).padStart(3, '0')}`}@example.com`,
      password: account?.password || 'pilot123', role_ids: account?.role_ids || [index % 3 === 0 ? 'role-operator' : 'role-viewer'],
      status: index > 2 && index % 11 === 0 ? 0 : 1, create_date: date, last_update_date: date,
      preferences: { ...DEFAULT_USER_PREFERENCES },
    };
  });
  return {
    version: 1, users, roles, menuNames: {}, buttonNames: {},
    settings: {
      basic: { siteName: appConfig.name, description: appConfig.description },
      security: { passwordMinLength: 6, requireNumber: true, requireLetter: true },
      notifications: { systemNotice: true, accountChange: true, weeklySummary: false },
    },
    activities: [
      { id: 'activity-1', actor: '林知行', action: '更新了系统基本设置', time: '2026-10-29T09:40:00+08:00', icon: 'settings-2' },
      { id: 'activity-2', actor: '陈思远', action: '完善了用户资料', time: '2026-10-29T09:25:00+08:00', icon: 'user' },
      { id: 'activity-3', actor: '林知行', action: '调整了运营人员的菜单权限', time: '2026-10-28T16:10:00+08:00', icon: 'shield-check' },
      { id: 'activity-4', actor: '林知行', action: '创建了访客角色', time: '2026-10-28T14:30:00+08:00', icon: 'plus' },
      { id: 'activity-5', actor: '系统', action: '演示数据已准备就绪', time: '2026-10-28T09:00:00+08:00', icon: 'circle-check' },
    ],
  };
}
