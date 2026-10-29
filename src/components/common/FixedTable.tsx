import { DataTable, type DataTableProps } from '@/ui/data-table';

/**
 * Card 内列表表格：撑满卡片剩余高度，表头吸顶、正文独立滚动。
 * - 首次请求展示骨架屏，空数据时居中展示空状态；
 * - 传入 onLoadMore 时启用行窗口化与无感预取（滚动约过半时静默加载下一页）。
 */
export function FixedTable<T extends object>(props: DataTableProps<T>) {
  return <DataTable<T> fill {...props} />;
}
