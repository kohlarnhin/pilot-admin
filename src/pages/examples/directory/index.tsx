import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import { t, useT } from '@/i18n';
import { exampleDirectoryService, type DirectoryDocument, type DirectoryFilters, type DirectoryFolder } from '@/api/services/exampleDirectoryService';
import { useInfinitePage } from '@/hooks/useInfinitePage';
import { useDataChanged } from '@/hooks/useDataChanged';
import { PageHeader } from '@/components/common/PageHeader';
import { FixedTable } from '@/components/common/FixedTable';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon, type IconName } from '@/components/icon';
import { Card, CardContent } from '@/ui/card';
import { SearchInput } from '@/ui/input';
import { Alert } from '@/ui/controls';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import type { ColumnsType } from '@/ui/data-table';
import { formatBytes } from '@/utils/formatBytes';
import { FolderTree } from './FolderTree';
import { selectedFolderPath } from './tree';

const documentIcons: Record<DirectoryDocument['type'], IconName> = {
  pdf: 'file-text', docx: 'file-text', xlsx: 'layout-grid', pptx: 'monitor', image: 'image', other: 'file-code',
};

export function DirectoryExamplePage() {
  const { locale } = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const [folders, setFolders] = useState<DirectoryFolder[] | null>(null);
  const [treeError, setTreeError] = useState('');
  const [treeAttempt, setTreeAttempt] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [queryKeyword, setQueryKeyword] = useState('');
  const [countAttempt, setCountAttempt] = useState(0);
  const [loadError, setLoadError] = useState({ scope: '', message: '' });
  const [count, setCount] = useState<{ scope: string; value?: number; error?: string }>({ scope: '' });
  const requestedId = searchParams.get('folder') ?? undefined;
  const unknownFolder = folders !== null && requestedId !== undefined && !folders.some((folder) => folder.id === requestedId);
  const folderId = unknownFolder ? undefined : requestedId;
  const path = useMemo(() => selectedFolderPath(folders ?? [], folderId), [folders, folderId]);
  const selected = path.at(-1);
  const filters = useMemo<DirectoryFilters>(() => ({ folderId, keyword: queryKeyword || undefined }), [folderId, queryKeyword]);
  const scopeKey = JSON.stringify(filters);
  const resultScope = `${scopeKey}:${locale}`;
  const fetchPage = useCallback((pageNo: number, pageSize: number) => exampleDirectoryService.getDocuments({ ...filters, pageNo, pageSize }).then((result) => result.data), [filters]);
  const page = useInfinitePage<DirectoryDocument>({
    fetchPage,
    scopeKey,
    pageSize: 20,
    getKey: (document) => document.id,
    onError: (error) => setLoadError({ scope: resultScope, message: (error as Error).message || t('directory.errors.documents') }),
  });
  const tableError = (loadError.scope === resultScope ? loadError.message : '') || (count.scope === resultScope ? count.error : '');
  const total = count.scope === resultScope ? count.value : undefined;

  useEffect(() => { setLoadError({ scope: resultScope, message: '' }); }, [resultScope]);
  useEffect(() => {
    const timer = window.setTimeout(() => setQueryKeyword(keyword.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [keyword]);
  useEffect(() => {
    let active = true;
    setTreeError('');
    void exampleDirectoryService.getFolders().then((result) => { if (active) setFolders(result.data); })
      .catch((error: Error) => { if (active) setTreeError(error.message || t('directory.errors.tree')); });
    return () => { active = false; };
  }, [treeAttempt, locale]);
  useEffect(() => {
    let active = true;
    setCount({ scope: resultScope });
    void exampleDirectoryService.countDocuments(filters).then((value) => { if (active) setCount({ scope: resultScope, value }); })
      .catch((error: Error) => { if (active) setCount({ scope: resultScope, error: error.message || t('directory.errors.count') }); });
    return () => { active = false; };
  }, [filters, resultScope, countAttempt]);
  const refresh = () => { setLoadError({ scope: resultScope, message: '' }); page.reload(); setCountAttempt((value) => value + 1); };
  useDataChanged((reason) => { if (reason === 'data') { refresh(); setTreeAttempt((value) => value + 1); } });
  const selectFolder = (id?: string) => setSearchParams((current) => {
    const next = new URLSearchParams(current);
    if (id) next.set('folder', id);
    else next.delete('folder');
    return next;
  });
  const retryDocuments = () => { setLoadError({ scope: resultScope, message: '' }); void page.retry(); setCountAttempt((value) => value + 1); };
  const search = () => keyword.trim() === queryKeyword ? refresh() : setQueryKeyword(keyword.trim());
  const columns: ColumnsType<DirectoryDocument> = [
    { title: t('directory.fields.name'), key: 'name', width: '40%', minWidth: 160, render: (_, document) => <div className="flex min-w-0 items-center gap-2">
      <span title={t(`directory.types.${document.type}`)}><Icon icon={documentIcons[document.type]} size={18} className="text-slate-500" /></span>
      <span className="min-w-0 truncate text-13 font-medium text-slate-800" title={document.name}>{document.name}</span>
    </div> },
    { title: t('directory.fields.folder'), key: 'folder', width: '25%', minWidth: 100, render: (_, document) => document.folder_path === selected?.name ? null : <span className="block truncate text-xs text-slate-600" title={document.folder_path}>{document.folder_path}</span> },
    { title: t('directory.fields.size'), key: 'size', width: 76, render: (_, document) => <span className="whitespace-nowrap font-mono text-xs text-slate-600">{formatBytes(document.size)}</span> },
    { title: t('directory.fields.owner'), key: 'owner', width: '20%', minWidth: 88, render: (_, document) => <span className="block truncate text-13 text-slate-600" title={document.owner_name}>{document.owner_name}</span> },
    { title: t('common.columns.updated'), key: 'updated', width: 156, render: (_, document) => <time className="whitespace-nowrap font-mono text-xs text-slate-500" dateTime={document.last_update_date} title={dayjs(document.last_update_date).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(document.last_update_date).format('YYYY-MM-DD HH:mm')}</time> },
  ];

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
    <PageHeader title={t('menu.directoryExample')} description={t('directory.description')} />
    {unknownFolder ? <Alert type="info" title={t('directory.unknownFolder')} className="mb-4 shrink-0" /> : null}
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:flex-row xl:gap-5">
      <Card className="h-56 min-h-0 min-w-0 w-full shrink-0 lg:h-auto lg:w-72 xl:w-80" data-slot="directory-tree-card">
        {treeError ? <div className="p-3"><Alert type="error" title={treeError} action={<Button size="xs" onClick={() => setTreeAttempt((value) => value + 1)}>{t('common.actions.retry')}</Button>} /></div>
          : folders ? <FolderTree folders={folders} selectedId={folderId} onSelect={selectFolder} />
            : <div role="status" className="min-h-0 flex-1 overflow-hidden p-3" aria-busy="true" aria-label={t('common.status.loading')}><Skeleton className="mb-6 h-9 w-full" />{Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="mb-4 h-6 w-3/4" />)}</div>}
      </Card>
      <Card className="min-h-0 min-w-0 flex-1" data-slot="directory-documents-card">
        <div className="flex min-h-[60px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line-soft px-6 py-3">
          <div className="min-w-0 flex-1">
            <nav aria-label={t('directory.breadcrumb')}>
              <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-13">
                {[{ id: undefined, name: t('directory.allDocuments') }, ...path].map((folder, index, crumbs) => <li key={folder.id ?? 'all'} className="flex min-w-0 items-center gap-1">
                  {index ? <Icon icon="chevron-right" size={14} className="text-slate-500" /> : null}
                  {index === crumbs.length - 1 ? <span aria-current="page" className="max-w-40 truncate font-medium text-slate-900" title={folder.name}>{folder.name}</span>
                    : <button type="button" className="max-w-40 truncate rounded text-slate-600 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" title={folder.name} onClick={() => selectFolder(folder.id)}>{folder.name}</button>}
                </li>)}
              </ol>
            </nav>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">{t('directory.total', { count: total ?? '—' })}</p>
          </div>
          <SearchInput className="w-52" aria-label={t('directory.documentSearch')} placeholder={t('directory.documentSearch')} value={keyword} onChange={(event) => setKeyword(event.target.value)} onPressEnter={search} />
        </div>
        {tableError ? <Alert type="error" title={tableError} action={<Button size="xs" onClick={retryDocuments}>{t('common.actions.retry')}</Button>} className="mx-4 my-3 shrink-0" /> : null}
        <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col p-0">
          <FixedTable key={scopeKey} columns={columns} dataSource={page.records} rowKey="id" loading={page.loading} refreshing={page.refreshing} loadingMore={page.loadingMore} hasNext={page.hasNext && !tableError} onLoadMore={page.loadMore}
            totalCount={total} tabIndex={0} aria-label={selected?.name ?? t('directory.allDocuments')} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            locale={{ emptyText: <EmptyState icon="file-text" title={tableError ? t('directory.errors.documents') : queryKeyword ? t('directory.empty.search') : t('directory.empty.folder')} description={tableError ? undefined : queryKeyword ? t('directory.empty.searchHint') : t('directory.empty.folderHint')} /> }} />
        </CardContent>
      </Card>
    </div>
  </div>;
}
