import { exampleChoices } from './helpers';
import type { AgentTool } from './types';

export const help: AgentTool = {
  id: 'help',
  match: (text) => /帮助|你能做什么/.test(text),
  handle: async () => ({
    message: '## 我可以帮你\n\n- 查看账号概况与统计\n- 查找用户并打开管理页面\n- 新增用户、停用账号与批量分配角色（需要权限并确认）\n- 按计划执行账号巡检\n\n所有操作遵循当前账号权限。附件只读取元数据。',
    choices: exampleChoices(),
  }),
};
