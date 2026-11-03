import { t } from '@/i18n';
import { ApiRequestError } from '@/api/errors';
import type { ApiResponse, ExampleDocument, ExampleFolder, PageResult } from '@/types';
import { getMockDb } from '@/mock/db';
import { requireMenu } from '@/mock/access';
import { delay, matchesKeyword, pageResult, response } from '@/mock/helpers';

export interface DirectoryFilters {
  folderId?: string;
  keyword?: string;
}
export interface DirectoryFolder extends ExampleFolder {
  documentCount: number;
  directCount: number;
}
export interface DirectoryDocument extends ExampleDocument {
  owner_name: string;
  folder_path: string;
}

function folderPath(folderId: string, folders: Map<string, ExampleFolder>): ExampleFolder[] {
  const path: ExampleFolder[] = [];
  const seen = new Set<string>();
  let current = folders.get(folderId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parent_id ? folders.get(current.parent_id) : undefined;
  }
  return path;
}

function filteredDocuments({ folderId, keyword }: DirectoryFilters): DirectoryDocument[] {
  const db = getMockDb();
  const folders = new Map(db.exampleFolders.map((folder) => [folder.id, folder]));
  if (folderId !== undefined && !folders.has(folderId)) throw new ApiRequestError(t('serverErrors.directory.folderNotFound'), 404);
  const users = new Map(db.users.map((user) => [user.id, user.user_name]));
  return db.exampleDocuments.flatMap((document) => {
    const path = folderPath(document.folder_id, folders);
    const selectedIndex = folderId === undefined ? 0 : path.findIndex((folder) => folder.id === folderId);
    const owner_name = users.get(document.owner_id) ?? document.owner_id;
    if (selectedIndex < 0 || !matchesKeyword(keyword, document.name, owner_name)) return [];
    return [{
      ...document,
      owner_name,
      folder_path: path.slice(selectedIndex).map((folder) => folder.name).join(' / '),
    }];
  }).sort((a, b) => b.last_update_date.localeCompare(a.last_update_date) || a.id.localeCompare(b.id));
}

export const exampleDirectoryService = {
  async getFolders(): Promise<ApiResponse<DirectoryFolder[]>> {
    await delay();
    requireMenu('/examples/directory');
    const { exampleFolders, exampleDocuments } = getMockDb();
    const folders = new Map(exampleFolders.map((folder) => [folder.id, folder]));
    const direct = new Map<string, number>();
    const subtree = new Map<string, number>();
    for (const document of exampleDocuments) {
      direct.set(document.folder_id, (direct.get(document.folder_id) ?? 0) + 1);
      for (const folder of folderPath(document.folder_id, folders)) {
        subtree.set(folder.id, (subtree.get(folder.id) ?? 0) + 1);
      }
    }
    return response(exampleFolders.map((folder) => ({
      ...folder,
      documentCount: subtree.get(folder.id) ?? 0,
      directCount: direct.get(folder.id) ?? 0,
    })).sort((a, b) => a.sort_no - b.sort_no || a.id.localeCompare(b.id)));
  },

  async getDocuments(query: DirectoryFilters & { pageNo?: number; pageSize?: number } = {}): Promise<ApiResponse<PageResult<DirectoryDocument>>> {
    await delay();
    requireMenu('/examples/directory');
    return response(pageResult(filteredDocuments(query), query));
  },

  async countDocuments(filters: DirectoryFilters = {}): Promise<number> {
    await delay();
    requireMenu('/examples/directory');
    return filteredDocuments(filters).length;
  },
};
