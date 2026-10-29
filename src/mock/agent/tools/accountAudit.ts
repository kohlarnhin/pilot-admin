import { ApiRequestError } from '@/api/http';
import { dashboardService } from '@/api/services/dashboardService';
import { flattenMenuTree } from '@/api/services/menuService';
import { settingsService } from '@/api/services/settingsService';
import { denied, findUsers, wait } from './helpers';
import type { AgentTool } from './types';

export const accountAudit: AgentTool = {
  id: 'account-inspection',
  match: (text) => /账号巡检/.test(text),
  handle: async (ctx) => {
    if (!flattenMenuTree(ctx.menus).some((menu) => menu.route_path === '/system/users')) {
      return denied('账号巡检');
    }

    await dashboardService.getOverview();
    return {
      message: '已为你准备账号巡检计划。执行过程只读取数据；停止会让当前步骤完成，再停止后续步骤。',
      interaction: {
        type: 'execution_plan',
        version: 1,
        title: '账号巡检',
        status: 'proposed',
        steps: [
          {
            type: 'check',
            title: '检查停用账号',
            description: '统计已停用账号并核对状态',
            status: 'pending',
          },
          {
            type: 'check',
            title: '检查无角色账号',
            description: '查找需要补充分配角色的账号',
            status: 'pending',
          },
          {
            type: 'check',
            title: '检查密码策略',
            description: '核对长度、数字与字母要求',
            status: 'pending',
          },
          {
            type: 'check',
            title: '生成巡检报告',
            description: '汇总检查结果与建议',
            status: 'pending',
          },
        ],
      },
    };
  },

  plan: {
    runStep: async (ctx, _plan, stepIndex) => {
      const users = await findUsers('', ctx.signal);
      await wait(1200, ctx.signal);
      const disabled = users.filter((user) => user.status === 0).length;
      const noRole = users.filter((user) => !user.role_ids.length).length;

      if (stepIndex === 0) {
        return { message: `已检查 ${users.length} 位用户，发现 ${disabled} 个停用账号。` };
      }
      if (stepIndex === 1) {
        return { message: `发现 ${noRole} 个无角色账号。` };
      }

      const settings = await settingsService.getPasswordPolicy();
      if (stepIndex === 2) {
        return {
          message: `密码至少 ${settings.passwordMinLength} 位；${settings.requireLetter ? '要求' : '不要求'}字母，${settings.requireNumber ? '要求' : '不要求'}数字。`,
        };
      }
      if (stepIndex === 3) {
        return {
          message: `## 账号巡检报告\n\n| 检查项 | 结果 |\n| --- | --- |\n| 用户总数 | ${users.length} |\n| 停用账号 | ${disabled} |\n| 无角色账号 | ${noRole} |\n| 密码最少长度 | ${settings.passwordMinLength} |\n\n建议定期核对停用账号，保持最小权限，并提醒用户更新初始密码。\n\n本次巡检未修改数据。`,
        };
      }

      throw new ApiRequestError('巡检步骤不存在', 400);
    },
  },
};
