import { t } from '@/i18n';
import { parseCommand } from '@/agent/commands';
import { ApiRequestError } from '@/api/http';
import { userService } from '@/api/services/userService';
import { roleService } from '@/api/services/roleService';
import { triggerDataChangeSideEffects } from '@/api/services/agentEvents';
import { confirmation, denied, markdownCell, permitted } from './helpers';
import type { AgentTool } from './types';
import { createId } from '@/utils/id';

export const createUser: AgentTool = {
  id: 'create-user',
  match: (text) => parseCommand(text, 'createUser').matched,
  handle: async (ctx) => {
    if (!permitted(ctx, 'user:create')) {
      return denied(t('agentTools.operations.createUser'));
    }

    const name = parseCommand(ctx.text, 'createUser').argument.slice(0, 40);
    if (!name) {
      return { message: t('agentTools.createUser.nameRequired') };
    }

    const roles = (await roleService.getAllRoles()).filter((role) => role.status === 1);
    return {
      message: t('agentTools.createUser.chooseRole', { name: markdownCell(name) }),
      choices: roles.slice(0, 20).map((role) => ({
        id: `role:${role.id}`,
        label: role.role_name,
      })),
      task: { name },
    };
  },

  onChoice: async (ctx, choiceId, task) => {
    if (!permitted(ctx, 'user:create')) {
      return denied(t('agentTools.operations.createUser'));
    }

    const { name, roleId } = task.data;
    if (typeof name !== 'string') {
      throw new ApiRequestError(t('serverErrors.agent.nameExpired'), 400);
    }

    if (choiceId.startsWith('role:')) {
      const selectedRoleId = choiceId.slice(5);
      const role = (await roleService.getAllRoles()).find((item) => item.id === selectedRoleId && item.status === 1);
      if (!role) {
        throw new ApiRequestError(t('serverErrors.agent.roleUnavailable'), 400);
      }

      return confirmation(
        t('agentTools.createUser.confirm', { name, role: role.role_name }),
        { name, roleId: selectedRoleId },
      );
    }

    if (typeof roleId !== 'string' || choiceId !== 'confirm') {
      throw new ApiRequestError(t('serverErrors.agent.roleRequired'), 400);
    }

    ctx.signal?.throwIfAborted();
    const result = await userService.createUser({
      user_name: name,
      login_name: `member_${createId().replace(/-/g, '').slice(0, 10)}`,
      role_ids: [roleId],
    });
    triggerDataChangeSideEffects();

    return {
      message: t('agentTools.createUser.created', {
        name: result.data.user_name,
        account: result.data.login_name,
        password: result.data.initial_password,
      }),
      data_changed: true,
    };
  },
};
