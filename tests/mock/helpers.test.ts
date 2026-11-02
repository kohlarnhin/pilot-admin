import { describe, expect, it } from 'vitest';
import { pageResult } from '@/mock/helpers';

describe('pageResult', () => {
  const records = Array.from({ length: 45 }, (_, id) => ({ id }));

  it('defaults to page one with 20 records and the full total', () => {
    expect(pageResult(records, {})).toEqual({
      records: records.slice(0, 20), pageNo: 1, pageSize: 20, total: 45, hasNext: true,
    });
  });

  it.each([
    [0, 0, 1, 1],
    [-3, -2, 1, 1],
    [2.9, 3.9, 2, 3],
    [1, 999, 1, 200],
  ])('bounds pageNo %s and pageSize %s', (pageNo, pageSize, expectedPage, expectedSize) => {
    const result = pageResult(records, { pageNo, pageSize });
    expect(result.pageNo).toBe(expectedPage);
    expect(result.pageSize).toBe(expectedSize);
    expect(result.total).toBe(45);
    expect(result.records).toEqual(records.slice((expectedPage - 1) * expectedSize, expectedPage * expectedSize));
    expect(result.hasNext).toBe(expectedPage * expectedSize < 45);
  });

  it('returns the final partial page and no next page past the end', () => {
    expect(pageResult(records, { pageNo: 3, pageSize: 20 })).toEqual({
      records: records.slice(40), pageNo: 3, pageSize: 20, total: 45, hasNext: false,
    });
    expect(pageResult(records, { pageNo: 4, pageSize: 20 })).toEqual({
      records: [], pageNo: 4, pageSize: 20, total: 45, hasNext: false,
    });
    expect(pageResult(records.slice(0, 40), { pageNo: 2, pageSize: 20 }).hasNext).toBe(false);
  });

  it('returns an empty page without changing the input records', () => {
    expect(pageResult([], {})).toEqual({ records: [], pageNo: 1, pageSize: 20, total: 0, hasNext: false });
    const original = structuredClone(records);
    pageResult(records, { pageNo: 2, pageSize: 5 });
    expect(records).toEqual(original);
  });
});
