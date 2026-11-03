/** 文件元数据使用 1024 进制，最多一位小数；无效大小按 0 B 展示。 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const index = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1));
  return `${Number((bytes / 1024 ** index).toFixed(index ? 1 : 0))} ${units[index]}`;
}
