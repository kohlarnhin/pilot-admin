import { findUsers as queryUsers, markdownCell } from './helpers';
import type { AgentTool } from './types';

export const findUsers: AgentTool = {
  id: 'find-users',
  match: (text) => /^查找用户/.test(text),
  handle: async (ctx) => {
    const keyword = ctx.text.replace(/^查找用户\s*/, '');
    const users = await queryUsers(keyword, ctx.signal);
    const rows = users.slice(0, 20).map((user) => (
      `| ${markdownCell(user.user_name)} | ${markdownCell(user.login_name)} | ${user.status === 1 ? '已启用' : '已停用'} |`
    )).join('\n');

    return {
      message: users.length
        ? `找到 **${users.length}** 位用户${users.length > 20 ? '，先展示前 20 位' : ''}。\n\n| 姓名 | 账号 | 状态 |\n| --- | --- | --- |\n${rows}`
        : '没有找到匹配的用户，可以换一个姓名、账号或邮箱关键词。',
      interaction: {
        type: 'page_action',
        version: 1,
        action: 'navigate',
        title: '在用户管理中查看',
        description: keyword ? `查找关键词：${keyword}` : '打开全部用户',
        route: `/system/users?keyword=${encodeURIComponent(keyword)}`,
      },
    };
  },
};
