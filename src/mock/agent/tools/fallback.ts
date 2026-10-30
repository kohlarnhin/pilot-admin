import { t } from '@/i18n';
import { exampleChoices } from './helpers';
import type { AgentTool } from './types';

export const fallback: AgentTool = {
  id: 'fallback',
  match: () => true,
  handle: async () => ({
    message: t('agentTools.fallback.reply'),
    choices: exampleChoices(),
  }),
};
