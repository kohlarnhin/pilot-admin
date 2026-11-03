import { validateProjectInput, type ProjectInput, type ProjectIssue } from '@/api/services/exampleProjectRules';
import type { ProjectImportResult, ProjectImportRow, ProjectImportStatus } from '@/api/services/exampleProjectService';
import { mapCsvHeaders, parseCsv } from '@/utils/csvImport';
import type { CsvColumn } from '@/utils/csv';

export const PROJECT_IMPORT_HEADERS = ['name', 'code', 'owner', 'status', 'description'] as const;
export const projectImportColumns: CsvColumn<ProjectInput>[] = PROJECT_IMPORT_HEADERS.map((header) => ({ header, value: (row) => row[header] }));
export interface ProjectPreviewRow extends ProjectImportRow {
  issue?: ProjectIssue | 'columns' | 'duplicate';
}

export function previewProjectCsv(text: string): ProjectPreviewRow[] {
  const codes = new Set<string>();
  return mapCsvHeaders(parseCsv(text), PROJECT_IMPORT_HEADERS.slice(0, 4), ['description']).map((row) => {
    const values: ProjectInput = {
      name: row.values.name,
      code: row.values.code,
      owner: row.values.owner,
      status: row.values.status as ProjectInput['status'],
      description: row.values.description || '',
    };
    const issue = row.columnMismatch ? 'columns' : validateProjectInput(values) || (codes.has(values.code) ? 'duplicate' : undefined);
    if (!issue) codes.add(values.code);
    return { rowNo: row.rowNo, values, issue };
  });
}

interface ImportService {
  importProjects: (input: { importId: string; rows: ProjectImportRow[] }) => Promise<{ data: ProjectImportResult[] }>;
  getImportStatus: (importId: string) => Promise<{ data: ProjectImportStatus[] }>;
}

/** 续传先对账。未知响应可能已经提交，只发送无回执的行，保留此前逐行结果。 */
export async function runProjectImport(service: ImportService, options: {
  importId: string;
  rows: ProjectImportRow[];
  known: Map<number, ProjectImportResult>;
  reconcile: boolean;
  onResults: (results: Map<number, ProjectImportResult>) => void;
}): Promise<void> {
  let results = new Map(options.known);
  if (options.reconcile) {
    const status = await service.getImportStatus(options.importId);
    for (const receipt of status.data) {
      if (!results.has(receipt.rowNo)) results.set(receipt.rowNo, { ...receipt, message: '' });
    }
    options.onResults(new Map(results));
  }
  const pending = options.rows.filter((row) => !results.has(row.rowNo));
  for (let start = 0; start < pending.length; start += 25) {
    const chunk = await service.importProjects({ importId: options.importId, rows: pending.slice(start, start + 25) });
    results = new Map(results);
    for (const row of chunk.data) results.set(row.rowNo, row);
    options.onResults(results);
  }
}
