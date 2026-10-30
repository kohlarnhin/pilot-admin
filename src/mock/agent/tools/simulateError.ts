import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import type { AgentTool } from './types';

export const simulateError: AgentTool = {
  id: 'simulate-error',
  match: (text) => parseCommand(text, 'simulateError').matched,
  handle: async () => {
    throw new Error(t('serverErrors.agent.simulated'));
  },
};
