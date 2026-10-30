import { recordAuditFailure } from '@/mock/auditFailure';
import { recordAudit } from '@/mock/audit';
import { t } from '@/i18n';
import { ApiRequestError } from '../errors';
import type { AuditProfileField, AuthMeResponse, AuthTokens, User, UserPreferences } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { currentUser, meResponse } from '@/mock/access';
import { createTraceId, delay, validatePassword } from '@/mock/helpers';
import { createId } from '@/utils/id';

export { DEFAULT_USER_PREFERENCES } from '@/mock/seed';

export const PASSWORD_CURRENT_MISMATCH = 40001;
export const PASSWORD_CONFIRM_MISMATCH = 40002;

export const authService = {
  login: async (loginName: string, password: string): Promise<AuthTokens> => {
    await delay();
    const user = getMockDb().users.find((item) => item.login_name === loginName);
    if (!user || user.password !== password) {
      try {
        updateMockDb((db) => recordAudit(db, {
          actor: {
            id: user?.id,
            user_name: user?.user_name || loginName.trim().slice(0, 64),
          },
          action: 'auth.login_failed',
          result: 'failure',
          reason: 'invalid_credentials',
          traceId: createTraceId(),
        }));
      } catch { /* 审计不可用不能改变登录错误。 */ }
      throw new ApiRequestError(t('serverErrors.auth.invalidCredentials'), 400);
    }
    if (user.status !== 1) {
      try {
        updateMockDb((db) => recordAudit(db, { actor: user, action: 'auth.login_failed', result: 'failure', reason: 'account_disabled', traceId: createTraceId() }));
      } catch { /* 审计不可用不能改变登录错误。 */ }
      throw new ApiRequestError(t('serverErrors.auth.accountDisabled'), 403);
    }

    // 仅供前端演示；与正式 Token 使用相同的存储、会话恢复接口。
    const payload = btoa(JSON.stringify({
      sub: user.id,
      sid: createId(),
    }));
    updateMockDb((db) => recordAudit(db, { actor: user, action: 'auth.login', traceId: createTraceId() }));
    return {
      accessToken: `mock.${payload}.local`,
      refreshToken: `mock-refresh-${createId()}`,
    };
  },

  logout: (actor?: Pick<User, 'id' | 'user_name'>): void => {
    try {
      const user = actor || currentUser();
      updateMockDb((db) => recordAudit(db, { actor: user, action: 'auth.logout', traceId: createTraceId() }));
    } catch { /* 记录失败或账号已删除均不能阻止本地退出。 */ }
  },

  getMe: async (): Promise<AuthMeResponse> => {
    await delay();
    return structuredClone(meResponse());
  },

  changePassword: async (data: Record<string, string>): Promise<void> => {
    try {
      await delay();
      const user = currentUser();
      if (user.password !== data.oldPassword) {
        throw new ApiRequestError(t('serverErrors.password.currentMismatch'), 400, PASSWORD_CURRENT_MISMATCH);
      }
      if (data.newPassword !== data.confirmPassword) {
        throw new ApiRequestError(t('serverErrors.password.confirmMismatch'), 400, PASSWORD_CONFIRM_MISMATCH);
      }

      validatePassword(data.newPassword);
      updateMockDb((db) => {
        db.users.find((item) => item.id === user.id)!.password = data.newPassword;
        recordAudit(db, {
          actor: user,
          action: 'auth.password_change',
          target_type: 'user',
          target_id: user.id,
          target_name: user.user_name,
          traceId: createTraceId(),
        });
      });
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'auth.password_change',
        target_type: 'user',
      }));
      throw error;
    }
  },

  patchPreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    const fields: AuditProfileField[] = 'agent_mode_entry' in preferences ? ['agent_mode_entry'] : [];
    try {
      await delay();
      const user = currentUser();
      const next = { ...user.preferences, ...preferences };

      updateMockDb((db) => {
        db.users.find((item) => item.id === user.id)!.preferences = next;
        recordAudit(db, {
          actor: user,
          action: 'profile.update',
          target_type: 'user',
          target_id: user.id,
          target_name: user.user_name,
          params: { fields },
          traceId: createTraceId(),
        });
      });
      return next;
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'profile.update',
        target_type: 'user',
        params: { fields },
      }));
      throw error;
    }
  },
};
