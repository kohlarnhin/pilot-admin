import type { AgentTool } from './types';

export const simulateError: AgentTool = {
  id: 'simulate-error',
  match: (text) => /模拟错误/.test(text),
  handle: async () => {
    throw new Error('模拟服务暂时不可用，请点击重新尝试。');
  },
};
