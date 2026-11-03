import { useEffect, useMemo, useRef, useState } from 'react';
import { t, useT } from '@/i18n';
import { ApiRequestError } from '@/api/errors';
import { exampleProjectService, type ProjectImportResult } from '@/api/services/exampleProjectService';
import { projectIssueFromCode } from '@/api/services/exampleProjectRules';
import { triggerDataChangeSideEffects } from '@/api/services/agentEvents';
import { createId } from '@/utils/id';
import { CsvImportError, CSV_MAX_BYTES, decodeCsvBytes, type CsvEncoding } from '@/utils/csvImport';
import { downloadCsv, toCsv } from '@/utils/csv';
import { Button } from '@/ui/button';
import { Alert } from '@/ui/controls';
import { DataTable, type ColumnsType } from '@/ui/data-table';
import { FileDropZone } from '@/ui/file-drop-zone';
import { Modal } from '@/ui/modal';
import { Select } from '@/ui/select';
import { previewProjectCsv, projectImportColumns, runProjectImport, type ProjectPreviewRow } from './projectImport';

type Phase = 'empty' | 'reading' | 'invalid' | 'parsed' | 'importing' | 'complete' | 'interrupted' | 'terminal';

export function ProjectImportModal({ onClose }: { onClose: () => void }) {
  useT();
  const [phase, setPhase] = useState<Phase>('empty');
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [text, setText] = useState('');
  const [encoding, setEncoding] = useState<CsvEncoding>('utf-8');
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<ProjectPreviewRow[]>([]);
  const [results, setResults] = useState<Map<number, ProjectImportResult>>(() => new Map());
  const [importId, setImportId] = useState(createId);
  const generation = useRef(0);
  const locked = useRef(false);
  const started = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; };
  }, []);

  const busy = phase === 'importing';
  const editable = !started.current && !busy;
  const validRows = useMemo(() => rows.filter((row) => !row.issue), [rows]);
  const skipped = rows.length - validRows.length;
  const created = [...results.values()].filter((row) => row.status === 'created').length;
  const failed = results.size - created;
  const processed = skipped + results.size;
  const raw = useMemo(() => {
    const lines = text.split(/\r?\n/);
    const preview = lines.slice(0, 200).join('\n');
    return { text: preview.slice(0, 20000), truncated: lines.length > 200 || preview.length > 20000 };
  }, [text]);

  const decodeAndParse = (data: Uint8Array, override?: CsvEncoding) => {
    setText('');
    setRows([]);
    setError('');
    setFallback(false);
    try {
      const decoded = decodeCsvBytes(data, override);
      setText(decoded.text);
      setEncoding(decoded.encoding);
      setFallback(decoded.fallback);
      setRows(previewProjectCsv(decoded.text));
      setPhase('parsed');
    } catch (cause) {
      setError(cause instanceof CsvImportError
        ? t(`exampleProjects.import.errors.${cause.code}`, { line: cause.line, column: cause.column })
        : t('exampleProjects.import.errors.encoding'));
      setPhase('invalid');
    }
  };
  const selectFile = async (files: File[]) => {
    if (!editable) return;
    const selected = files[0];
    if (!selected) return;
    const token = ++generation.current;
    setFile({ name: selected.name, size: selected.size });
    setBytes(null);
    setText('');
    setRows([]);
    setResults(new Map());
    setError('');
    setFallback(false);
    setEncoding('utf-8');
    setImportId(createId());
    setPhase('reading');
    if (files.length !== 1 || !/\.csv$/i.test(selected.name) || selected.size > CSV_MAX_BYTES) {
      setError(t(selected.size > CSV_MAX_BYTES ? 'exampleProjects.import.errors.size' : 'exampleProjects.import.errors.file'));
      setPhase('invalid');
      return;
    }
    try {
      const data = new Uint8Array(await selected.arrayBuffer());
      if (token !== generation.current || !mounted.current) return;
      setBytes(data);
      decodeAndParse(data);
    } catch {
      if (token !== generation.current || !mounted.current) return;
      setError(t('exampleProjects.import.errors.read'));
      setPhase('invalid');
    }
  };

  const run = async () => {
    if (locked.current || !validRows.length || !['parsed', 'interrupted'].includes(phase)) return;
    locked.current = true;
    started.current = true;
    setError('');
    setPhase('importing');
    try {
      await runProjectImport(exampleProjectService, {
        importId,
        rows: validRows,
        known: results,
        reconcile: phase === 'interrupted',
        onResults: (next) => { if (mounted.current) setResults(next); },
      });
      if (mounted.current) setPhase('complete');
    } catch (cause) {
      if (!mounted.current) return;
      const terminal = cause instanceof ApiRequestError && (cause.status === 401 || cause.status === 403 || cause.code === 40990);
      setError(cause instanceof ApiRequestError ? cause.message : t('exampleProjects.import.errors.connection'));
      setPhase(terminal ? 'terminal' : 'interrupted');
    } finally {
      locked.current = false;
    }
  };

  const reason = (row: ProjectPreviewRow): string => {
    if (row.issue === 'columns') return t('exampleProjects.import.errors.columns');
    if (row.issue === 'duplicate') return t('exampleProjects.import.errors.duplicate');
    if (row.issue) return t(row.issue.message);
    const outcome = results.get(row.rowNo);
    if (outcome?.status === 'failed') {
      const issue = projectIssueFromCode(outcome.errorCode);
      return issue ? t(issue.message) : outcome.message || t('exampleProjects.import.failed');
    }
    return '';
  };
  const failedRows = rows.filter((row) => row.issue || results.get(row.rowNo)?.status === 'failed');
  const downloadFailures = () => downloadCsv('projects-failed.csv', toCsv([
    ...projectImportColumns.map((column) => ({ header: column.header, value: (row: ProjectPreviewRow) => column.value(row.values) })),
    { header: 'reason', value: reason },
  ], failedRows));
  const close = () => {
    if (locked.current) return;
    generation.current += 1;
    if (started.current) triggerDataChangeSideEffects();
    onClose();
  };
  const columns: ColumnsType<ProjectPreviewRow> = [
    { key: 'rowNo', title: t('exampleProjects.import.rowNo'), width: 84, render: (_, row) => <span className="font-mono text-xs">{row.rowNo}</span> },
    ...(['name', 'code', 'owner', 'status'] as const).map((field) => ({
      key: field,
      title: t(field === 'status' ? 'common.columns.status' : `exampleProjects.fields.${field}`),
      minWidth: field === 'code' ? 82 : 70,
      render: (_: unknown, row: ProjectPreviewRow) => <span className={`block truncate ${field === 'code' || field === 'status' ? 'font-mono text-[11px]' : ''}`} title={row.values[field]}>{row.values[field] || '—'}</span>,
    })),
    { key: 'validity', title: t('exampleProjects.import.validity'), minWidth: 160, render: (_, row) => {
      const failure = reason(row);
      const key = row.issue ? 'skipped' : results.get(row.rowNo)?.status || 'valid';
      return <span className={`block truncate text-xs ${failure ? 'text-red-600' : key === 'created' ? 'text-emerald-600' : 'text-slate-500'}`} title={failure || t(`exampleProjects.import.${key}`)}>{failure || t(`exampleProjects.import.${key}`)}</span>;
    } },
  ];
  const stateLabel = t(`exampleProjects.import.states.${phase}`);

  const progress = <div className="flex h-[88px] shrink-0 flex-col justify-center gap-1.5" aria-live="polite" aria-busy={busy} data-slot="import-status">
      <div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-slate-700">{stateLabel}</span><span className="tabular-nums text-slate-500">{t('exampleProjects.import.progress', { processed: started.current ? processed : 0, total: rows.length, created, skipped: started.current ? skipped : 0, failed })}</span></div>
      <div role="progressbar" aria-label={stateLabel} aria-valuemin={0} aria-valuemax={rows.length || 1} aria-valuenow={started.current ? processed : 0} className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-[width] duration-300 ${phase === 'complete' ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${rows.length && started.current ? processed / rows.length * 100 : 0}%` }} />
      </div>
      <div className="h-9 overflow-y-auto">
        {error ? <Alert type="error" title={error} className="!px-2 !py-1" /> : <p className="text-[11px] leading-5 text-slate-500">{t(phase === 'complete' ? 'exampleProjects.import.completedHint' : phase === 'parsed' ? 'exampleProjects.import.validHint' : 'exampleProjects.import.recoveryHint')}</p>}
      </div>
    </div>;

  return <Modal open title={t('exampleProjects.import.title')} icon="upload" width={1160} onCancel={close}
    closable={!busy} keyboard={!busy} maskClosable={!busy} bodyClassName="space-y-3" styles={{ body: { height: '60vh', flex: '0 1 auto' } }}
    footer={<div className="flex w-full min-w-0 flex-col gap-3">
      {progress}
      <div className="flex items-center justify-end gap-2.5">
      {failedRows.length ? <Button className="mr-auto" disabled={busy} onClick={downloadFailures}>{t('exampleProjects.import.downloadFailed')}</Button> : null}
      <Button disabled={busy} onClick={close}>{t(phase === 'complete' ? 'exampleProjects.import.done' : 'common.actions.close')}</Button>
      {phase !== 'complete' && phase !== 'terminal' ? <Button loading={busy} disabled={!validRows.length || phase === 'reading' || phase === 'invalid'} onClick={() => void run()}>{t(phase === 'interrupted' ? 'exampleProjects.import.continue' : 'exampleProjects.import.start')}</Button> : null}
      </div>
    </div>}>
    <div className="shrink-0 rounded-xl border border-line bg-slate-50/60 px-3 py-2 text-xs leading-5 text-slate-600">
      {t('exampleProjects.import.notice')} <button type="button" className="rounded font-medium text-slate-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={() => downloadCsv('projects-template.csv', toCsv(projectImportColumns, []))}>{t('exampleProjects.import.template')}</button>
      <p className="text-[11px] text-slate-500">{t('exampleProjects.import.roundTrip')}</p>
    </div>
    <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.8fr)] gap-4">
      <section className="flex min-h-0 min-w-0 flex-col gap-2" aria-label={t('exampleProjects.import.filePreview')}>
        <FileDropZone accept=".csv" disabled={!editable} loading={phase === 'reading'} onFiles={(files) => void selectFile(files)}
          title={t('exampleProjects.import.selectFile')} hint={t('exampleProjects.import.fileHint')} />
        <div className="flex h-9 shrink-0 min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-500" title={file?.name}>{file ? `${file.name} · ${file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`}` : t('exampleProjects.import.noFile')}</span>
          <Select className="w-32 shrink-0" size="small" aria-label={t('exampleProjects.import.encoding')} value={encoding} disabled={!bytes || !editable || phase === 'reading'}
            options={[{ value: 'utf-8', label: 'UTF-8' }, { value: 'gb18030', label: 'GB18030' }]} onChange={(value: CsvEncoding) => { if (bytes) { setEncoding(value); decodeAndParse(bytes, value); } }} />
        </div>
        <div className="flex h-[360px] min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-line">
          <h2 id="csv-raw-title" className="shrink-0 border-b border-line-soft px-3 py-2 text-xs font-medium text-slate-600">{t('exampleProjects.import.rawPreview')}</h2>
          <pre tabIndex={0} role="region" aria-labelledby="csv-raw-title" className="min-h-0 flex-1 overflow-auto bg-slate-50/50 p-3 font-mono text-[11px] leading-5 text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">{raw.text || t(phase === 'reading' ? 'exampleProjects.import.states.reading' : 'exampleProjects.import.previewPlaceholder')}</pre>
          <p className="shrink-0 border-t border-line-soft px-3 py-1 text-[11px] text-slate-500">{t(raw.truncated ? 'exampleProjects.import.truncated' : fallback ? 'exampleProjects.import.detectedFallback' : 'exampleProjects.import.localOnly')}</p>
        </div>
      </section>
      <section className="flex h-[360px] min-h-0 min-w-0 flex-col self-start overflow-hidden rounded-xl border border-line" aria-label={t('exampleProjects.import.parsedPreview')} aria-busy={phase === 'reading'}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line-soft px-3 py-2 text-xs">
          <h2 className="font-medium text-slate-700">{t('exampleProjects.import.parsedPreview')}</h2>
          <span className="text-slate-500" aria-live="polite">{t('exampleProjects.import.counts', { total: rows.length, valid: validRows.length, invalid: skipped })}</span>
        </div>
        <DataTable columns={columns} dataSource={rows} rowKey="rowNo" fill virtual estimatedRowHeight={45} size="small" loading={phase === 'reading'}
          locale={{ emptyText: <p className="p-6 text-center text-xs text-slate-500">{t('exampleProjects.import.previewPlaceholder')}</p> }} />
      </section>
    </div>
  </Modal>;
}
