import type { DirectoryFolder } from '@/api/services/exampleDirectoryService';

export const ALL_DOCUMENTS_ID = 'all-documents';

export interface FolderNode extends DirectoryFolder {
  children: FolderNode[];
}
export interface FlatFolder {
  node: FolderNode;
  parentId?: string;
  level: number;
  expanded: boolean;
  posInSet: number;
  setSize: number;
}

export function buildFolderTree(folders: readonly DirectoryFolder[], rootName: string): FolderNode {
  const nodes = new Map(folders.map((folder) => [folder.id, { ...folder, children: [] } as FolderNode]));
  const root: FolderNode = {
    id: ALL_DOCUMENTS_ID,
    name: rootName,
    sort_no: 0,
    documentCount: folders.reduce((sum, folder) => sum + folder.directCount, 0),
    directCount: 0,
    children: [],
  };
  for (const node of [...nodes.values()].sort((a, b) => a.sort_no - b.sort_no || a.id.localeCompare(b.id))) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    (parent ?? root).children.push(node);
  }
  return root;
}

/** 命中时保留整支；仅子节点命中时保留祖先，不带入无关兄弟。 */
export function filterFolderTree(nodes: readonly FolderNode[], keyword: string): FolderNode[] {
  const query = keyword.trim().toLowerCase();
  if (!query) return [...nodes];
  return nodes.flatMap((node) => {
    if (node.name.toLowerCase().includes(query)) return [node];
    const children = filterFolderTree(node.children, query);
    return children.length ? [{ ...node, children }] : [];
  });
}

export function flattenFolderTree(nodes: readonly FolderNode[], collapsed: ReadonlySet<string>): FlatFolder[] {
  const rows: FlatFolder[] = [];
  const visit = (siblings: readonly FolderNode[], level: number, parentId?: string) => siblings.forEach((node, index) => {
    const expanded = node.children.length > 0 && !collapsed.has(node.id);
    rows.push({ node, parentId, level, expanded, posInSet: index + 1, setSize: siblings.length });
    if (expanded) visit(node.children, level + 1, node.id);
  });
  visit(nodes, 1);
  return rows;
}

export interface TreeKeyAction {
  focusId: string;
  toggleId?: string;
  selectId?: string;
}

/** 焦点与选择分离，按 WAI-ARIA tree 的可见顺序导航。 */
export function folderTreeKey(rows: readonly FlatFolder[], currentId: string, key: string): TreeKeyAction | undefined {
  const index = rows.findIndex((row) => row.node.id === currentId);
  const row = rows[index];
  if (!row) return undefined;
  const stay = { focusId: currentId };
  switch (key) {
    case 'ArrowDown': return { focusId: rows[Math.min(index + 1, rows.length - 1)].node.id };
    case 'ArrowUp': return { focusId: rows[Math.max(index - 1, 0)].node.id };
    case 'Home': return { focusId: rows[0].node.id };
    case 'End': return { focusId: rows[rows.length - 1].node.id };
    case 'ArrowRight': return row.node.children.length
      ? row.expanded ? { focusId: rows[index + 1].node.id } : { ...stay, toggleId: currentId }
      : stay;
    case 'ArrowLeft': return row.expanded ? { ...stay, toggleId: currentId } : { focusId: row.parentId ?? currentId };
    case 'Enter':
    case ' ': return { ...stay, selectId: currentId };
    default: return undefined;
  }
}

export function selectedFolderPath(folders: readonly DirectoryFolder[], selectedId?: string): DirectoryFolder[] {
  const path: DirectoryFolder[] = [];
  const seen = new Set<string>();
  let current = folders.find((folder) => folder.id === selectedId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = folders.find((folder) => folder.id === current?.parent_id);
  }
  return path;
}
