import { t } from '@/i18n';
import { ApiRequestError } from '@/api/errors';
import { getStoredTokens } from '@/api/tokenStorage';
import type { ApiResponse, AuditProfileField, User } from '@/types';
import { currentUser, meResponse, mockMenus, publicUser } from '@/mock/access';
import { getMockDb, updateMockDb } from '@/mock/db';
import { recordAudit } from '@/mock/audit';
import { recordAuditFailure } from '@/mock/auditFailure';
import { createTraceId, delay, response } from '@/mock/helpers';

export const PROFILE_NAME_INVALID = 40010;
export const PROFILE_EMAIL_INVALID = 40011;
export interface ProfileInput {
  user_name: string;
  email?: string;
}
export interface ProfilePermissionGroup {
  id: string;
  name: string;
  actions: { code: string; name: string }[];
}

export const profileService = {
  async getPermissions(): Promise<ApiResponse<ProfilePermissionGroup[]>> {
    await delay();
    const permissions = new Set(meResponse().permissions);
    const groups: ProfilePermissionGroup[] = [];
    const walk = (menus: ReturnType<typeof mockMenus>) => {
      for (const menu of menus) {
        const actions = (menu.buttons || []).filter((button) => button.status === 1 && permissions.has(button.permission_code))
          .sort((a, b) => a.sort_no - b.sort_no)
          .map((button) => ({
            code: button.permission_code,
            name: button.button_name,
          }));
        if (actions.length) groups.push({
          id: menu.id,
          name: menu.menu_name,
          actions,
        });
        walk(menu.children || []);
      }
    };
    walk(mockMenus());
    return response(groups);
  },

  async updateProfile(input: ProfileInput): Promise<ApiResponse<User>> {
    const accessToken = getStoredTokens()?.accessToken;
    let userId: string | undefined;
    const fields: AuditProfileField[] = [];
    try {
      await delay();
      const actor = currentUser();
      if (getStoredTokens()?.accessToken !== accessToken) {
        throw new ApiRequestError(t('auth.sessionChanged'), 401, 1002);
      }
      userId = actor.id;
      if (!input || typeof input.user_name !== 'string' || !input.user_name.trim() || input.user_name.trim().length > 40) {
        throw new ApiRequestError(t('serverErrors.profile.invalidName'), 400, PROFILE_NAME_INVALID);
      }
      if (input.email !== undefined && (typeof input.email !== 'string' || (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())))) {
        throw new ApiRequestError(t('common.validation.emailInvalid'), 400, PROFILE_EMAIL_INVALID);
      }
      const name = input.user_name.trim();
      const email = input.email === undefined ? actor.email || '' : input.email.trim();
      if (name !== actor.user_name) fields.push('user_name');
      if (email !== (actor.email || '')) fields.push('email');
      const traceId = createTraceId();
      if (!fields.length) return response(publicUser(actor), traceId);

      updateMockDb((db) => {
        const user = db.users.find((item) => item.id === actor.id)!;
        user.user_name = name;
        user.email = email;
        user.last_update_by = actor.id;
        user.last_update_date = new Date().toISOString();
        recordAudit(db, {
          actor,
          action: 'profile.update',
          target_type: 'user',
          target_id: actor.id,
          target_name: name,
          params: {
            fields,
          },
          traceId,
        });
      });
      return response(publicUser(getMockDb().users.find((user) => user.id === actor.id)!), traceId);
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'profile.update',
        target_type: 'user',
        target_id: userId,
        params: {
          fields,
        },
      }));
      throw error;
    }
  },
};
