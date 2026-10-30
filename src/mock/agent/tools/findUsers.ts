import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import { findUsers as queryUsers, markdownCell } from './helpers';
import type { AgentTool } from './types';

export const findUsers: AgentTool = {
  id: 'find-users',
  match: (text) => parseCommand(text, 'findUsers').matched,
  handle: async (ctx) => {
    const keyword = parseCommand(ctx.text, 'findUsers').argument;
    const users = await queryUsers(keyword, ctx.signal);
    const rows = users.slice(0, 20).map((user) => (
      `| ${markdownCell(user.user_name)} | ${markdownCell(user.login_name)} | ${t(user.status === 1 ? 'common.status.enabled' : 'common.status.disabled')} |`
    )).join('\n');

    return {
      message: users.length
        ? t('agentTools.findUsers.results', { count: users.length, limit: users.length > 20 ? t('agentTools.findUsers.limit') : '', rows })
        : t('agentTools.findUsers.empty'),
      interaction: {
        type: 'page_action',
        version: 1,
        action: 'navigate',
        title: t('agentTools.findUsers.openTitle'),
        description: keyword ? t('agentTools.findUsers.keyword', { keyword }) : t('agentTools.findUsers.all'),
        route: `/system/users?keyword=${encodeURIComponent(keyword)}`,
      },
    };
  },
};
