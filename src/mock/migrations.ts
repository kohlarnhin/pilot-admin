import type { DbMigrations } from './dbStorage';
import type { User } from '@/types';
import type { SeedText } from '@/i18n/seed';
import { createDirectorySeed } from './directorySeed';

// v5 为迁移起点；升级形状时按 fromVersion 增加纯、确定性的迁移并更新完整校验。
export const createMockDbMigrations = (seedText: SeedText): DbMigrations => ({
  5: (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !('version' in data) || data.version !== 5) {
      throw new TypeError('Invalid v5 mock DB');
    }
    return {
      ...data,
      version: 6,
      importReceipts: [],
    };
  },
  6: (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !('version' in data) || data.version !== 6
      || !('users' in data) || !Array.isArray(data.users)
      || !data.users.every((user: unknown) => Boolean(user && typeof user === 'object' && 'id' in user && typeof user.id === 'string'))) {
      throw new TypeError('Invalid v6 mock DB');
    }
    return {
      ...data,
      version: 7,
      ...createDirectorySeed(seedText, data.users as Pick<User, 'id'>[]),
    };
  },
});
