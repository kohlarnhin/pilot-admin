import { ApiRequestError } from '@/api/http';
import { userService } from '@/api/services/userService';
import { roleService } from '@/api/services/roleService';
import { triggerDataChangeSideEffects } from '@/api/services/agentEvents';
import { confirmation, denied, markdownCell, permitted } from './helpers';
import type { AgentTool } from './types';

export const createUser: AgentTool = {
  id: 'create-user',
  match: (text) => /^新增用户/.test(text),
  handle: async (ctx) => {
    if (!permitted(ctx, 'user:create')) {
      return denied('新增用户');
    }

    const name = ctx.text.replace(/^新增用户\s*/, '').trim().slice(0, 40);
    if (!name) {
      return { message: '请告诉我用户姓名，例如「新增用户 林沐晨」。' };
    }

    const roles = (await roleService.getAllRoles()).filter((role) => role.status === 1);
    return {
      message: `为 **${markdownCell(name)}** 选择一个角色，确认后再创建账号。`,
      choices: roles.slice(0, 20).map((role) => ({
        id: `role:${role.id}`,
        label: role.role_name,
      })),
      task: { name },
    };
  },

  onChoice: async (ctx, choiceId, task) => {
    if (!permitted(ctx, 'user:create')) {
      return denied('新增用户');
    }

    const { name, roleId } = task.data;
    if (typeof name !== 'string') {
      throw new ApiRequestError('操作信息已失效，请重新提供姓名', 400);
    }

    if (choiceId.startsWith('role:')) {
      const selectedRoleId = choiceId.slice(5);
      const role = (await roleService.getAllRoles()).find((item) => item.id === selectedRoleId && item.status === 1);
      if (!role) {
        throw new ApiRequestError('角色不可用', 400);
      }

      return confirmation(
        `即将创建 **${name}**，角色为 **${role.role_name}**。系统会生成登录账号与随机初始密码，是否继续？`,
        { name, roleId: selectedRoleId },
      );
    }

    if (typeof roleId !== 'string' || choiceId !== 'confirm') {
      throw new ApiRequestError('请先选择角色', 400);
    }

    ctx.signal?.throwIfAborted();
    const result = await userService.createUser({
      user_name: name,
      login_name: `member_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`,
      role_ids: [roleId],
    });
    triggerDataChangeSideEffects();

    return {
      message: `已创建 **${result.data.user_name}**。\n\n| 项目 | 内容 |\n| --- | --- |\n| 登录账号 | \`${result.data.login_name}\` |\n| 初始密码 | \`${result.data.initial_password}\` |\n\n请保存初始密码并在首次登录后修改。用户列表已自动更新。`,
      data_changed: true,
    };
  },
};
