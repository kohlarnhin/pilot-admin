export const CSV_MAX_BYTES = 1024 * 1024;
export const CSV_MAX_ROWS = 500;
export type CsvEncoding = 'utf-8' | 'gb18030';
export type CsvErrorCode = 'size' | 'rows' | 'separator' | 'quote' | 'syntax' | 'empty' | 'duplicateHeader' | 'unknownHeader' | 'missingHeader';

export class CsvImportError extends Error {
  constructor(readonly code: CsvErrorCode, readonly line = 1, readonly column = '') {
    super(`CSV ${code} at line ${line}${column ? `: ${column}` : ''}`);
    this.name = 'CsvImportError';
  }
}

export function decodeCsvBytes(bytes: Uint8Array, encoding?: CsvEncoding): { text: string; encoding: CsvEncoding; fallback: boolean } {
  if (bytes.byteLength > CSV_MAX_BYTES) throw new CsvImportError('size');
  if (encoding) return { text: new TextDecoder(encoding, { fatal: true }).decode(bytes), encoding, fallback: false };
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'utf-8', fallback: false };
  } catch {
    return { text: new TextDecoder('gb18030', { fatal: true }).decode(bytes), encoding: 'gb18030', fallback: true };
  }
}

/** RFC 4180，行号跟踪物理行；限制在映射时按非空逻辑记录计数。 */
export function parseCsv(source: string): string[][] {
  let text = source.replace(/^\uFEFF/, '');
  let line = 1;
  const firstLine = text.split(/\r?\n/, 1)[0];
  if (/^sep=/i.test(firstLine)) {
    if (firstLine.toLowerCase() !== 'sep=,') throw new CsvImportError('separator');
    text = text.slice(firstLine.length).replace(/^\r?\n/, '');
    line += 1;
  }
  const records: string[][] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  let closed = false;
  let quoteLine = line;
  const endCell = () => { cells.push(cell); cell = ''; closed = false; };
  const endRecord = () => { endCell(); records.push(cells); cells = []; };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') { cell += '"'; index += 1; }
        else { quoted = false; closed = true; }
      } else {
        cell += char;
        if (char === '\n' || (char === '\r' && text[index + 1] !== '\n')) line += 1;
      }
    } else if (char === ',') endCell();
    else if (char === '\r' || char === '\n') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      endRecord();
      line += 1;
    } else if (char === '"' && !cell && !closed) { quoted = true; quoteLine = line; }
    else {
      if (char === '"' || closed) throw new CsvImportError('syntax', line);
      cell += char;
    }
  }
  if (quoted) throw new CsvImportError('quote', quoteLine);
  if (cell || cells.length || closed) endRecord();
  return records;
}

export interface MappedCsvRow { rowNo: number; values: Record<string, string>; columnMismatch: boolean }

export function mapCsvHeaders(records: string[][], required: readonly string[], optional: readonly string[] = []): MappedCsvRow[] {
  const first = records.findIndex((record) => record.some((value) => value.trim()));
  if (first < 0) throw new CsvImportError('empty');
  const headers = records[first].map((header) => header.trim().toLowerCase());
  const seen = new Set<string>();
  for (const header of headers) {
    if (seen.has(header)) throw new CsvImportError('duplicateHeader', first + 1, header);
    if (![...required, ...optional].includes(header)) throw new CsvImportError('unknownHeader', first + 1, header);
    seen.add(header);
  }
  for (const header of required) if (!seen.has(header)) throw new CsvImportError('missingHeader', first + 1, header);
  const rows: MappedCsvRow[] = [];
  for (let index = first + 1; index < records.length; index += 1) {
    const cells = records[index];
    if (cells.every((value) => !value.trim())) continue;
    rows.push({ rowNo: index + 1, values: Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ''])), columnMismatch: cells.length !== headers.length });
    if (rows.length > CSV_MAX_ROWS) throw new CsvImportError('rows');
  }
  if (!rows.length) throw new CsvImportError('empty');
  return rows;
}
