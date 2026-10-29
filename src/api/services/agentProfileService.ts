import { t } from '@/i18n';
import type { AgentProfile } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { requirePermission } from '@/mock/access';
import { delay } from '@/mock/helpers';
import { ApiRequestError } from '../http';

export type { AgentProfile } from '@/types';

export const AGENT_CONFIG_CHANGED_EVENT = 'pilot-admin:agent:config-changed';

export const DEFAULT_AGENT_PROFILE: AgentProfile = {
  name: '领航助手',
  greeting: '你好，我是你的工作助手。可以帮你查看概况、查找用户、维护账号和执行巡检。',
  suggestions: [
    { label: '概况统计', prompt: '概况统计' },
    { label: '查找用户', prompt: '查找用户 陈' },
    { label: '新增用户', prompt: '新增用户 林沐晨' },
    { label: '账号巡检', prompt: '账号巡检' },
  ],
};

export const agentProfileService = {
  async getProfile(): Promise<AgentProfile> {
    await delay();
    requirePermission('agent:use');
    return structuredClone(getMockDb().agentProfile);
  },

  async getSettings(): Promise<AgentProfile> {
    await delay();
    requirePermission('agent-config:view');
    return structuredClone(getMockDb().agentProfile);
  },

  async save(input: Partial<AgentProfile>): Promise<void> {
    await delay();
    requirePermission('agent-config:update');
    const next = { ...getMockDb().agentProfile, ...input };
    if (!next.name.trim() || !next.greeting.trim()) {
      throw new ApiRequestError(t('serverErrors.agentProfile.incomplete'), 400);
    }
    if (next.suggestions.length > 6 || next.suggestions.some((item) => !item.label.trim() || !item.prompt.trim())) {
      throw new ApiRequestError(t('serverErrors.agentProfile.invalidShortcuts'), 400);
    }

    updateMockDb((db) => {
      db.agentProfile = structuredClone(next);
    });
    window.dispatchEvent(new Event(AGENT_CONFIG_CHANGED_EVENT));
  },
};
