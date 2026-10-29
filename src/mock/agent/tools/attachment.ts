import { markdownCell } from './helpers';
import type { AgentTool } from './types';

export const attachment: AgentTool = {
  id: 'attachment',
  match: (_text, ctx) => ctx.attachments.length > 0,
  handle: async (ctx) => {
    const file = ctx.attachments[0];
    return {
      message: `已收到附件元数据。\n\n| 项目 | 内容 |\n| --- | --- |\n| 文件名 | ${markdownCell(file.fileName)} |\n| 大小 | ${file.size} 字节 |\n| 类型 | ${file.mimeType || '未知'} |\n${file.lineCount === undefined ? '' : `| 行数 | ${file.lineCount} |\n`}\n只记录上述元数据，文件正文没有进入消息或会话。`,
    };
  },
};
