import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import { roleService } from '@/api/services/roleService';
import { flattenMenuTree } from '@/api/services/menuService';
import { denied, findUsers, markdownCell } from './helpers';
import type { AgentTool } from './types';

export const overview: AgentTool = {
  id: 'overview',
  match: (text) => parseCommand(text, 'overview').matched,
  handle: async (ctx) => {
    if (!flattenMenuTree(ctx.menus).some((menu) => menu.route_path === '/system/users')) {
      return denied(t('agentTools.operations.overview'));
    }

    const [users, roles] = await Promise.all([findUsers('', ctx.signal), roleService.getAllRoles()]);
    const lines = roles.map((role) => {
      const members = users.filter((user) => user.role_ids.includes(role.id));
      const enabled = members.filter((user) => user.status === 1).length;
      const disabled = members.filter((user) => user.status === 0).length;
      return `| ${markdownCell(role.role_name)} | ${members.length} | ${enabled} | ${disabled} |`;
    });

    return {
      message: t('agentTools.overview.reply', {
        count: users.length,
        rows: lines.join('\n'),
        noRole: users.filter((user) => !user.role_ids.length).length,
      }),
    };
  },
};
