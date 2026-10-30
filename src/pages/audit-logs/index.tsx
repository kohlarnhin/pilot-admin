import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dayjs from 'dayjs';
import { t, useT } from '@/i18n';
import { auditLogService, type AuditFilters } from '@/api/services/auditLogService';
import { AUDIT_MODULES } from '@/audit/catalog';
import { formatAuditAction, formatAuditModule, formatAuditParams, formatAuditReason, formatAuditTarget } from '@/audit/format';
import type { AuditLog, AuditModule, AuditResult } from '@/types';
import { useInfinitePage } from '@/hooks/useInfinitePage';
import { usePermission } from '@/hooks/usePermission';
import { useDataChanged } from '@/hooks/useDataChanged';
import { PageHeader } from '@/components/common/PageHeader';
import { FixedTable } from '@/components/common/FixedTable';
import { EmptyState } from '@/components/common/EmptyState';
import { CopyButton } from '@/components/common/CopyButton';
import { Icon } from '@/components/icon';
import { Card, CardContent, ListToolbar } from '@/ui/card';
import { SearchInput } from '@/ui/input';
import { Select } from '@/ui/select';
import { Button } from '@/ui/button';
import { Alert, Tag } from '@/ui/controls';
import { RowAction, RowActions } from '@/ui/row-action';
import { Drawer } from '@/ui/modal';
import { message } from '@/ui/message';
import type { ColumnsType } from '@/ui/data-table';
import { downloadCsv, toCsv } from '@/utils/csv';

function ResultTag({ result }: { result: AuditResult }) {
  useT();
  return <Tag color={result === 'success' ? 'success' : 'error'} dot>{t(`audit.result.${result}`)}</Tag>;
}

export function AuditLogsPage() {
  const { locale } = useT();
  const canExport = usePermission('audit-log:export');
  const [keyword, setKeyword] = useState('');
  const [queryKeyword, setQueryKeyword] = useState('');
  const [module, setModule] = useState<AuditModule | ''>('');
  const [result, setResult] = useState<AuditResult | ''>('');
  const [detail, setDetail] = useState<AuditLog | null>(null);
  const [loadError, setLoadError] = useState('');
  const [total, setTotal] = useState<number | null>(null);
  const [countAttempt, setCountAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const exportLock = useRef(false);
  const detailTrigger = useRef<HTMLButtonElement | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const filters = useMemo<AuditFilters>(() => ({ keyword: queryKeyword || undefined, module: module || undefined, result: result || undefined }), [queryKeyword, module, result]);
  useEffect(() => {
    const timer = window.setTimeout(() => setQueryKeyword(keyword.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [keyword]);
  const fetchPage = useCallback((pageNo: number, pageSize: number) => auditLogService.getAuditLogs({ ...filters, pageNo, pageSize }).then((response) => response.data), [filters]);
  const page = useInfinitePage<AuditLog>({ fetchPage, scopeKey: JSON.stringify(filters), getKey: (entry) => entry.id, onError: (cause) => setLoadError((cause as Error).message || t('audit.errors.load')) });
  useEffect(() => { setLoadError(''); }, [filters, locale]);
  useEffect(() => {
    let active = true;
    setTotal(null);
    void auditLogService.countAuditLogs(filters).then((count) => { if (active) setTotal(count); })
      .catch((cause: Error) => { if (active) setLoadError(cause.message || t('audit.errors.count')); });
    return () => { active = false; };
  }, [filters, countAttempt, locale]);
  const refresh = () => { setLoadError(''); page.reload(); setCountAttempt((value) => value + 1); };
  useDataChanged((reason) => { if (reason === 'data') refresh(); });
  const search = () => keyword.trim() === queryKeyword ? refresh() : setQueryKeyword(keyword.trim());
  const retry = () => { setLoadError(''); void page.retry(); setCountAttempt((value) => value + 1); };
  const closeDetail = () => {
    setDetail(null);
    // 虚拟行可能已被刷新移除；此时回到搜索框，保持键盘有可见落点。
    window.requestAnimationFrame(() => (detailTrigger.current?.isConnected ? detailTrigger.current : searchInput.current)?.focus({ preventScroll: true }));
  };

  const exportLogs = async () => {
    if (exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    try {
      const records = await auditLogService.exportAuditLogs(filters);
      // 等待期间若切换语言，非 hook t() 也会使用当前语言。
      const fields: { header: string; value: (entry: AuditLog) => unknown }[] = [
        { header: t('audit.fields.time'), value: (entry) => dayjs(entry.create_date).format('YYYY-MM-DD HH:mm:ss') },
        { header: t('audit.fields.actor'), value: (entry) => entry.actor_name },
        { header: t('audit.fields.module'), value: (entry) => formatAuditModule(entry.module) },
        { header: t('audit.fields.action'), value: formatAuditAction },
        { header: t('audit.fields.result'), value: (entry) => t(`audit.result.${entry.result}`) },
        { header: t('audit.fields.actionCode'), value: (entry) => entry.action },
        { header: t('audit.fields.targetType'), value: (entry) => entry.target_type ? formatAuditTarget(entry.target_type) : '' },
        { header: t('audit.fields.targetId'), value: (entry) => entry.target_id },
        { header: t('audit.fields.targetName'), value: (entry) => entry.target_name },
        { header: t('audit.fields.params'), value: (entry) => formatAuditParams(entry.params).map(([key, value]) => `${key}: ${value}`).join('; ') },
        { header: t('audit.fields.reason'), value: (entry) => entry.reason ? formatAuditReason(entry.reason) : '' },
        { header: t('audit.fields.traceId'), value: (entry) => entry.trace_id },
      ];
      downloadCsv(`audit-logs-${dayjs().format('YYYYMMDD-HHmm')}.csv`, toCsv(fields, records));
    } catch (cause) {
      message.error((cause as Error).message || t('audit.errors.export'));
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  };

  const columns = useMemo<ColumnsType<AuditLog>>(() => {
    const dateText = (value: string, seconds = false) => dayjs(value).locale(locale === 'zh-CN' ? 'zh-cn' : 'en').format(seconds ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm');
    return [
      { title: t('audit.fields.time'), key: 'time', width: 168, render: (_, entry) => <time dateTime={entry.create_date} title={dateText(entry.create_date, true)} className="whitespace-nowrap font-mono text-xs text-slate-500">{dateText(entry.create_date)}</time> },
      { title: t('audit.fields.actor'), key: 'actor', width: 144, render: (_, entry) => <span className="block truncate text-13 text-slate-800" title={entry.actor_name}>{entry.actor_name || t('audit.unknownActor')}</span> },
      { title: t('audit.fields.module'), key: 'module', width: 156, render: (_, entry) => <Tag title={formatAuditModule(entry.module)}>{formatAuditModule(entry.module)}</Tag> },
      { title: t('audit.fields.action'), key: 'sentence', render: (_, entry) => <span className="block truncate text-13 text-slate-600" title={formatAuditAction(entry)}>{formatAuditAction(entry)}</span> },
      { title: t('audit.fields.result'), key: 'result', width: 108, render: (_, entry) => <ResultTag result={entry.result} /> },
      { title: t('common.columns.actions'), key: 'detail', width: 88, fixed: 'right', align: 'center', render: (_, entry) => <RowActions><RowAction icon="eye" label={t('audit.viewDetail')} onClick={(event) => { detailTrigger.current = event.currentTarget; setDetail(entry); }} /></RowActions> },
    ];
  }, [locale]);
  const field = (label: string, value: ReactNode, mono = false) => <div className="border-b border-line-soft py-3 last:border-0"><dt className="text-xs text-slate-500">{label}</dt><dd className={`mt-1.5 break-words text-13 text-slate-800 [overflow-wrap:anywhere] ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</dd></div>;

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
    <PageHeader title={t('menu.auditLogs')} description={t('audit.description')} actions={canExport ? <Button loading={exporting} onClick={() => void exportLogs()}><Icon icon="download" size={16} />{t('button.auditLogExport')}</Button> : undefined} />
    {loadError ? <Alert type="error" title={loadError} action={<Button size="xs" onClick={retry}>{t('common.actions.retry')}</Button>} className="mb-4 shrink-0" /> : null}
    <Card className="min-h-0 flex-1">
      <ListToolbar extra={<span aria-live="polite">{t('audit.total', { count: total ?? '—' })}</span>}>
        <SearchInput ref={searchInput} className="w-64" aria-label={t('audit.filters.search')} placeholder={t('audit.filters.search')} value={keyword} onChange={(event) => setKeyword(event.target.value)} onPressEnter={search} />
        <Select className="w-44" placeholder={t('audit.filters.allModules')} aria-label={t('audit.filters.module')} value={module} onChange={(value) => setModule(value as AuditModule | '')} options={[{ value: '', label: t('audit.filters.allModules') }, ...AUDIT_MODULES.map((item) => ({ value: item, label: formatAuditModule(item) }))]} />
        <Select className="w-36" placeholder={t('audit.filters.allResults')} aria-label={t('audit.filters.result')} value={result} onChange={(value) => setResult(value as AuditResult | '')} options={[{ value: '', label: t('audit.filters.allResults') }, { value: 'success', label: t('audit.result.success') }, { value: 'failure', label: t('audit.result.failure') }]} />
      </ListToolbar>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <FixedTable columns={columns} dataSource={page.records} rowKey="id" loading={page.loading} refreshing={page.refreshing} loadingMore={page.loadingMore} hasNext={page.hasNext && !loadError} onLoadMore={page.loadMore} locale={{ emptyText: <EmptyState icon="history" title={loadError ? t('common.errors.loadData') : t('audit.empty.title')} description={loadError ? undefined : t('audit.empty.hint')} /> }} />
      </CardContent>
    </Card>
    <Drawer open={detail !== null} onClose={closeDetail} title={t('audit.detail')} width={560} bodyClassName="px-6 py-2">
      {detail ? <dl>
        {field(t('audit.fields.action'), formatAuditAction(detail))}
        {field(t('audit.fields.time'), dayjs(detail.create_date).format('YYYY-MM-DD HH:mm:ss'), true)}
        {field(t('audit.fields.actor'), detail.actor_name || t('audit.unknownActor'))}
        {field(t('audit.fields.actorId'), detail.actor_id, true)}
        {field(t('audit.fields.module'), formatAuditModule(detail.module))}
        {field(t('audit.fields.actionCode'), detail.action, true)}
        {field(t('audit.fields.result'), <ResultTag result={detail.result} />)}
        {field(t('audit.fields.targetType'), detail.target_type ? formatAuditTarget(detail.target_type) : undefined)}
        {field(t('audit.fields.targetId'), detail.target_id, true)}
        {field(t('audit.fields.targetName'), detail.target_name)}
        {field(t('audit.fields.params'), formatAuditParams(detail.params).length ? <ul className="space-y-1">{formatAuditParams(detail.params).map(([key, value]) => <li key={key}>{key}: {value}</li>)}</ul> : undefined)}
        {field(t('audit.fields.reason'), detail.reason ? formatAuditReason(detail.reason) : undefined)}
        {field(t('audit.fields.traceId'), <span className="flex min-w-0 items-start gap-2"><span className="min-w-0 break-all">{detail.trace_id}</span><CopyButton text={detail.trace_id} /></span>, true)}
        {field(t('audit.fields.id'), detail.id, true)}
      </dl> : null}
    </Drawer>
  </div>;
}
