import { denied, permitted } from './helpers';
import type { AgentTool } from './types';

export const assignRoles: AgentTool = {
  id: 'assign-role',
  match: (text) => /批量分配角色/.test(text),
  handle: async (ctx) => {
    if (!permitted(ctx, 'user:update')) {
      return denied('批量分配角色');
    }

    return {
      message: '请打开操作面板，选择用户和目标角色。保存后会将所选用户的角色替换为目标角色。',
      interaction: {
        type: 'page_action',
        version: 1,
        action: 'modal',
        actionKey: 'users.assign-role',
        title: '批量分配角色',
        description: '在弹窗中选择账号与角色，完成后继续对话。',
      },
    };
  },

  // 写入由客户端弹窗的 service 完成；即便角色已改变，原会话仍可保存结果。
  onActionOutcome: async (_ctx, outcome) => ({
    message: outcome.status === 'cancelled' ? '已取消批量分配角色，没有修改账号。' : outcome.summary,
    data_changed: outcome.status === 'completed',
  }),
};
