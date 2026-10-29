import type { PageResult } from '../../types';
export interface PageQuery {
  pageNo?: number;
  pageSize?: number;
  keyword?: string;
  status?: 0 | 1;
}
interface RawPageResult<T> {
  records?: T[];
  page_no?: number;
  page_size?: number;
  has_next?: boolean;
  total?: number;
}
export const normalizePageResult = <T>(data: RawPageResult<T>): PageResult<T> => ({
  records: data.records || [],
  pageNo: data.page_no ?? 1,
  pageSize: data.page_size ?? 20,
  hasNext: !!data.has_next,
  total: data.total ?? data.records?.length ?? 0,
});
export const collectAllPages = async <T>(fetchPage: (pageNo: number, pageSize: number) => Promise<PageResult<T>>, pageSize = 200): Promise<T[]> => {
  const records: T[] = [];
  let pageNo = 1;
  let hasNext = true;
  while (hasNext) {
    const page = await fetchPage(pageNo, pageSize);
    records.push(...page.records);
    if (page.records.length === 0 && page.hasNext) {
      throw new Error('分页接口返回空数据但仍标记存在下一页');
    }
    hasNext = page.hasNext;
    pageNo += 1;
  }
  return records;
};
