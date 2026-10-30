import { t } from '@/i18n';
import { markdownCell } from './helpers';
import type { AgentTool } from './types';

export const attachment: AgentTool = {
  id: 'attachment',
  match: (_text, ctx) => ctx.attachments.length > 0,
  handle: async (ctx) => {
    const file = ctx.attachments[0];
    return {
      message: t('agentTools.attachment.reply', {
        name: markdownCell(file.fileName),
        size: file.size,
        type: file.mimeType || t('agentTools.attachment.unknown'),
        lines: file.lineCount === undefined ? '' : t('agentTools.attachment.lines', { count: file.lineCount }),
      }),
    };
  },
};
