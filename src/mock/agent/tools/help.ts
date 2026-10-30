import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import { exampleChoices } from './helpers';
import type { AgentTool } from './types';

export const help: AgentTool = {
  id: 'help',
  match: (text) => parseCommand(text, 'help').matched,
  handle: async () => ({
    message: t('agentTools.help.reply'),
    choices: exampleChoices(),
  }),
};
