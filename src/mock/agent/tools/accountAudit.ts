import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import { ApiRequestError } from '@/api/http';
import { dashboardService } from '@/api/services/dashboardService';
import { flattenMenuTree } from '@/api/services/menuService';
import { settingsService } from '@/api/services/settingsService';
import { denied, findUsers, wait } from './helpers';
import type { AgentTool } from './types';

export const accountAudit: AgentTool = {
  id: 'account-inspection',
  match: (text) => parseCommand(text, 'accountAudit').matched,
  handle: async (ctx) => {
    if (!flattenMenuTree(ctx.menus).some((menu) => menu.route_path === '/system/users')) {
      return denied(t('agentTools.operations.accountAudit'));
    }

    await dashboardService.getOverview();
    return {
      message: t('agentTools.accountAudit.reply'),
      interaction: {
        type: 'execution_plan',
        version: 1,
        title: t('agentCommands.accountAudit.primary'),
        status: 'proposed',
        steps: [
          {
            type: 'check',
            title: t('agentTools.accountAudit.steps.disabledTitle'),
            description: t('agentTools.accountAudit.steps.disabledDescription'),
            status: 'pending',
          },
          {
            type: 'check',
            title: t('agentTools.accountAudit.steps.rolesTitle'),
            description: t('agentTools.accountAudit.steps.rolesDescription'),
            status: 'pending',
          },
          {
            type: 'check',
            title: t('agentTools.accountAudit.steps.passwordTitle'),
            description: t('agentTools.accountAudit.steps.passwordDescription'),
            status: 'pending',
          },
          {
            type: 'check',
            title: t('agentTools.accountAudit.steps.reportTitle'),
            description: t('agentTools.accountAudit.steps.reportDescription'),
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
        return { message: t('agentTools.accountAudit.disabledResult', { count: users.length, disabled }) };
      }
      if (stepIndex === 1) {
        return { message: t('agentTools.accountAudit.rolesResult', { count: noRole }) };
      }

      const settings = await settingsService.getPasswordPolicy();
      if (stepIndex === 2) {
        return {
          message: t('agentTools.accountAudit.passwordResult', {
            length: settings.passwordMinLength,
            letters: t(settings.requireLetter ? 'agentTools.accountAudit.required' : 'agentTools.accountAudit.optional'),
            numbers: t(settings.requireNumber ? 'agentTools.accountAudit.required' : 'agentTools.accountAudit.optional'),
          }),
        };
      }
      if (stepIndex === 3) {
        return {
          message: t('agentTools.accountAudit.report', { count: users.length, disabled, noRole, length: settings.passwordMinLength }),
        };
      }

      throw new ApiRequestError(t('serverErrors.agent.auditStepNotFound'), 400);
    },
  },
};
