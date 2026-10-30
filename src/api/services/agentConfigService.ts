import { recordAuditFailure } from '@/mock/auditFailure';
import { recordAudit } from '@/mock/audit';
import { t } from '@/i18n';
import type { AgentConfig } from '@/types';
import { getMockDb, updateMockDb } from '@/mock/db';
import { requirePermission } from '@/mock/access';
import { createTraceId, delay } from '@/mock/helpers';
import { ApiRequestError } from '../errors';
import { AGENT_CONFIG_CHANGED_EVENT } from './agentProfileService';
import { createId } from '@/utils/id';

export interface AgentConfigInput {
  provider: string;
  base_url: string;
  model_code: string;
  model_name: string;
  apiKey?: string;
}

const publicConfig = ({ apiKey, ...config }: AgentConfig & { apiKey: string }): AgentConfig => ({
  ...config,
  api_key_masked: apiKey ? '••••••••' : t('common.empty.unset'),
});

const changed = () => window.dispatchEvent(new Event(AGENT_CONFIG_CHANGED_EVENT));

const validate = (input: AgentConfigInput) => {
  if (![input.provider, input.base_url, input.model_code, input.model_name].every((value) => value?.trim())) {
    throw new ApiRequestError(t('serverErrors.agentConfig.incomplete'), 400);
  }

  try {
    if (!['http:', 'https:'].includes(new URL(input.base_url).protocol)) {
      throw new Error();
    }
  } catch {
    throw new ApiRequestError(t('serverErrors.agentConfig.invalidUrl'), 400);
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

  addConfig: async (input: AgentConfigInput): Promise<void> => {
    try {
      await delay();
      const actor = requirePermission('agent-config:update');
      validate(input);
      const date = new Date().toISOString();

      const traceId = createTraceId();
      updateMockDb((db) => {
        const id = createId();
        db.agentConfigs.push({
          ...input,
          id,
          apiKey: input.apiKey || '',
          api_key_masked: '••••••••',
          status: 1,
          create_date: date,
          last_update_date: date,
        });
        recordAudit(db, {
          actor,
          action: 'agent_config.create',
          target_type: 'agent_config',
          target_id: id,
          target_name: input.model_name,
          traceId,
        });
      });
      changed();
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'agent_config.create',
        target_type: 'agent_config',
        target_name: input.model_name,
      }));
      throw error;
    }
  },

  updateConfig: async (id: string, input: AgentConfigInput): Promise<void> => {
    try {
      await delay();
      const actor = requirePermission('agent-config:update');
      validate(input);

      const traceId = createTraceId();
      updateMockDb((db) => {
        const config = db.agentConfigs.find((item) => item.id === id);
        if (!config) {
          throw new ApiRequestError(t('serverErrors.agentConfig.notFound'), 404);
        }
        Object.assign(config, input, {
          apiKey: input.apiKey || config.apiKey,
          last_update_date: new Date().toISOString(),
        });
        recordAudit(db, {
          actor,
          action: 'agent_config.update',
          target_type: 'agent_config',
          target_id: id,
          target_name: config.model_name,
          traceId,
        });
      });
      changed();
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'agent_config.update',
        target_type: 'agent_config',
        target_id: id,
        target_name: getMockDb().agentConfigs.find((item) => item.id === id)?.model_name,
      }));
      throw error;
    }
  },

  updateConfigStatus: async (id: string, status: 0 | 1): Promise<void> => {
    try {
      await delay();
      const actor = requirePermission('agent-config:update');
      const traceId = createTraceId();
      updateMockDb((db) => {
        const config = db.agentConfigs.find((item) => item.id === id);
        if (!config) {
          throw new ApiRequestError(t('serverErrors.agentConfig.notFound'), 404);
        }
        config.status = status;
        recordAudit(db, {
          actor,
          action: 'agent_config.status',
          target_type: 'agent_config',
          target_id: id,
          target_name: config.model_name,
          params: { status },
          traceId,
        });
      });
      changed();
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'agent_config.status',
        target_type: 'agent_config',
        target_id: id,
        target_name: getMockDb().agentConfigs.find((item) => item.id === id)?.model_name,
        params: { status },
      }));
      throw error;
    }
  },

  deleteConfig: async (id: string): Promise<void> => {
    try {
      await delay();
      const actor = requirePermission('agent-config:update');
      const traceId = createTraceId();
      updateMockDb((db) => {
        const target = db.agentConfigs.find((config) => config.id === id);
        db.agentConfigs = db.agentConfigs.filter((config) => config.id !== id);
        recordAudit(db, {
          actor,
          action: 'agent_config.delete',
          target_type: 'agent_config',
          target_id: id,
          target_name: target?.model_name,
          traceId,
        });
      });
      changed();
    } catch (error) {
      recordAuditFailure(error, () => ({
        action: 'agent_config.delete',
        target_type: 'agent_config',
        target_id: id,
        target_name: getMockDb().agentConfigs.find((item) => item.id === id)?.model_name,
      }));
      throw error;
    }
  },
};
