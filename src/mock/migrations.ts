import type { DbMigrations } from './dbStorage';

// v5 为迁移起点；升级形状时按 fromVersion 增加纯、确定性的迁移并更新完整校验。
export const mockDbMigrations: DbMigrations = {
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
};
