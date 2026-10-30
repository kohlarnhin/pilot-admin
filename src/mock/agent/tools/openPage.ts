import { t } from '@/i18n';
import chinese from '@/i18n/locales/zh-CN/menu';
import english from '@/i18n/locales/en-US/menu';
import { parseCommand } from '@/agent/commands';
import { flattenMenuTree } from '@/api/services/menuService';
import { canAccessPage } from '@/routes/access';
import type { AgentTool } from './types';

export const openPage: AgentTool = {
  id: 'open-page',
  match: (text) => parseCommand(text, 'openPage').matched,
  handle: async (ctx) => {
    const name = parseCommand(ctx.text, 'openPage').argument.toLowerCase();
    const page = name && flattenMenuTree(ctx.menus).find((menu) => {
      if (!menu.route_path || !canAccessPage(menu.route_path, ctx)) return false;
      const key = menu.id.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()) as keyof typeof chinese;
      return [menu.menu_name, menu.route_path, chinese[key], english[key]]
        .some((candidate) => candidate?.toLowerCase().includes(name));
    });
    if (!page) {
      return { message: t('agentTools.openPage.empty') };
    }

    return {
      message: t('agentTools.openPage.reply', { name: page.menu_name }),
      interaction: {
        type: 'page_action',
        version: 1,
        action: 'navigate',
        title: t('agentTools.openPage.title', { name: page.menu_name }),
        autoOpen: true,
        description: t('agentTools.openPage.description'),
        route: page.route_path,
      },
    };
  },
};
