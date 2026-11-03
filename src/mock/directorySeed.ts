import type { SeedText } from '@/i18n/seed';
import type { ExampleDocument, ExampleFolder, User } from '@/types';

/** 固定 ID、顺序及日期；调用方注入当前语言文案，迁移不读取环境。 */
export function createDirectorySeed(text: SeedText, users: readonly Pick<User, 'id'>[]): {
  exampleFolders: ExampleFolder[];
  exampleDocuments: ExampleDocument[];
} {
  const parents = [0, 1, 2, 2, 1, 5, 0, 7, 8, 8, 7, 11, 0, 13, 14, 14, 13, 17];
  const folderId = (index: number) => `folder-${String(index).padStart(2, '0')}`;
  const exampleFolders = parents.map((parent, index): ExampleFolder => ({
    id: folderId(index + 1),
    ...(parent ? { parent_id: folderId(parent) } : {}),
    name: text.directory.folderNames[index],
    sort_no: index + 1,
  }));
  // 入门目录有 140 条，空目录没有记录；其余记录分散到各层，演示子树与直接计数。
  const otherFolders = exampleFolders.filter((folder) => ![folderId(3), folderId(12)].includes(folder.id));
  const anchor = Date.parse('2026-10-28T09:00:00+08:00');
  const types = ['pdf', 'docx', 'xlsx', 'pptx', 'image', 'other'] as const;
  const extensions = ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'txt'];
  const exampleDocuments = Array.from({ length: 300 }, (_, index): ExampleDocument => {
    const owner = users[(index * 7) % users.length]?.id ?? 'system';
    const updatedAt = anchor - index * 3 * 60 * 60 * 1000;
    return {
      id: `document-${String(index + 1).padStart(3, '0')}`,
      folder_id: index < 140 ? folderId(3) : otherFolders[(index - 140) % otherFolders.length].id,
      name: `${text.directory.documentNames[index % text.directory.documentNames.length]} ${String(index + 1).padStart(3, '0')}.${extensions[index % extensions.length]}`,
      type: types[index % types.length],
      size: index === 0 ? 40 : 1024 + (index * 7919) % (8 * 1024 * 1024),
      owner_id: owner,
      create_by: users[index % users.length]?.id ?? 'system',
      create_date: new Date(updatedAt - (3 + index % 7) * 24 * 60 * 60 * 1000).toISOString(),
      last_update_by: owner,
      last_update_date: new Date(updatedAt).toISOString(),
    };
  });
  return {
    exampleFolders,
    exampleDocuments,
  };
}
