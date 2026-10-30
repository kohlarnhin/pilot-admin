import { recordAuditFailure } from '@/mock/auditFailure';
import { recordAudit } from '@/mock/audit';
import { t } from '@/i18n';
import { getSeedText } from '@/i18n/seed';
import { seedText as chinese } from '@/i18n/locales/zh-CN/seed';
import { seedText as english } from '@/i18n/locales/en-US/seed';
import type { AgentProfile } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { requirePermission } from '@/mock/access';
import { createTraceId, delay } from '@/mock/helpers';
import { ApiRequestError } from '../http';

export type { AgentProfile } from '@/types';

export const AGENT_CONFIG_CHANGED_EVENT = 'pilot-admin:agent:config-changed';

export const DEFAULT_AGENT_PROFILE = (): AgentProfile => structuredClone(getSeedText().agentProfile);

function readProfile(): AgentProfile {
  const db = getMockDb();
  const stored = db.agentProfile;
  // 没有自定义标记时，只有精确匹配已知种子的资料才视为默认值。
  const isDefault = [chinese.agentProfile, english.agentProfile].some((profile) => (
    stored.name === profile.name && stored.greeting === profile.greeting
    && stored.suggestions.length === profile.suggestions.length
    && stored.suggestions.every((item, index) => item.label === profile.suggestions[index].label
      && item.prompt === profile.suggestions[index].prompt)
  ));
  return db.agentProfileCustomized || !isDefault ? structuredClone(stored) : DEFAULT_AGENT_PROFILE();
}

export const agentProfileService = {
  async getProfile(): Promise<AgentProfile> {
    await delay();
    requirePermission('agent:use');
    return readProfile();
  },

  async getSettings(): Promise<AgentProfile> {
    await delay();
    requirePermission('agent-config:view');
    return readProfile();
  },

  save: async (input: Partial<AgentProfile>): Promise<void> => {
    try {
      await delay();
      const actor = requirePermission('agent-config:update');
      const next = { ...readProfile(), ...input };
      if (!next.name.trim() || !next.greeting.trim()) {
        throw new ApiRequestError(t('serverErrors.agentProfile.incomplete'), 400);
      }
      if (next.suggestions.length > 6 || next.suggestions.some((item) => !item.label.trim() || !item.prompt.trim())) {
        throw new ApiRequestError(t('serverErrors.agentProfile.invalidShortcuts'), 400);
      }

      const traceId = createTraceId();
      updateMockDb((db) => {
        db.agentProfile = structuredClone(next);
        db.agentProfileCustomized = true;
        recordAudit(db, {
          actor,
          action: 'agent_profile.update',
          target_type: 'agent_profile',
          target_name: next.name,
          traceId,
        });
      });
      window.dispatchEvent(new Event(AGENT_CONFIG_CHANGED_EVENT));
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'agent_profile.update',
        target_type: 'agent_profile',
        target_name: input.name || getMockDb().agentProfile.name,
      }));
      throw error;
    }
  },
};
