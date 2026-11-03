import { describe, expect, it } from 'vitest';
import { ALL_DOCUMENTS_ID, buildFolderTree, filterFolderTree, flattenFolderTree, folderTreeKey, selectedFolderPath } from '@/pages/examples/directory/tree';

const folders = [
  { id: 'parent', name: 'Parent', sort_no: 1, directCount: 2, documentCount: 5 },
  { id: 'child', parent_id: 'parent', name: 'Child', sort_no: 2, directCount: 1, documentCount: 3 },
  { id: 'leaf', parent_id: 'child', name: 'Leaf', sort_no: 3, directCount: 2, documentCount: 2 },
  { id: 'sibling', parent_id: 'parent', name: 'Sibling', sort_no: 4, directCount: 0, documentCount: 0 },
];
const root = buildFolderTree(folders, 'All');
const rows = flattenFolderTree([root], new Set());

describe('directory tree navigation', () => {
  it('flattens visible nodes, with root first and correct ARIA levels and sibling positions', () => {
    expect(rows.map((row) => [row.node.id, row.level, row.posInSet, row.setSize])).toEqual([
      [ALL_DOCUMENTS_ID, 1, 1, 1], ['parent', 2, 1, 1], ['child', 3, 1, 2], ['leaf', 4, 1, 1], ['sibling', 3, 2, 2],
    ]);
    expect(root.documentCount).toBe(5);
    expect(flattenFolderTree([root], new Set(['child'])).map((row) => row.node.id)).toEqual([ALL_DOCUMENTS_ID, 'parent', 'child', 'sibling']);
    expect(flattenFolderTree([root], new Set([ALL_DOCUMENTS_ID]))).toHaveLength(1);
  });

  it('keeps ancestors of matches, omits unrelated siblings, and keeps descendants of a matching parent', () => {
    const filtered = filterFolderTree(root.children, '  LEAF ');
    expect(flattenFolderTree(filtered, new Set()).map((row) => row.node.id)).toEqual(['parent', 'child', 'leaf']);
    expect(filterFolderTree(root.children, 'parent')[0]).toEqual(root.children[0]);
    expect(filterFolderTree(root.children, 'unknown')).toEqual([]);
    expect(root.children[0].children).toHaveLength(2);
  });

  it('moves Up/Down and Home/End within visible nodes, clamping at edges', () => {
    expect(folderTreeKey(rows, ALL_DOCUMENTS_ID, 'ArrowUp')).toEqual({ focusId: ALL_DOCUMENTS_ID });
    expect(folderTreeKey(rows, 'child', 'ArrowDown')).toEqual({ focusId: 'leaf' });
    expect(folderTreeKey(rows, 'child', 'ArrowUp')).toEqual({ focusId: 'parent' });
    expect(folderTreeKey(rows, 'sibling', 'ArrowDown')).toEqual({ focusId: 'sibling' });
    expect(folderTreeKey(rows, 'child', 'Home')).toEqual({ focusId: ALL_DOCUMENTS_ID });
    expect(folderTreeKey(rows, 'child', 'End')).toEqual({ focusId: 'sibling' });
  });

  it('expands then enters a child with Right, collapses then moves to parent with Left', () => {
    const collapsed = flattenFolderTree([root], new Set(['child']));
    expect(folderTreeKey(collapsed, 'child', 'ArrowRight')).toEqual({ focusId: 'child', toggleId: 'child' });
    expect(folderTreeKey(rows, 'child', 'ArrowRight')).toEqual({ focusId: 'leaf' });
    expect(folderTreeKey(rows, 'child', 'ArrowLeft')).toEqual({ focusId: 'child', toggleId: 'child' });
    expect(folderTreeKey(collapsed, 'child', 'ArrowLeft')).toEqual({ focusId: 'parent' });
    expect(folderTreeKey(rows, 'leaf', 'ArrowLeft')).toEqual({ focusId: 'child' });
    expect(folderTreeKey(rows, 'leaf', 'ArrowRight')).toEqual({ focusId: 'leaf' });
  });

  it('selects only with Enter/Space, ignores unrelated keys and resolves a selected path', () => {
    for (const key of ['Enter', ' ']) expect(folderTreeKey(rows, 'leaf', key)).toEqual({ focusId: 'leaf', selectId: 'leaf' });
    expect(folderTreeKey(rows, 'leaf', 'Tab')).toBeUndefined();
    expect(folderTreeKey([], 'missing', 'Home')).toBeUndefined();
    expect(selectedFolderPath(folders, 'leaf').map((folder) => folder.id)).toEqual(['parent', 'child', 'leaf']);
    expect(selectedFolderPath(folders, 'unknown')).toEqual([]);
  });
});
