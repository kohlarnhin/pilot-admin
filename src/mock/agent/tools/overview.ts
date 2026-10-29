import { roleService } from '@/api/services/roleService';
import { flattenMenuTree } from '@/api/services/menuService';
import { denied, findUsers, markdownCell } from './helpers';
import type { AgentTool } from './types';

export const overview: AgentTool = {
  id: 'overview',
  match: (text) => /概况统计|概览统计/.test(text),
  handle: async (ctx) => {
    if (!flattenMenuTree(ctx.menus).some((menu) => menu.route_path === '/system/users')) {
      return denied('查看用户统计');
    }

    const [users, roles] = await Promise.all([findUsers('', ctx.signal), roleService.getAllRoles()]);
    const lines = roles.map((role) => {
      const members = users.filter((user) => user.role_ids.includes(role.id));
      const enabled = members.filter((user) => user.status === 1).length;
      const disabled = members.filter((user) => user.status === 0).length;
      return `| ${markdownCell(role.role_name)} | ${members.length} | ${enabled} | ${disabled} |`;
    });

    return {
      message: `## 概况统计\n\n共 **${users.length}** 位用户，按角色统计如下（多角色账号可重复计入）。\n\n| 角色 | 用户数 | 已启用 | 已停用 |\n| --- | ---: | ---: | ---: |\n${lines.join('\n')}\n\n无角色账号：${users.filter((user) => !user.role_ids.length).length} 位。`,
    };
  },
};
