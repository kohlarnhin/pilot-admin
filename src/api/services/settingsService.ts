import { recordAuditFailure } from '@/mock/auditFailure';
import { recordAudit } from '@/mock/audit';
import { t } from '@/i18n';
import type { ApiResponse, SystemSettings } from '@/types';
import { getMockDb, resetMockDb, updateMockDb } from '@/mock/db';
import { requireMenu, requirePermission } from '@/mock/access';
import { createTraceId, delay, response } from '@/mock/helpers';
import { ApiRequestError } from '../errors';

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
    try {
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

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.settings[section] = value;
        recordAudit(db, {
          actor,
          action: 'settings.update',
          target_type: 'settings',
          params: { section },
          traceId,
        });
      });
      return response(getMockDb().settings, traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'settings.update',
        target_type: 'settings',
        params: { section },
      }));
      throw error;
    }
  },

  resetDemoData: async (): Promise<void> => {
    try {
      await delay();
      const actor = requirePermission('settings:reset');
      const traceId = createTraceId();
      resetMockDb((db) => recordAudit(db, { actor, action: 'settings.reset_demo', target_type: 'settings', traceId }));
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'settings.reset_demo',
        target_type: 'settings',
      }));
      throw error;
    }
  },
};
