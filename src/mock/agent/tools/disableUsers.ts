import { ApiRequestError } from '@/api/http';
import { userService } from '@/api/services/userService';
import { triggerDataChangeSideEffects } from '@/api/services/agentEvents';
import { confirmation, denied, findUsers, markdownCell, permitted } from './helpers';
import type { AgentTool } from './types';

export const disableUsers: AgentTool = {
  id: 'disable-users',
  match: (text) => /^停用用户/.test(text),
  handle: async (ctx) => {
    if (!permitted(ctx, 'user:update')) {
      return denied('停用用户');
    }

    const keyword = ctx.text.replace(/^停用用户\s*/, '').trim();
    if (!keyword) {
      return { message: '请提供姓名、账号或邮箱关键词，例如「停用用户 王」。' };
    }

    const users = (await findUsers(keyword, ctx.signal)).filter((user) => user.status === 1 && user.id !== ctx.userId);
    if (!users.length) {
      return { message: '没有可停用的匹配用户（当前账号不会被停用）。' };
    }

    if (users.length === 1) {
      return confirmation(
        `确认停用 **${markdownCell(users[0].user_name)}**（${users[0].login_name}）？`,
        { userIds: [users[0].id] },
        '确认停用',
      );
    }

    return {
      message: `找到 **${users.length}** 位可停用用户，请选择要操作的账号。下一步仍需确认。`,
      interaction: {
        type: 'selection',
        version: 1,
        title: '选择要停用的用户',
        defaultSelectedIds: [],
        minSelected: 1,
        maxSelected: users.length,
        options: users.map((user) => ({
          id: user.id,
          label: user.user_name,
          description: user.login_name,
        })),
      },
    };
  },

  onSelection: async (ctx, selectedIds) => {
    if (!permitted(ctx, 'user:update')) {
      return denied('停用用户');
    }

    return confirmation(
      `确认停用选中的 **${selectedIds.length}** 位用户？`,
      { userIds: selectedIds },
      '确认停用',
    );
  },

  onChoice: async (ctx, choiceId, task) => {
    if (!permitted(ctx, 'user:update')) {
      return denied('停用用户');
    }

    const { userIds } = task.data;
    if (choiceId !== 'confirm' || !Array.isArray(userIds) || !userIds.every((id) => typeof id === 'string')) {
      throw new ApiRequestError('操作信息已失效，请重新选择用户', 400);
    }

    let completed = 0;
    try {
      for (const id of userIds) {
        ctx.signal?.throwIfAborted();
        await userService.updateStatus(id, 0);
        completed += 1;
      }
    } finally {
      if (completed) {
        triggerDataChangeSideEffects();
      }
    }

    return {
      message: `已停用 **${completed}** 位用户。用户列表和概览已同步更新。`,
      data_changed: completed > 0,
    };
  },
};
