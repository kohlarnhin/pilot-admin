import { describe, expect, it } from 'vitest';
import { CSV_MAX_BYTES, CsvImportError, decodeCsvBytes, mapCsvHeaders, parseCsv } from '@/utils/csvImport';

describe('CSV byte decoding', () => {
  it.each(['测试', '\uFEFF测试'])('strictly decodes UTF-8 with optional BOM: %s', (text) => {
    expect(decodeCsvBytes(new TextEncoder().encode(text))).toEqual({ text: '测试', encoding: 'utf-8', fallback: false });
  });
  it('falls back on real GB18030 bytes and honors explicit overrides', () => {
    const bytes = new Uint8Array([0xb2, 0xe2, 0xca, 0xd4]);
    expect(decodeCsvBytes(bytes)).toEqual({ text: '测试', encoding: 'gb18030', fallback: true });
    expect(decodeCsvBytes(bytes, 'gb18030')).toEqual({ text: '测试', encoding: 'gb18030', fallback: false });
    expect(() => decodeCsvBytes(bytes, 'utf-8')).toThrow();
    expect(decodeCsvBytes(new TextEncoder().encode('ASCII'), 'gb18030').encoding).toBe('gb18030');
  });
  it('rejects files above 1 MB before decoding', () => {
    expect(() => decodeCsvBytes(new Uint8Array(CSV_MAX_BYTES + 1))).toThrow(expect.objectContaining({ code: 'size' }));
  });
});

describe('RFC 4180 parser', () => {
  it.each([
    ['a,b\nc,d', [['a', 'b'], ['c', 'd']]],
    ['a,b\r\nc,d\r\n', [['a', 'b'], ['c', 'd']]],
    ['a,b\nc,d\n', [['a', 'b'], ['c', 'd']]],
    ['"a,b","a""b"\n"c\nd","e\r\nf"', [['a,b', 'a"b'], ['c\nd', 'e\r\nf']]],
    ['a,,\n,,\n', [['a', '', ''], ['', '', '']]],
    ['"",a,', [['', 'a', '']]],
    ['', []],
    ['\uFEFFsep=,\r\na,b\r\n', [['a', 'b']]],
    ['sep=,\na,b', [['a', 'b']]],
  ] as const)('parses %j', (input, expected) => {
    expect(parseCsv(input)).toEqual(expected);
  });
  it('reports the starting physical line of an unterminated quote', () => {
    expect(() => parseCsv('sep=,\r\na,b\r\n"line\nbreak')).toThrow(expect.objectContaining({ code: 'quote', line: 3 }));
  });
  it.each(['sep=;\na;b', 'sep=\t\na\tb'])('rejects other sep directives', (text) => {
    expect(() => parseCsv(text)).toThrow(expect.objectContaining({ code: 'separator' }));
  });
  it.each(['a"b,c', '"a" x,b'])('rejects malformed quoting: %s', (text) => {
    expect(() => parseCsv(text)).toThrow(CsvImportError);
  });
});

describe('CSV header mapping', () => {
  const required = ['name', 'code', 'owner', 'status'];
  const map = (text: string) => mapCsvHeaders(parseCsv(text), required, ['description']);
  it('maps reordered, trimmed, case-insensitive headers and skips blank records', () => {
    expect(map('\n STATUS ,owner,CODE,Name\nactive,Alice,AB,Name\n,,,\n')).toEqual([
      { rowNo: 3, values: { status: 'active', owner: 'Alice', code: 'AB', name: 'Name' }, columnMismatch: false },
    ]);
  });
  it.each([
    ['name,code,owner,status, Name\nx,A,A,active,x', 'duplicateHeader'],
    ['name,code,owner,status,extra\nx,A,A,active,x', 'unknownHeader'],
    ['name,code,status\nx,A,active', 'missingHeader'],
    ['name,code,owner,status\n,,,\n', 'empty'],
  ])('rejects invalid headers / empty files', (text, code) => {
    expect(() => map(text)).toThrow(expect.objectContaining({ code }));
  });
  it('keeps uneven records for per-row validation', () => {
    expect(map('name,code,owner,status\nName,AB,Alice,active,extra')[0].columnMismatch).toBe(true);
  });
  it('counts 500 logical nonblank records, including quoted newlines', () => {
    const body = Array.from({ length: 500 }, (_, i) => `"Name\n${i}",A${i},Alice,active`).join('\n\n');
    const text = `name,code,owner,status\n${body}\n`;
    expect(map(text)).toHaveLength(500);
    expect(() => map(`${text}Extra,EXTRA,Alice,active`)).toThrow(expect.objectContaining({ code: 'rows' }));
  });
});
