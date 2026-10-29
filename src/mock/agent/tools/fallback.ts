import { exampleChoices } from './helpers';
import type { AgentTool } from './types';

export const fallback: AgentTool = {
  id: 'fallback',
  match: () => true,
  handle: async () => ({
    message: '我可以帮你处理账号与管理任务。试试下面的提问，或输入「帮助」了解可用能力。',
    choices: exampleChoices(),
  }),
};
