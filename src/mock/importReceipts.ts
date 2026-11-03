import type { ProjectImportReceipt } from '@/types';

/** 新回执放在最前面；只保留最近 20 次导入和最多 5000 行，不保留单元格。 */
export function capImportReceipts(receipts: ProjectImportReceipt[]): ProjectImportReceipt[] {
  const newest = new Set<string>();
  for (const receipt of receipts) {
    if (newest.size === 20) break;
    newest.add(receipt.import_id);
  }
  return receipts.filter((receipt) => newest.has(receipt.import_id)).slice(0, 5000);
}
