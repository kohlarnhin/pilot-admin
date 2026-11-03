import { describe, expect, it } from 'vitest';
import { createDirectorySeed } from '@/mock/directorySeed';
import { seedText as zh } from '@/i18n/locales/zh-CN/seed';
import { seedText as en } from '@/i18n/locales/en-US/seed';

describe('directory seed', () => {
  const users = [{ id: 'u-0001' }, { id: 'u-0002' }];
  it('is deterministic, with fixed metadata, three levels, an empty folder and a long folder', () => {
    const seed = createDirectorySeed(zh, users);
    expect(createDirectorySeed(zh, users)).toEqual(seed);
    expect(seed.exampleFolders).toHaveLength(18);
    expect(seed.exampleDocuments).toHaveLength(300);
    expect(new Set(seed.exampleDocuments.map((document) => document.id)).size).toBe(300);
    const folders = new Map(seed.exampleFolders.map((folder) => [folder.id, folder]));
    const depths = seed.exampleFolders.map((folder) => {
      let depth = 1;
      let current = folder;
      while (current.parent_id) { current = folders.get(current.parent_id)!; depth += 1; }
      return depth;
    });
    expect(Math.max(...depths)).toBe(3);
    const counts = seed.exampleFolders.map((folder) => seed.exampleDocuments.filter((document) => document.folder_id === folder.id).length);
    expect(counts.filter((count) => count === 0)).toHaveLength(1);
    expect(Math.max(...counts)).toBeGreaterThan(100);
    expect(new Set(seed.exampleDocuments.map((document) => document.type)).size).toBe(6);
    for (const document of seed.exampleDocuments) {
      expect(folders.has(document.folder_id)).toBe(true);
      expect(users.some((user) => user.id === document.owner_id)).toBe(true);
      expect(Date.parse(document.create_date)).toBeLessThan(Date.parse(document.last_update_date));
      expect(document.size).toBeGreaterThan(0);
      expect(document).not.toHaveProperty('content');
    }
  });

  it('takes locale text explicitly, without changing ids, dates or associations', () => {
    const chinese = createDirectorySeed(zh, users);
    const english = createDirectorySeed(en, users);
    expect(english.exampleFolders[0].name).toBe('Resources');
    expect(english.exampleDocuments[0].name).toBe('User guide 001.pdf');
    expect(english.exampleDocuments.map(({ name: _name, ...document }) => document)).toEqual(chinese.exampleDocuments.map(({ name: _name, ...document }) => document));
    expect(english.exampleFolders.map(({ name: _name, ...folder }) => folder)).toEqual(chinese.exampleFolders.map(({ name: _name, ...folder }) => folder));
    expect(createDirectorySeed(en, []).exampleDocuments.every((document) => document.owner_id === 'system')).toBe(true);
  });
});
