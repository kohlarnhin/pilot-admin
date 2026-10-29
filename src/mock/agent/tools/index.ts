import { attachment } from './attachment';
import { help } from './help';
import { overview } from './overview';
import { findUsers } from './findUsers';
import { createUser } from './createUser';
import { disableUsers } from './disableUsers';
import { assignRoles } from './assignRoles';
import { accountAudit } from './accountAudit';
import { openPage } from './openPage';
import { simulateError } from './simulateError';
import { fallback } from './fallback';
import type { AgentTool } from './types';

/** 按顺序匹配；工具的后续交互通过持久化的 tool id 分发。 */
export const agentTools: AgentTool[] = [
  attachment,
  help,
  overview,
  findUsers,
  createUser,
  disableUsers,
  assignRoles,
  accountAudit,
  openPage,
  simulateError,
  fallback,
];

