import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useLocation } from 'react-router';
import { t, useT } from '@/i18n';
import { exampleProjectService, type ProjectFilters } from '@/api/services/exampleProjectService';
import type { ExampleProject, ExampleProjectStatus } from '@/types';
import { useInfinitePage } from '@/hooks/useInfinitePage';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useCan } from '@/hooks/usePermission';
import { Access } from '@/components/common/Access';
import { PageHeader } from '@/components/common/PageHeader';
import { FixedTable } from '@/components/common/FixedTable';
import { EmptyState } from '@/components/common/EmptyState';
import { CopyButton } from '@/components/common/CopyButton';
import { Icon } from '@/components/icon';
import { Card, CardContent, ListToolbar } from '@/ui/card';
import { Button } from '@/ui/button';
import { SearchInput } from '@/ui/input';
import { Select } from '@/ui/select';
import { Alert, Tag } from '@/ui/controls';
import { RowAction, RowActions } from '@/ui/row-action';
import { Modal } from '@/ui/modal';
import { Popconfirm } from '@/ui/popover';
import { message } from '@/ui/message';
import type { ColumnsType } from '@/ui/data-table';
import { downloadCsv, toCsv } from '@/utils/csv';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectImportModal } from './ProjectImportModal';
import { preloadRoute } from '@/routes/routeModules';

export function CrudExamplePage() {
  const { locale } = useT();
  const location = useLocation();
  const can = useCan();
  const canDelete = can('example:delete');
  const canManage = can(['example:update', 'example:delete'], 'any');
  const [keyword, setKeyword] = useState('');
  const [queryKeyword, setQueryKeyword] = useState('');
  const [status, setStatus] = useState<ExampleProjectStatus | ''>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<ExampleProject | null>(null);
  const [loadError, setLoadError] = useState('');
  const [total, setTotal] = useState<number | null>(null);
  const [countAttempt, setCountAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const exportLock = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const deleteLock = useRef(false);
  const filters = useMemo<ProjectFilters>(() => ({ keyword: queryKeyword || undefined, status: status || undefined }), [queryKeyword, status]);
  const scope = JSON.stringify(filters);
  const fetchPage = useCallback((pageNo: number, pageSize: number) => exampleProjectService.getProjects({ ...filters, pageNo, pageSize }).then((response) => response.data), [filters]);
  const page = useInfinitePage<ExampleProject>({ fetchPage, scopeKey: scope, getKey: (project) => project.id, onError: (error) => setLoadError((error as Error).message || t('exampleProjects.errors.load')) });

  useEffect(() => {
    const timer = window.setTimeout(() => setQueryKeyword(keyword.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [keyword]);
  // 模板：查询变化清空选择，追加与语言刷新保留 ID 选择。
  useEffect(() => { setSelectedIds([]); }, [scope]);
  useEffect(() => { setLoadError(''); }, [scope, locale]);
  useEffect(() => {
    let active = true;
    setTotal(null);
    void exampleProjectService.countProjects(filters).then((count) => { if (active) setTotal(count); })
      .catch((error: Error) => { if (active) setLoadError(error.message || t('exampleProjects.errors.count')); });
    return () => { active = false; };
  }, [filters, countAttempt, locale]);
  const { reload } = page;
  const refresh = useCallback(() => { setLoadError(''); reload(); setCountAttempt((value) => value + 1); }, [reload]);
  useDataChanged((reason) => { if (reason === 'data') refresh(); });
  const search = () => keyword.trim() === queryKeyword ? refresh() : setQueryKeyword(keyword.trim());
  const retry = () => { setLoadError(''); void page.retry(); setCountAttempt((value) => value + 1); };

  const remove = useCallback(async (ids: string[], batch: boolean) => {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    try {
      if (batch) await exampleProjectService.batchDeleteProjects(ids);
      else await exampleProjectService.deleteProject(ids[0]);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      message.success(t('exampleProjects.toast.deleted'));
      refresh();
    } catch (error) {
      message.error((error as Error).message || t('common.toast.actionFailed'));
      throw error;
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  }, [refresh]);
  const batchDelete = () => {
    const ids = [...selectedIds];
    Modal.confirm({
      title: t('exampleProjects.actions.batchDelete'),
      content: t('exampleProjects.batchDialog.content', { count: ids.length }),
      okText: t('common.actions.confirmDelete'),
      okType: 'danger',
      onOk: () => remove(ids, true),
    });
  };
  const exportProjects = async () => {
    if (exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    try {
      const records = await exampleProjectService.exportProjects(filters);
      downloadCsv(`projects-${dayjs().format('YYYYMMDD-HHmm')}.csv`, toCsv([
        { header: t('exampleProjects.fields.name'), value: (project: ExampleProject) => project.name },
        { header: t('exampleProjects.fields.code'), value: (project) => project.code },
        { header: t('exampleProjects.fields.owner'), value: (project) => project.owner },
        { header: t('common.columns.status'), value: (project) => t(`exampleProjects.status.${project.status}`) },
        { header: t('exampleProjects.fields.description'), value: (project) => project.description },
        { header: t('common.columns.updated'), value: (project) => dayjs(project.last_update_date).format('YYYY-MM-DD HH:mm:ss') },
      ], records));
    } catch (error) {
      message.error((error as Error).message || t('exampleProjects.errors.export'));
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  };
  const columns = useMemo<ColumnsType<ExampleProject>>(() => {
    const columns: ColumnsType<ExampleProject> = [
    { title: t('exampleProjects.fields.name'), key: 'name', render: (_, project) => <div className="min-w-0">
      <Link to={`/examples/crud/${encodeURIComponent(project.id)}`} state={{ listSearch: location.search }} onPointerEnter={() => void preloadRoute(`/examples/crud/${encodeURIComponent(project.id)}`)} onFocus={() => void preloadRoute(`/examples/crud/${encodeURIComponent(project.id)}`)} className="block truncate rounded text-13 font-medium text-slate-700 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" title={project.name}>{project.name}</Link>
      <div className="flex min-w-0 items-center gap-1"><span className="truncate font-mono text-[11px] text-slate-500" title={project.code}>{project.code}</span><CopyButton text={project.code} /></div>
    </div> },
    { title: t('exampleProjects.fields.owner'), key: 'owner', width: '25%', render: (_, project) => <span className="block truncate text-13 text-slate-600" title={project.owner}>{project.owner}</span> },
    { title: t('common.columns.status'), key: 'status', width: 120, render: (_, project) => <Tag color={project.status === 'active' ? 'success' : project.status === 'paused' ? 'warning' : undefined} dot={project.status !== 'archived'}>{t(`exampleProjects.status.${project.status}`)}</Tag> },
    { title: t('common.columns.updated'), key: 'updated', width: 168, render: (_, project) => <time className="whitespace-nowrap font-mono text-xs text-slate-500" dateTime={project.last_update_date} title={dayjs(project.last_update_date).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(project.last_update_date).locale(locale === 'zh-CN' ? 'zh-cn' : 'en').format('YYYY-MM-DD HH:mm')}</time> },
  ];
  // 模板：仅在有编辑或删除权限时显示操作列，避免只读列表出现空列。
  if (canManage) columns.push({ title: t('common.columns.actions'), key: 'actions', width: 112, fixed: 'right', align: 'center', render: (_, project) => <RowActions>
      <Access permission="example:update"><RowAction icon="pencil" label={t('button.exampleUpdate')} onClick={() => { setEditing(project); setFormOpen(true); }} /></Access>
      <Access permission="example:delete"><Popconfirm title={t('button.exampleDelete')} description={t('exampleProjects.deleteDialog.content', { name: project.name })} okType="danger" okText={t('common.actions.confirmDelete')} onConfirm={() => remove([project.id], false)}>
        <RowAction icon="trash-2" label={t('button.exampleDelete')} tone="danger" disabled={deleting} />
      </Popconfirm></Access>
    </RowActions> });
    return columns;
  }, [locale, location.search, canManage, deleting, remove]);
  const rowSelection = useMemo(() => canDelete ? {
    selectedRowKeys: selectedIds,
    onChange: (keys: (string | number)[]) => setSelectedIds(keys.map(String)),
    getCheckboxProps: () => ({ disabled: deleting }),
  } : undefined, [canDelete, selectedIds, deleting]);

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
    <PageHeader title={t('menu.crudExample')} description={t('exampleProjects.description')} actions={<>
      <Access permission="example:create"><Button onClick={() => { setEditing(null); setFormOpen(true); }}><Icon icon="plus" size={16} />{t('button.exampleCreate')}</Button></Access>
      <Access permission="example:create"><Button onClick={() => setImportOpen(true)}><Icon icon="upload" size={16} />{t('exampleProjects.import.title')}</Button></Access>
      <Button loading={exporting} onClick={() => void exportProjects()}><Icon icon="download" size={16} />{t('exampleProjects.actions.export')}</Button>
    </>} />
    {loadError ? <Alert type="error" title={loadError} action={<Button size="xs" onClick={retry}>{t('common.actions.retry')}</Button>} className="mb-4 shrink-0" /> : null}
    <Card className="min-h-0 flex-1">
      <ListToolbar extra={<span aria-live="polite">{t('exampleProjects.total', { count: total ?? '—' })}</span>}>
        <SearchInput ref={searchInput} className="w-64" aria-label={t('exampleProjects.filters.search')} placeholder={t('exampleProjects.filters.search')} value={keyword} onChange={(event) => setKeyword(event.target.value)} onPressEnter={search} />
        <Select className="w-40" aria-label={t('common.columns.status')} placeholder={t('exampleProjects.filters.allStatuses')} value={status} onChange={(value) => setStatus(value as ExampleProjectStatus | '')}
          options={[{ value: '', label: t('exampleProjects.filters.allStatuses') }, ...(['active', 'paused', 'archived'] as const).map((value) => ({ value, label: t(`exampleProjects.status.${value}`) }))]} />
      </ListToolbar>
      {canDelete && selectedIds.length > 0 ? <div className="flex shrink-0 items-center gap-3 border-b border-line-soft bg-slate-50/60 px-6 py-2" data-slot="selection-bar">
        <span className="text-xs text-slate-600" aria-live="polite">{t('exampleProjects.selection.count', { count: selectedIds.length })}</span>
        <Button size="xs" loading={deleting} onClick={batchDelete}>{t('exampleProjects.actions.batchDelete')}</Button>
        <Button size="xs" variant="ghost" disabled={deleting} onClick={() => setSelectedIds([])}>{t('exampleProjects.selection.clear')}</Button>
      </div> : null}
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <FixedTable columns={columns} dataSource={page.records} totalCount={total ?? undefined} rowKey="id" loading={page.loading} refreshing={page.refreshing} loadingMore={page.loadingMore} hasNext={page.hasNext && !loadError} onLoadMore={page.loadMore}
          rowSelection={rowSelection}
          locale={{ emptyText: <EmptyState icon="package" title={loadError ? t('common.errors.loadData') : t('exampleProjects.empty.title')} description={loadError ? undefined : t('exampleProjects.empty.hint')} /> }} />
      </CardContent>
    </Card>
    {formOpen ? <ProjectFormModal returnFocusRef={searchInput} project={editing} onClose={() => setFormOpen(false)} onSaved={refresh} /> : null}
    {importOpen ? <ProjectImportModal onClose={() => setImportOpen(false)} /> : null}
  </div>;
}
