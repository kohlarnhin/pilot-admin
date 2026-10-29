interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CachedQueryOptions {
  ttl?: number;
  force?: boolean;
}

const DEFAULT_TTL_MS = 30_000;
const queryCache = new Map<string, CacheEntry<unknown>>();
const inFlightQueries = new Map<string, {
  promise: Promise<unknown>;
  generation: number;
  version: number;
}>();
const queryVersions = new Map<string, number>();
let cacheGeneration = 0;

/** 首屏同步复用已有结果（允许过期），有效性仍由后续查询校验。 */
export const peekQuery = <T>(key: string): T | undefined => {
  return queryCache.get(key)?.value as T | undefined;
};

/**
 * 小型会话级 GET 缓存：同时处理 TTL 与进行中的请求去重。
 * 只缓存成功结果，失败请求会立即释放，后续操作可以重试。
 */
export const cachedQuery = <T>(
  key: string,
  query: () => Promise<T>,
  options: CachedQueryOptions = {}
): Promise<T> => {
  const { ttl = DEFAULT_TTL_MS, force = false } = options;
  const now = Date.now();
  const cached = queryCache.get(key) as CacheEntry<T> | undefined;

  if (!force && cached && cached.expiresAt > now) {
    return Promise.resolve(cached.value);
  }

  const generation = cacheGeneration;
  const version = queryVersions.get(key) ?? 0;
  const pending = inFlightQueries.get(key) as {
    promise: Promise<T>;
    generation: number;
    version: number;
  } | undefined;
  if (pending?.generation === generation && pending.version === version) return pending.promise;

  const request: Promise<T> = query()
    .then((value) => {
      if (cacheGeneration === generation && (queryVersions.get(key) ?? 0) === version) {
        queryCache.set(key, { value, expiresAt: Date.now() + ttl });
      }
      return value;
    })
    .finally(() => {
      const current = inFlightQueries.get(key);
      if (current?.promise === request) inFlightQueries.delete(key);
    });

  inFlightQueries.set(key, { promise: request, generation, version });
  return request;
};

export const invalidateQuery = (key: string): void => {
  queryVersions.set(key, (queryVersions.get(key) ?? 0) + 1);
  queryCache.delete(key);
  inFlightQueries.delete(key);
};

export const invalidateQueryPrefix = (prefix: string): void => {
  const knownKeys = new Set([...queryCache.keys(), ...inFlightQueries.keys()]);
  for (const key of knownKeys) {
    if (key.startsWith(prefix)) invalidateQuery(key);
  }
};

export const clearQueryCache = (): void => {
  cacheGeneration += 1;
  queryCache.clear();
  inFlightQueries.clear();
  queryVersions.clear();
};

export const createQueryKey = (
  prefix: string,
  params: object = {}
): string => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `${prefix}:${JSON.stringify(entries)}`;
};
