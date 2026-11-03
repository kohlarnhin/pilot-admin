import { notifyAccountChange } from '@/mock/notifications';
import { triggerDataChangeSideEffects } from './agentEvents';
import { recordAuditFailure } from '@/mock/auditFailure';
import { recordAudit } from '@/mock/audit';
import { t } from '@/i18n';
import { ApiRequestError } from '../errors';
import type { ApiResponse, PageResult, User } from '@/types';
import type { PageQuery } from './pagination';
import { getMockDb, updateMockDb } from '@/mock/db';
import { publicUser, requireMenu, requirePermission } from '@/mock/access';
import { createTraceId, delay, matchesKeyword, pageResult, response, validatePassword } from '@/mock/helpers';
import { createId } from '@/utils/id';

// 至少包含字母和数字；严格长度策略仍适用。
const randomPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const length = Math.max(10, getMockDb().settings.security.passwordMinLength);
  const bytes = crypto.getRandomValues(new Uint32Array(length * 2));
  const characters = Array.from(bytes.slice(0, length), (value) => alphabet[value % alphabet.length]);
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  characters[0] = letters[bytes[0] % letters.length];
  characters[1] = '23456789'[bytes[1] % 8];

  for (let index = length - 1; index > 0; index -= 1) {
    const other = bytes[length + index] % (index + 1);
    [characters[index], characters[other]] = [characters[other], characters[index]];
  }
  return characters.join('');
};

const filteredUsers = (params: PageQuery) => getMockDb().users.filter((user) => (
  matchesKeyword(params.keyword, user.login_name, user.user_name, user.email, user.id)
  && (params.status === undefined || user.status === params.status)
));

const validateRoles = (ids: string[]) => {
  if (!ids.length || ids.some((id) => !getMockDb().roles.some((role) => role.id === id && role.status === 1))) {
    throw new ApiRequestError(t('serverErrors.user.invalidRoles'), 400);
  }
};

export const userService = {
  getUsers: async (params: PageQuery = {}): Promise<ApiResponse<PageResult<User>>> => {
    await delay();
    requireMenu('/system/users');
    return response(pageResult(filteredUsers(params).map(publicUser), params));
  },

  countUsers: async (params: Omit<PageQuery, 'pageNo' | 'pageSize'> = {}): Promise<number> => {
    await delay();
    requireMenu('/system/users');
    return filteredUsers(params).length;
  },

  createUser: async (data: {
    login_name: string;
    user_name: string;
    email?: string;
    password_hash?: string;
    role_ids: string[];
  }): Promise<ApiResponse<User & { initial_password: string }>> => {
    try {
      await delay();
      const actor = requirePermission('user:create');
      if (!/^[a-zA-Z0-9_]+$/.test(data.login_name) || !data.user_name.trim()) {
        throw new ApiRequestError(t('serverErrors.user.invalidAccount'), 400);
      }
      if (getMockDb().users.some((user) => user.login_name === data.login_name)) {
        throw new ApiRequestError(t('serverErrors.user.loginNameExists'), 409);
      }

      validateRoles(data.role_ids);
      const password = data.password_hash || randomPassword();
      validatePassword(password);
      const date = new Date().toISOString();
      const user = {
        id: `u-${createId()}`,
        login_name: data.login_name,
        user_name: data.user_name.trim(),
        email: data.email,
        role_ids: data.role_ids,
        status: 1 as const,
        password,
        preferences: { agent_mode_entry: 'ask' as const },
        create_by: actor.id,
        create_date: date,
        last_update_by: actor.id,
        last_update_date: date,
      };

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.users.unshift(user);
        recordAudit(db, {
          actor,
          action: 'user.create',
          target_type: 'user',
          target_id: user.id,
          target_name: user.user_name,
          traceId,
        });
      });
      return response({ ...publicUser(user), initial_password: password }, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'user.create',
        target_type: 'user',
        target_name: data.user_name,
      }));
      throw error;
    }
  },

  updateUser: async (userId: string, data: {
    login_name?: string;
    user_name?: string;
    email?: string;
    role_ids?: string[];
    password?: string;
  }): Promise<ApiResponse<User>> => {
    try {
      await delay();
      const actor = requirePermission('user:update');
      const user = getMockDb().users.find((item) => item.id === userId);
      if (!user) {
        throw new ApiRequestError(t('serverErrors.user.notFound'), 404);
      }
      if (data.role_ids) {
        validateRoles(data.role_ids);
      }
      if (data.user_name !== undefined && !data.user_name.trim()) {
        throw new ApiRequestError(t('common.validation.nameRequired'), 400);
      }
      if (data.password) {
        requirePermission('user:reset-password');
        validatePassword(data.password);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        const target = db.users.find((item) => item.id === userId)!;
        if (data.user_name !== undefined) {
          target.user_name = data.user_name.trim();
        }
        if (data.email !== undefined) {
          target.email = data.email;
        }
        if (data.role_ids !== undefined) {
          const changed = target.role_ids.length !== new Set(data.role_ids).size || target.role_ids.some((id) => !data.role_ids!.includes(id));
          if (changed) notifyAccountChange(db, userId, actor.id, 'roles');
          target.role_ids = data.role_ids;
        }
        if (data.password) {
          target.password = data.password;
          notifyAccountChange(db, userId, actor.id, 'password');
        }
        target.last_update_by = actor.id;
        target.last_update_date = new Date().toISOString();
        recordAudit(db, {
          actor,
          action: data.password ? 'user.reset_password' : 'user.update',
          target_type: 'user',
          target_id: userId,
          target_name: target.user_name,
          traceId,
        });
      });
      triggerDataChangeSideEffects();
      return response(publicUser(getMockDb().users.find((item) => item.id === userId)!), traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: data.password ? 'user.reset_password' : 'user.update',
        target_type: 'user',
        target_id: userId,
        target_name: getMockDb().users.find((item) => item.id === userId)?.user_name,
      }));
      throw error;
    }
  },

  updateStatus: async (userId: string, status: 0 | 1): Promise<ApiResponse<void>> => {
    try {
      await delay();
      const actor = requirePermission('user:update');
      const user = getMockDb().users.find((item) => item.id === userId);
      if (!user) {
        throw new ApiRequestError(t('serverErrors.user.notFound'), 404);
      }
      if (actor.id === userId && status === 0) {
        throw new ApiRequestError(t('serverErrors.user.selfDisable'), 400);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.users.find((item) => item.id === userId)!.status = status;
        if (user.status !== status) notifyAccountChange(db, userId, actor.id, status === 1 ? 'enabled' : 'disabled');
        recordAudit(db, {
          actor,
          action: 'user.status',
          target_type: 'user',
          target_id: userId,
          target_name: user.user_name,
          params: { status },
          traceId,
        });
      });
      triggerDataChangeSideEffects();
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'user.status',
        target_type: 'user',
        target_id: userId,
        target_name: getMockDb().users.find((item) => item.id === userId)?.user_name,
        params: { status },
      }));
      throw error;
    }
  },

  resetPassword: async (userId: string, password: string): Promise<ApiResponse<void>> => {
    try {
      await delay();
      const actor = requirePermission('user:reset-password');
      validatePassword(password);
      const user = getMockDb().users.find((item) => item.id === userId);
      if (!user) {
        throw new ApiRequestError(t('serverErrors.user.notFound'), 404);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.users.find((item) => item.id === userId)!.password = password;
        notifyAccountChange(db, userId, actor.id, 'password');
        recordAudit(db, {
          actor,
          action: 'user.reset_password',
          target_type: 'user',
          target_id: userId,
          target_name: user.user_name,
          traceId,
        });
      });
      triggerDataChangeSideEffects();
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'user.reset_password',
        target_type: 'user',
        target_id: userId,
        target_name: getMockDb().users.find((item) => item.id === userId)?.user_name,
      }));
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    try {
      await delay();
      const actor = requirePermission('user:delete');
      if (userId === actor.id) {
        throw new ApiRequestError(t('serverErrors.user.selfDelete'), 400);
      }
      const user = getMockDb().users.find((item) => item.id === userId);
      if (!user) {
        throw new ApiRequestError(t('serverErrors.user.notFound'), 404);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.users = db.users.filter((item) => item.id !== userId);
        recordAudit(db, {
          actor,
          action: 'user.delete',
          target_type: 'user',
          target_id: userId,
          target_name: user.user_name,
          traceId,
        });
      });
      return response(undefined, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'user.delete',
        target_type: 'user',
        target_id: userId,
        target_name: getMockDb().users.find((item) => item.id === userId)?.user_name,
      }));
      throw error;
    }
  },
};

export { roleService } from './roleService';
