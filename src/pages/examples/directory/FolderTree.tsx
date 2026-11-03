import { useEffect, useMemo, useRef, useState } from 'react';
import { t, useT } from '@/i18n';
import type { DirectoryFolder } from '@/api/services/exampleDirectoryService';
import { Icon } from '@/components/icon';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchInput } from '@/ui/input';
import { cn } from '@/utils';
import { ALL_DOCUMENTS_ID, buildFolderTree, filterFolderTree, flattenFolderTree, folderTreeKey, selectedFolderPath } from './tree';

export function FolderTree({ folders, selectedId, onSelect }: {
  folders: DirectoryFolder[];
  selectedId?: string;
  onSelect: (id?: string) => void;
}) {
  useT();
  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState(selectedId ?? ALL_DOCUMENTS_ID);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const root = buildFolderTree(folders, t('directory.allDocuments'));
  const filteredRoot = { ...root, children: filterFolderTree(root.children, filter) };
  const rows = flattenFolderTree([filteredRoot], collapsed);
  const tabStop = rows.some((row) => row.node.id === focusedId) ? focusedId : ALL_DOCUMENTS_ID;
  const path = useMemo(() => selectedFolderPath(folders, selectedId), [folders, selectedId]);
  // 深链及后退恢复选择时展开祖先；不抢走当前搜索框或表格的焦点。
  useEffect(() => {
    setCollapsed((current) => new Set([...current].filter((id) => id !== ALL_DOCUMENTS_ID && !path.some((folder) => folder.id === id))));
  }, [path]);
  const toggle = (id: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const select = (id: string) => onSelect(id === ALL_DOCUMENTS_ID ? undefined : id);

  return <>
    <div className="flex h-[60px] shrink-0 items-center border-b border-line-soft px-3">
      <SearchInput className="w-full" aria-label={t('directory.treeSearch')} placeholder={t('directory.treeSearch')} value={filter} onChange={(event) => { setFilter(event.target.value); setCollapsed(new Set()); }} />
    </div>
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-3" data-slot="directory-tree-scroll">
      <div role="tree" aria-label={t('directory.treeLabel')}>
        {rows.map(({ node, level, expanded, posInSet, setSize }) => <button
          key={node.id}
          ref={(element) => { if (element) rowRefs.current.set(node.id, element); else rowRefs.current.delete(node.id); }}
          type="button"
          role="treeitem"
          data-folder-id={node.id}
          aria-label={node.name}
          aria-description={t('directory.counts', { total: node.documentCount, direct: node.directCount })}
          aria-expanded={node.children.length ? expanded : undefined}
          aria-level={level}
          aria-posinset={posInSet}
          aria-setsize={setSize}
          aria-selected={(selectedId ?? ALL_DOCUMENTS_ID) === node.id}
          tabIndex={tabStop === node.id ? 0 : -1}
          onFocus={() => setFocusedId(node.id)}
          onClick={() => select(node.id)}
          onKeyDown={(event) => {
            const action = folderTreeKey(rows, node.id, event.key);
            if (!action) return;
            event.preventDefault();
            if (action.toggleId) toggle(action.toggleId);
            if (action.selectId) select(action.selectId);
            setFocusedId(action.focusId);
            rowRefs.current.get(action.focusId)?.focus();
          }}
          className={cn('flex h-10 w-full items-center gap-2 rounded-md pr-3 text-left text-13 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400',
            (selectedId ?? ALL_DOCUMENTS_ID) === node.id ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600')}
          style={{ paddingLeft: 10 + (level - 1) * 20 }}
        >
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true" onClick={(event) => { if (node.children.length) { event.stopPropagation(); toggle(node.id); rowRefs.current.get(node.id)?.focus(); } }}>
            {node.children.length ? <Icon icon="chevron-right" size={16} className={cn('text-slate-500', expanded && 'rotate-90')} /> : null}
          </span>
          <Icon icon={expanded ? 'folder-open' : 'folder'} size={16} className="text-slate-500" />
          <span className="min-w-0 flex-1 truncate" title={node.name}>{node.name}</span>
          <span aria-hidden="true" className="ml-auto shrink-0 font-mono text-xs font-normal tabular-nums text-slate-500" title={t('directory.counts', { total: node.documentCount, direct: node.directCount })}>{node.documentCount}</span>
        </button>)}
      </div>
      {filter.trim() && !filteredRoot.children.length ? <EmptyState icon="folder" title={t('directory.empty.tree')} /> : null}
    </div>
  </>;
}
