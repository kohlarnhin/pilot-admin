import { t } from '@/i18n';
import type { ApiResponse, SystemSettings } from '@/types';
import { getMockDb, resetMockDb, updateMockDb } from '@/mock/db';
import { requireMenu, requirePermission } from '@/mock/access';
import { addActivity, delay, response } from '@/mock/helpers';
import { ApiRequestError } from '../http';

export { MOCK_DB_RESET_EVENT as DEMO_DATA_RESET_EVENT } from '@/mock/db';

export const settingsService = {
  // 公开的品牌信息供登录页和应用外壳使用。
  getBrand: async (): Promise<SystemSettings['basic']> => {
    await delay();
    return { ...getMockDb().settings.basic };
  },

  getPasswordPolicy: async (): Promise<SystemSettings['security']> => {
    await delay();
    requirePermission('agent:use');
    return { ...getMockDb().settings.security };
  },

  getSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    await delay();
    requireMenu('/system/settings');
    return response(getMockDb().settings);
  },

  updateSettings: async <K extends keyof SystemSettings>(
    section: K,
    value: SystemSettings[K],
  ): Promise<ApiResponse<SystemSettings>> => {
    await delay();
    const actor = requirePermission('settings:update');
    if (section === 'basic' && !(value as SystemSettings['basic']).siteName.trim()) {
      throw new ApiRequestError(t('serverErrors.settings.nameRequired'), 400);
    }
    if (section === 'security') {
      const minimum = (value as SystemSettings['security']).passwordMinLength;
      if (!Number.isInteger(minimum) || minimum < 6 || minimum > 32) {
        throw new ApiRequestError(t('serverErrors.password.invalidMinLength'), 400);
      }
    }

    updateMockDb((db) => {
      db.settings[section] = value;
    });
    addActivity(actor.user_name, t('activity.settings.updated'), 'settings-2');
    return response(getMockDb().settings);
  },

  resetDemoData: async (): Promise<void> => {
    await delay();
    requirePermission('settings:reset');
    resetMockDb();
  },
};
