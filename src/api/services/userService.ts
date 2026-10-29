import { ApiRequestError } from '../http';
import type { ApiResponse, PageResult, User } from '@/types';
import type { PageQuery } from './pagination';
import { getMockDb, updateMockDb } from '@/mock/db';
import { publicUser, requireMenu, requirePermission } from '@/mock/access';
import { addActivity, delay, matchesKeyword, pageResult, response, validatePassword } from '@/mock/helpers';

const filteredUsers = (params: PageQuery) => getMockDb().users.filter((user) =>
  matchesKeyword(params.keyword, user.login_name, user.user_name, user.email, user.id) && (params.status === undefined || user.status === params.status));
const validateRoles = (ids: string[]) => {
  if (!ids.length || ids.some((id) => !getMockDb().roles.some((role) => role.id === id && role.status === 1))) throw new ApiRequestError('请选择有效角色', 400);
};

export const userService = {
  getUsers: async (params: PageQuery = {}): Promise<ApiResponse<PageResult<User>>> => {
    await delay(); requireMenu('/system/users');
    return response(pageResult(filteredUsers(params).map(publicUser), params));
  },
  countUsers: async (params: Omit<PageQuery, 'pageNo' | 'pageSize'> = {}): Promise<number> => {
    await delay(); requireMenu('/system/users');
    return filteredUsers(params).length;
  },
  createUser: async (data: { login_name: string; user_name: string; email?: string; password_hash?: string; role_ids: string[] }): Promise<ApiResponse<User>> => {
    await delay(); const actor = requirePermission('user:create');
    if (!/^[a-zA-Z0-9_]+$/.test(data.login_name) || !data.user_name.trim()) throw new ApiRequestError('请填写有效的账号与姓名', 400);
    if (getMockDb().users.some((user) => user.login_name === data.login_name)) throw new ApiRequestError('该登录账号已存在', 409);
    validateRoles(data.role_ids);
    const password = data.password_hash || 'pilot123'; validatePassword(password);
    const date = new Date().toISOString();
    const user = { id: `u-${crypto.randomUUID()}`, login_name: data.login_name, user_name: data.user_name.trim(), email: data.email,
      role_ids: data.role_ids, status: 1 as const, password, preferences: { agent_mode_entry: 'ask' as const, agent_entries_prompt: 'ask' as const },
      create_by: actor.id, create_date: date, last_update_by: actor.id, last_update_date: date };
    updateMockDb((db) => { db.users.unshift(user); });
    addActivity(actor.user_name, `新增了用户 ${user.user_name}`, 'user-plus');
    return response(publicUser(user));
  },
  updateUser: async (userId: string, data: { login_name?: string; user_name?: string; email?: string; role_ids?: string[]; password?: string }): Promise<ApiResponse<User>> => {
    await delay(); const actor = requirePermission('user:update');
    const user = getMockDb().users.find((item) => item.id === userId);
    if (!user) throw new ApiRequestError('用户不存在', 404);
    if (data.role_ids) validateRoles(data.role_ids);
    if (data.user_name !== undefined && !data.user_name.trim()) throw new ApiRequestError('请输入姓名', 400);
    if (data.password) { requirePermission('user:reset-password'); validatePassword(data.password); }
    updateMockDb((db) => {
      const target = db.users.find((item) => item.id === userId)!;
      if (data.user_name !== undefined) target.user_name = data.user_name.trim();
      if (data.email !== undefined) target.email = data.email;
      if (data.role_ids !== undefined) target.role_ids = data.role_ids;
      if (data.password) target.password = data.password;
      target.last_update_by = actor.id; target.last_update_date = new Date().toISOString();
    });
    return response(publicUser(getMockDb().users.find((item) => item.id === userId)!));
  },
  updateStatus: async (userId: string, status: 0 | 1): Promise<ApiResponse<void>> => {
    await delay(); const actor = requirePermission('user:update');
    const user = getMockDb().users.find((item) => item.id === userId);
    if (!user) throw new ApiRequestError('用户不存在', 404);
    if (actor.id === userId && status === 0) throw new ApiRequestError('不可禁用当前登录账号', 400);
    updateMockDb((db) => { db.users.find((item) => item.id === userId)!.status = status; });
    return response(undefined);
  },
  resetPassword: async (userId: string, password: string): Promise<ApiResponse<void>> => {
    await delay(); requirePermission('user:reset-password'); validatePassword(password);
    if (!getMockDb().users.some((user) => user.id === userId)) throw new ApiRequestError('用户不存在', 404);
    updateMockDb((db) => { db.users.find((item) => item.id === userId)!.password = password; });
    return response(undefined);
  },
  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    await delay(); const actor = requirePermission('user:delete');
    if (userId === actor.id) throw new ApiRequestError('不可删除当前登录账号', 400);
    const user = getMockDb().users.find((item) => item.id === userId);
    if (!user) throw new ApiRequestError('用户不存在', 404);
    updateMockDb((db) => { db.users = db.users.filter((item) => item.id !== userId); });
    addActivity(actor.user_name, `删除了用户 ${user.user_name}`, 'trash-2');
    return response(undefined);
  },
};

export { roleService } from './roleService';
