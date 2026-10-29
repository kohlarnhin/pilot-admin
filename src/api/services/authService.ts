import { t } from '@/i18n';
import { ApiRequestError } from '../http';
import type { AuthMeResponse, AuthTokens, UserPreferences } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { currentUser, meResponse } from '@/mock/access';
import { delay, validatePassword } from '@/mock/helpers';

export { DEFAULT_USER_PREFERENCES } from '@/mock/seed';

export const authService = {
  login: async (loginName: string, password: string): Promise<AuthTokens> => {
    await delay();
    const user = getMockDb().users.find((item) => item.login_name === loginName);
    if (!user || user.password !== password) {
      throw new ApiRequestError(t('serverErrors.auth.invalidCredentials'), 400);
    }
    if (user.status !== 1) {
      throw new ApiRequestError(t('serverErrors.auth.accountDisabled'), 403);
    }

    // 仅供前端演示；与正式 Token 使用相同的存储、会话恢复接口。
    const payload = btoa(JSON.stringify({
      sub: user.id,
      sid: crypto.randomUUID(),
    }));
    return {
      accessToken: `mock.${payload}.local`,
      refreshToken: `mock-refresh-${crypto.randomUUID()}`,
    };
  },

  getMe: async (): Promise<AuthMeResponse> => {
    await delay();
    return structuredClone(meResponse());
  },

  changePassword: async (data: Record<string, string>): Promise<void> => {
    await delay();
    const user = currentUser();
    if (user.password !== data.oldPassword) {
      throw new ApiRequestError(t('serverErrors.password.currentMismatch'), 400);
    }
    if (data.newPassword !== data.confirmPassword) {
      throw new ApiRequestError(t('serverErrors.password.confirmMismatch'), 400);
    }

    validatePassword(data.newPassword);
    updateMockDb((db) => {
      db.users.find((item) => item.id === user.id)!.password = data.newPassword;
    });
  },

  patchPreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    await delay();
    const user = currentUser();
    const next = { ...user.preferences, ...preferences };

    updateMockDb((db) => {
      db.users.find((item) => item.id === user.id)!.preferences = next;
    });
    return next;
  },
};
