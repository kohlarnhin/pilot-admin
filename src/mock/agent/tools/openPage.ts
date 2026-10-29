import { flattenMenuTree } from '@/api/services/menuService';
import type { AgentTool } from './types';

export const openPage: AgentTool = {
  id: 'open-page',
  match: (text) => /^打开/.test(text),
  handle: async (ctx) => {
    const name = ctx.text.replace(/^打开\s*/, '').trim();
    const page = name && flattenMenuTree(ctx.menus).find((menu) => menu.route_path && menu.menu_name.includes(name));
    if (!page) {
      return { message: '当前账号没有可打开的匹配页面。请确认页面名称与访问权限。' };
    }

    return {
      message: `可以打开「${page.menu_name}」。`,
      interaction: {
        type: 'page_action',
        version: 1,
        action: 'navigate',
        title: `打开${page.menu_name}`,
        autoOpen: true,
        description: '打开页面后，可随时返回当前对话。',
        route: page.route_path,
      },
    };
  },
};
