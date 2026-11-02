import { describe, expect, it } from 'vitest';
import { toCsv } from '@/utils/csv';

const columns = [{ header: 'Value', value: (row: unknown) => row }];

describe('toCsv', () => {
  it('emits a UTF-8 BOM, CRLF record separators and a header even for no records', () => {
    const csv = toCsv(columns, []);
    expect(csv).toBe('\uFEFF"Value"\r\n');
    expect([...new TextEncoder().encode(csv).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it('quotes commas, doubles quotes and retains embedded newlines', () => {
    expect(toCsv(columns, ['张三,Alice', 'say "hello"', 'line 1\nline 2', 'line 1\r\nline 2']))
      .toBe('\uFEFF"Value"\r\n"张三,Alice"\r\n"say ""hello"""\r\n"line 1\nline 2"\r\n"line 1\r\nline 2"\r\n');
  });

  it.each(['=SUM(A1:A2)', '+cmd', '-1', '@SUM(A1)', '\tvalue', '\rvalue', '  =1', ' \tplain'])('escapes a formula prefix in %j', (value) => {
    expect(toCsv(columns, [value])).toBe(`\uFEFF"Value"\r\n"'${value}"\r\n`);
  });

  it('escapes headers too, without changing safe text, nulls or falsy scalars', () => {
    expect(toCsv([{ header: '=Header', value: (row: unknown) => row }], ['  safe', 'x=1', '', null, undefined, 0, false]))
      .toBe('\uFEFF"\'=Header"\r\n"  safe"\r\n"x=1"\r\n""\r\n""\r\n""\r\n"0"\r\n"false"\r\n');
  });
});
