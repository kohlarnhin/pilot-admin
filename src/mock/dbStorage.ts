export const MOCK_DB_PREFIX = 'pilot-admin:mock-db:v';
export type DbMigrations = Readonly<Record<number, (data: unknown) => unknown>>;
type DbStorage = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;

export function storedDbVersions(storage: DbStorage): number[] {
  const versions: number[] = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      const version = Number(/^pilot-admin:mock-db:v(\d+)$/.exec(key || '')?.[1]);
      if (Number.isSafeInteger(version) && version >= 0) versions.push(version);
    }
  } catch { /* 存储不可读时仍允许内存演示。 */ }
  return versions;
}

export const hasNewerMockDb = (storage: DbStorage, version: number): boolean => storedDbVersions(storage).some((value) => value > version);

interface LoadOptions<T> {
  storage: DbStorage;
  version: number;
  minMigratableVersion: number;
  migrations: DbMigrations;
  validate: (data: unknown) => data is T;
  seed: () => T;
  sync: (data: T) => T;
  readOnly?: boolean;
  cleanupLowerVersions?: boolean;
}

export interface LoadedMockDb<T> {
  db: T;
  source: 'current' | 'migrated' | 'seed';
  persisted: boolean;
  stale: boolean;
}

/** 依赖全部注入；迁移与同步只处理副本，不改动源版本键。 */
export function loadMockDb<T>({ storage, version, minMigratableVersion, migrations, validate, seed, sync, readOnly = false, cleanupLowerVersions = true }: LoadOptions<T>): LoadedMockDb<T> {
  const versions = storedDbVersions(storage);
  const stale = readOnly || versions.some((value) => value > version);
  const key = `${MOCK_DB_PREFIX}${version}`;
  const read = (sourceKey: string): unknown => {
    try { return JSON.parse(storage.getItem(sourceKey) || 'null'); }
    catch { return undefined; }
  };
  const persist = (db: T): boolean => {
    if (stale || hasNewerMockDb(storage, version)) return false;
    try {
      storage.setItem(key, JSON.stringify(db));
      return true;
    } catch { return false; }
  };
  const reconcile = (data: T): T => {
    const db = sync(structuredClone(data));
    if (!validate(db)) throw new Error('Invalid synchronized mock DB');
    return db;
  };
  const current = read(key);
  if (validate(current)) {
    const db = reconcile(current);
    const unchanged = JSON.stringify(db) === JSON.stringify(current);
    const persisted = unchanged || persist(db);
    // 本次启动前已有有效当前版本，才回收上次迁移保留的低版本键。
    if (cleanupLowerVersions && !stale && !hasNewerMockDb(storage, version)) {
      for (const old of versions.filter((value) => value < version)) {
        try { storage.removeItem(`${MOCK_DB_PREFIX}${old}`); } catch { /* 下次启动再清理。 */ }
      }
    }
    return { db, source: 'current', persisted, stale: stale || hasNewerMockDb(storage, version) };
  }

  const sourceVersion = versions.filter((value) => value >= minMigratableVersion && value < version).sort((a, b) => b - a)[0];
  if (sourceVersion !== undefined) {
    try {
      let data = read(`${MOCK_DB_PREFIX}${sourceVersion}`);
      for (let from = sourceVersion; from < version; from += 1) {
        const migrate = migrations[from];
        if (!migrate) throw new Error(`Missing mock DB migration from v${from}`);
        data = migrate(structuredClone(data));
      }
      if (!validate(data)) throw new Error('Invalid migrated mock DB');
      const db = reconcile(data);
      return { db, source: 'migrated', persisted: persist(db), stale: stale || hasNewerMockDb(storage, version) };
    } catch { /* 迁移失败保留源键，使用种子继续演示。 */ }
  }
  const db = reconcile(seed());
  return { db, source: 'seed', persisted: persist(db), stale: stale || hasNewerMockDb(storage, version) };
}
