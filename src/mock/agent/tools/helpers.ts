import type { AgentInteraction, User } from '@/types';
import { userService } from '@/api/services/userService';
import { meResponse } from '@/mock/access';
import type { ToolContext, ToolInput, ToolReply } from './types';

export function createToolContext(text: string, signal?: AbortSignal, input: ToolInput = {}): ToolContext {
  const me = meResponse();

  return {
    text,
    userId: me.user.id,
    menus: me.menus,
    permissions: me.permissions,
    signal,
    // 只接收白名单元数据，调用方传入的其他字段不能进入持久层。
    attachments: (input.attachments || []).slice(0, 1).map((item) => ({
      attachmentId: item.attachmentId,
      fileName: item.fileName.slice(0, 255),
      size: item.size,
      mimeType: item.mimeType,
      lineCount: item.lineCount,
    })),
  };
}

export function toolInputInteraction(ctx: ToolContext): AgentInteraction | undefined {
  if (!ctx.attachments.length) {
    return undefined;
  }

  return {
    type: 'attachment_metadata',
    attachments: ctx.attachments,
  };
}

export const permitted = (ctx: ToolContext, permission: string) => ctx.permissions.includes(permission);

export const denied = (operation: string): ToolReply => ({
  message: `当前账号没有${operation}的权限。你可以联系管理员调整角色权限，或试试「帮助」查看可用能力。`,
});

export const markdownCell = (value: string) => value.replace(/\|/g, '\\|').replace(/[\r\n]/g, ' ');

export async function findUsers(keyword = '', signal?: AbortSignal): Promise<User[]> {
  const records: User[] = [];
  let pageNo = 1;

  do {
    signal?.throwIfAborted();
    const result = await userService.getUsers({ keyword, pageNo, pageSize: 100 });
    records.push(...result.data.records);

    if (!result.data.hasNext) {
      return records;
    }
    pageNo += 1;
  } while (pageNo <= 20);

  return records;
}

export const confirmation = (message: string, task: Record<string, unknown>, label = '确认创建'): ToolReply => ({
  message,
  task,
  choices: [
    { id: 'confirm', label },
    { id: 'cancel', label: '取消' },
  ],
});

export const exampleChoices = () => [
  { id: 'prompt:概况统计', label: '概况统计' },
  { id: 'prompt:查找用户 陈', label: '查找用户 陈' },
  { id: 'prompt:账号巡检', label: '账号巡检' },
];

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();

    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('已停止', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', abort, { once: true });
  });
}
