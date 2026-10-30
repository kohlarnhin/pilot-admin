import { t } from '@/i18n';
import { commandPrompt } from '@/agent/commands';
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
  message: t('agentTools.denied', { operation, help: commandPrompt('help') }),
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

export const confirmation = (message: string, task: Record<string, unknown>, label = t('agentTools.choices.confirmCreate')): ToolReply => ({
  message,
  task,
  choices: [
    { id: 'confirm', label },
    { id: 'cancel', label: t('common.actions.cancel') },
  ],
});

export const exampleChoices = () => [
  commandPrompt('overview'),
  commandPrompt('findUsers', t('agentTools.examples.findKeyword')),
  commandPrompt('accountAudit'),
].map((prompt) => ({ id: `prompt:${prompt}`, label: prompt }));

export function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();

    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException(t('common.status.stopped'), 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', abort, { once: true });
  });
}
