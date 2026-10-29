import type { AgentConfig } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { requirePermission } from '@/mock/access';
import { delay } from '@/mock/helpers';
import { ApiRequestError } from '../http';
import { AGENT_CONFIG_CHANGED_EVENT } from './agentProfileService';

export interface AgentConfigInput {
  provider: string;
  base_url: string;
  model_code: string;
  model_name: string;
  apiKey?: string;
}

const publicConfig = ({ apiKey, ...config }: AgentConfig & { apiKey: string }): AgentConfig => ({
  ...config,
  api_key_masked: apiKey ? '••••••••' : '未设置',
});

const changed = () => window.dispatchEvent(new Event(AGENT_CONFIG_CHANGED_EVENT));

const validate = (input: AgentConfigInput) => {
  if (![input.provider, input.base_url, input.model_code, input.model_name].every((value) => value?.trim())) {
    throw new ApiRequestError('请填写完整的模型配置', 400);
  }

  try {
    if (!['http:', 'https:'].includes(new URL(input.base_url).protocol)) {
      throw new Error();
    }
  } catch {
    throw new ApiRequestError('请输入有效的 HTTP 或 HTTPS 地址', 400);
  }
};

export const agentConfigService = {
  async getConfigs(): Promise<AgentConfig[]> {
    await delay();
    requirePermission('agent-config:view');
    return getMockDb().agentConfigs.map(publicConfig);
  },

  async hasEnabledConfig(): Promise<boolean> {
    await delay();
    requirePermission('agent:use');
    return getMockDb().agentConfigs.some((config) => config.status === 1);
  },

  async addConfig(input: AgentConfigInput): Promise<void> {
    await delay();
    requirePermission('agent-config:update');
    validate(input);
    const date = new Date().toISOString();

    updateMockDb((db) => {
      db.agentConfigs.push({
        ...input,
        id: crypto.randomUUID(),
        apiKey: input.apiKey || '',
        api_key_masked: '••••••••',
        status: 1,
        create_date: date,
        last_update_date: date,
      });
    });
    changed();
  },

  async updateConfig(id: string, input: AgentConfigInput): Promise<void> {
    await delay();
    requirePermission('agent-config:update');
    validate(input);

    updateMockDb((db) => {
      const config = db.agentConfigs.find((item) => item.id === id);
      if (!config) {
        throw new ApiRequestError('配置不存在', 404);
      }
      Object.assign(config, input, {
        apiKey: input.apiKey || config.apiKey,
        last_update_date: new Date().toISOString(),
      });
    });
    changed();
  },

  async updateConfigStatus(id: string, status: 0 | 1): Promise<void> {
    await delay();
    requirePermission('agent-config:update');
    updateMockDb((db) => {
      const config = db.agentConfigs.find((item) => item.id === id);
      if (!config) {
        throw new ApiRequestError('配置不存在', 404);
      }
      config.status = status;
    });
    changed();
  },

  async deleteConfig(id: string): Promise<void> {
    await delay();
    requirePermission('agent-config:update');
    updateMockDb((db) => {
      db.agentConfigs = db.agentConfigs.filter((config) => config.id !== id);
    });
    changed();
  },
};
