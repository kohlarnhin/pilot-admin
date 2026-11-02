import { describe, expect, it, vi } from 'vitest';
import { loadMockDb, type DbMigrations } from '@/mock/dbStorage';

interface TestDb { version: number; values: string[]; synced: boolean }
const source = { version: 5, values: ['kept'], synced: false };
const key = (version: number) => `pilot-admin:mock-db:v${version}`;
const validate = (data: unknown): data is TestDb => {
  const db = data as Partial<TestDb> | null;
  return Boolean(db && db.version === 7 && Array.isArray(db.values) && db.values.every((item) => typeof item === 'string') && typeof db.synced === 'boolean');
};
const migrations: DbMigrations = {
  5: (data) => ({ ...(data as TestDb), version: 6, values: [...(data as TestDb).values, 'v6'] }),
  6: (data) => ({ ...(data as TestDb), version: 7, values: [...(data as TestDb).values, 'v7'] }),
};
const options = () => ({
  storage: localStorage,
  version: 7,
  minMigratableVersion: 5,
  migrations,
  validate,
  seed: () => ({ version: 7, values: ['seed'], synced: false }),
  sync: (db: TestDb): TestDb => ({ ...db, synced: true }),
});

describe('loadMockDb', () => {
  it('prefers a valid current key, syncs it and cleans lower versions only', () => {
    const current = { version: 7, values: ['current'], synced: true };
    localStorage.setItem(key(7), JSON.stringify(current));
    localStorage.setItem(key(5), JSON.stringify(source));
    localStorage.setItem('another-app', 'keep');
    const write = vi.spyOn(localStorage, 'setItem');
    expect(loadMockDb(options())).toEqual({ db: current, source: 'current', persisted: true, stale: false });
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(key(5))).toBeNull();
    expect(localStorage.getItem('another-app')).toBe('keep');
  });

  it('migrates in order, validates and syncs before persisting, retaining the source for this start', () => {
    const serialized = JSON.stringify(source);
    localStorage.setItem(key(5), serialized);
    const result = loadMockDb(options());
    expect(result).toEqual({ db: { version: 7, values: ['kept', 'v6', 'v7'], synced: true }, source: 'migrated', persisted: true, stale: false });
    expect(localStorage.getItem(key(5))).toBe(serialized);
    expect(JSON.parse(localStorage.getItem(key(7))!)).toEqual(result.db);
    expect(loadMockDb(options()).source).toBe('current');
    expect(localStorage.getItem(key(5))).toBeNull();
  });

  it('uses the highest supported lower key and ignores an invalid current key', () => {
    localStorage.setItem(key(7), '{corrupt');
    localStorage.setItem(key(5), JSON.stringify(source));
    localStorage.setItem(key(6), JSON.stringify({ version: 6, values: ['newest'], synced: false }));
    const result = loadMockDb(options());
    expect(result.db.values).toEqual(['newest', 'v7']);
    expect(result.source).toBe('migrated');
    expect(localStorage.getItem(key(5))).not.toBeNull();
    expect(localStorage.getItem(key(6))).not.toBeNull();
  });

  it('retains the migration source across storage reloads until a later startup', () => {
    const serialized = JSON.stringify(source);
    localStorage.setItem(key(5), serialized);
    expect(loadMockDb(options()).source).toBe('migrated');
    expect(loadMockDb({ ...options(), cleanupLowerVersions: false }).source).toBe('current');
    expect(localStorage.getItem(key(5))).toBe(serialized);
    expect(loadMockDb(options()).source).toBe('current');
    expect(localStorage.getItem(key(5))).toBeNull();
  });

  it.each(['throws', 'invalid', 'missing step'] as const)('falls back to seed if migration %s, without touching its source', (failure) => {
    const serialized = JSON.stringify(source);
    localStorage.setItem(key(5), serialized);
    const broken: DbMigrations = failure === 'missing step' ? { 5: migrations[5] } : {
      5: failure === 'throws' ? () => { throw new Error('Migration failed'); } : () => ({ version: 6 }),
      6: (data) => ({ ...(data as object), version: 7 }),
    };
    const result = loadMockDb({ ...options(), migrations: broken });
    expect(result).toEqual({ db: { version: 7, values: ['seed'], synced: true }, source: 'seed', persisted: true, stale: false });
    expect(localStorage.getItem(key(5))).toBe(serialized);
  });

  it('keeps migrated data in memory and the source intact if persisting fails', () => {
    const serialized = JSON.stringify(source);
    localStorage.setItem(key(5), serialized);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    const result = loadMockDb(options());
    expect(result.source).toBe('migrated');
    expect(result.persisted).toBe(false);
    expect(result.db).toEqual({ version: 7, values: ['kept', 'v6', 'v7'], synced: true });
    expect(localStorage.getItem(key(5))).toBe(serialized);
    expect(localStorage.getItem(key(7))).toBeNull();
  });

  it('never writes or cleans keys if a higher version exists', () => {
    localStorage.setItem(key(7), JSON.stringify({ version: 7, values: ['own data'], synced: false }));
    localStorage.setItem(key(5), JSON.stringify(source));
    localStorage.setItem(key(8), 'newer build owns this');
    const before = Object.fromEntries(Object.keys(localStorage).map((name) => [name, localStorage.getItem(name)]));
    const write = vi.spyOn(localStorage, 'setItem');
    const remove = vi.spyOn(localStorage, 'removeItem');
    expect(loadMockDb(options())).toMatchObject({ db: { values: ['own data'], synced: true }, source: 'current', stale: true, persisted: false });
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(Object.fromEntries(Object.keys(localStorage).map((name) => [name, localStorage.getItem(name)]))).toEqual(before);
  });

  it('produces identical data when two tabs migrate the same source before either commits', () => {
    const serialized = JSON.stringify(source);
    localStorage.setItem(key(5), serialized);
    const originalWrite = localStorage.setItem.bind(localStorage);
    let other: ReturnType<typeof loadMockDb<TestDb>> | undefined;
    vi.spyOn(localStorage, 'setItem').mockImplementationOnce((name, value) => {
      other = loadMockDb(options());
      originalWrite(name, value);
    });
    const first = loadMockDb(options());
    expect(other).toEqual(first);
    expect(first.source).toBe('migrated');
    expect(first.persisted).toBe(true);
    expect(localStorage.getItem(key(5))).toBe(serialized);
    expect(JSON.parse(localStorage.getItem(key(7))!)).toEqual(first.db);
  });

  it('falls back on corrupt JSON and leaves unsupported old keys until a later valid start', () => {
    localStorage.setItem(key(7), '{broken');
    localStorage.setItem(key(4), 'unsupported');
    const result = loadMockDb(options());
    expect(result.source).toBe('seed');
    expect(result.db.values).toEqual(['seed']);
    expect(localStorage.getItem(key(4))).toBe('unsupported');
  });

  it('validates again after synchronization before persisting a migration', () => {
    localStorage.setItem(key(5), JSON.stringify(source));
    const sync = (db: TestDb) => db.values[0] === 'kept' ? { ...db, version: 999 } : db;
    const result = loadMockDb({ ...options(), sync });
    expect(result.source).toBe('seed');
    expect(JSON.parse(localStorage.getItem(key(7))!).version).toBe(7);
    expect(localStorage.getItem(key(5))).toBe(JSON.stringify(source));
  });
});
