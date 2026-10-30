import { t } from '@/i18n';
import type { AgentAttachmentMetadata } from '@/types';
import { createId } from '@/utils/id';
export interface AssistantAttachment {
  id: string;
  file: { name: string };
  metadata: AgentAttachmentMetadata;
  error?: string;
}
/** 正文只用于本地行数计算；函数返回后不保留原文件或正文引用。 */
export async function parseAttachment(file: File): Promise<AssistantAttachment> {
  const id = createId();
  const metadata: AgentAttachmentMetadata = { attachmentId: id, fileName: file.name, size: file.size, mimeType: file.type };
  const attachment: AssistantAttachment = { id, file: { name: file.name }, metadata };
  if (file.size > 5 * 1024 * 1024) return { ...attachment, error: t('assistant.errors.attachmentSize') };
  try {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 200));
    if (/\.(txt|csv|json)$/i.test(file.name)) {
      const text = await file.text();
      metadata.lineCount = text.length ? text.split(/\r\n|\r|\n/).length : 0;
    }
    return attachment;
  } catch {
    return { ...attachment, error: t('assistant.errors.attachmentRead') };
  }
}
export const attachmentMetadata = (attachment: AssistantAttachment): AgentAttachmentMetadata => ({ ...attachment.metadata });
export const clearAttachments = () => { /* 元数据由共享运行时持有，无全局文件缓存。 */ };
