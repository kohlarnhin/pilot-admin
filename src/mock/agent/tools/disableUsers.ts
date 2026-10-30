import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import { ApiRequestError } from '@/api/http';
import { userService } from '@/api/services/userService';
import { triggerDataChangeSideEffects } from '@/api/services/agentEvents';
import { confirmation, denied, findUsers, markdownCell, permitted } from './helpers';
import type { AgentTool } from './types';

export const disableUsers: AgentTool = {
  id: 'disable-users',
  match: (text) => parseCommand(text, 'disableUsers').matched,
  handle: async (ctx) => {
    if (!permitted(ctx, 'user:update')) {
      return denied(t('agentTools.operations.disableUsers'));
    }

    const keyword = parseCommand(ctx.text, 'disableUsers').argument;
    if (!keyword) {
      return { message: t('agentTools.disableUsers.keywordRequired') };
    }

    const users = (await findUsers(keyword, ctx.signal)).filter((user) => user.status === 1 && user.id !== ctx.userId);
    if (!users.length) {
      return { message: t('agentTools.disableUsers.empty') };
    }

    if (users.length === 1) {
      return confirmation(
        t('agentTools.disableUsers.confirmUser', { name: markdownCell(users[0].user_name), account: users[0].login_name }),
        { userIds: [users[0].id] },
        t('agentTools.choices.confirmDisable'),
      );
    }

    return {
      message: t('agentTools.disableUsers.select', { count: users.length }),
      interaction: {
        type: 'selection',
        version: 1,
        title: t('agentTools.disableUsers.title'),
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
      return denied(t('agentTools.operations.disableUsers'));
    }

    return confirmation(
      t('agentTools.disableUsers.confirmSelection', { count: selectedIds.length }),
      { userIds: selectedIds },
      t('agentTools.choices.confirmDisable'),
    );
  },

  onChoice: async (ctx, choiceId, task) => {
    if (!permitted(ctx, 'user:update')) {
      return denied(t('agentTools.operations.disableUsers'));
    }

    const { userIds } = task.data;
    if (choiceId !== 'confirm' || !Array.isArray(userIds) || !userIds.every((id) => typeof id === 'string')) {
      throw new ApiRequestError(t('serverErrors.agent.usersExpired'), 400);
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
      message: t('agentTools.disableUsers.completed', { count: completed }),
      data_changed: completed > 0,
    };
  },
};
