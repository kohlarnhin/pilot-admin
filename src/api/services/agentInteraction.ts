import type { AgentInteraction } from '@/types';
/** 本地缓存也视为不可信数据；移除旧版本或损坏的交互卡。 */
export function normalizeAgentInteraction(value: unknown): AgentInteraction | undefined {
  if (!value || typeof value !== 'object')
    return undefined;
  const item = value as Record<string, unknown>;
  if (item.type === 'page_action' && item.version === 1 && ['navigate', 'modal'].includes(String(item.action))
    && typeof item.title === 'string' && typeof item.description === 'string')
    return item as unknown as AgentInteraction;
  if (item.type === 'execution_plan' && item.version === 1 && typeof item.title === 'string'
    && ['proposed', 'running', 'waiting_user', 'failed', 'stopped', 'completed'].includes(String(item.status))
    && Array.isArray(item.steps) && item.steps.every((step) => step && typeof step.title === 'string'
    && ['pending', 'running', 'completed', 'waiting_user', 'failed', 'stopped'].includes(step.status)))
    return item as unknown as AgentInteraction;
  if (item.type === 'selection' && item.version === 1 && typeof item.title === 'string' && Array.isArray(item.options)
    && Array.isArray(item.defaultSelectedIds) && typeof item.minSelected === 'number' && typeof item.maxSelected === 'number'
    && item.options.every((option) => option && typeof option.id === 'string' && typeof option.label === 'string'))
    return item as unknown as AgentInteraction;
  if (item.type === 'attachment_metadata' && Array.isArray(item.attachments)) {
    return {
      type: 'attachment_metadata',
      attachments: item.attachments.filter((file) => file && typeof file.fileName === 'string' && typeof file.size === 'number').map((file) => ({
        attachmentId: file.attachmentId,
        fileName: file.fileName,
        size: file.size,
        mimeType: file.mimeType,
        lineCount: file.lineCount,
      }))
    };
  }
  if (item.type === 'selection_submission' && Array.isArray(item.selectedIds) && item.selectedIds.every((id) => typeof id === 'string'))
    return item as unknown as AgentInteraction;
  return undefined;
}
