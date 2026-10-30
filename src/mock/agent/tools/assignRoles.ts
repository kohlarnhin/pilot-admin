import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import { denied, permitted } from './helpers';
import type { AgentTool } from './types';

export const assignRoles: AgentTool = {
  id: 'assign-role',
  match: (text) => parseCommand(text, 'assignRoles').matched,
  handle: async (ctx) => {
    if (!permitted(ctx, 'user:update')) {
      return denied(t('agentTools.operations.assignRoles'));
    }

    return {
      message: t('agentTools.assignRoles.reply'),
      interaction: {
        type: 'page_action',
        version: 1,
        action: 'modal',
        actionKey: 'users.assign-role',
        title: t('agentCommands.assignRoles.primary'),
        description: t('agentTools.assignRoles.description'),
      },
    };
  },

  // 写入由客户端弹窗的 service 完成；即便角色已改变，原会话仍可保存结果。
  onActionOutcome: async (_ctx, outcome) => ({
    message: outcome.status === 'cancelled' ? t('agentTools.assignRoles.cancelled') : outcome.summary,
    data_changed: outcome.status === 'completed',
  }),
};
