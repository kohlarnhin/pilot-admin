import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageResult } from '../types';

interface UseInfinitePageOptions<T> {
  fetchPage: (pageNo: number, pageSize: number) => Promise<PageResult<T>>;
  getKey: (record: T) => string;
  pageSize?: number;
  scopeKey?: string | number;
  onError?: (error: unknown) => void;
}

const appendUniqueRecords = <T>(current: T[], incoming: T[], getKey: (record: T) => string): T[] => {
  const recordMap = new Map(current.map((record) => [getKey(record), record]));
  incoming.forEach((record) => recordMap.set(getKey(record), record));
  return Array.from(recordMap.values());
};

export const useInfinitePage = <T>({
  fetchPage,
  getKey,
  pageSize = 20,
  scopeKey = 'default',
  onError,
}: UseInfinitePageOptions<T>) => {
  const [records, setRecords] = useState<T[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const versionRef = useRef(0);
  const busyRef = useRef(false);
  const nextPageRef = useRef(2);
  const hasNextRef = useRef(true);
  const recordsRef = useRef<T[]>([]);
  const scopeKeyRef = useRef(scopeKey);
  const getKeyRef = useRef(getKey);
  const onErrorRef = useRef(onError);
  const failedPageRef = useRef<number | null>(null);

  getKeyRef.current = getKey;
  onErrorRef.current = onError;
  recordsRef.current = records;

  useEffect(() => {
    const version = versionRef.current + 1;
    versionRef.current = version;
    const previousNextPage = nextPageRef.current;
    const previousHasNext = hasNextRef.current;
    busyRef.current = true;
    failedPageRef.current = null;
    nextPageRef.current = 2;
    hasNextRef.current = true;
    const scopeChanged = scopeKeyRef.current !== scopeKey;
    scopeKeyRef.current = scopeKey;
    const keepPreviousRecords = !scopeChanged && recordsRef.current.length > 0;

    if (scopeChanged) {
      recordsRef.current = [];
      setRecords([]);
      setHasNext(true);
    }
    setLoading(!keepPreviousRecords);
    setRefreshing(keepPreviousRecords);
    setLoadingMore(false);

    void fetchPage(1, pageSize)
      .then((page) => {
        if (versionRef.current !== version) return;
        if (page.hasNext && page.records.length === 0) throw new Error('分页数据为空，请重试');
        recordsRef.current = page.records;
        setRecords(page.records);
        setHasNext(page.hasNext);
        hasNextRef.current = page.hasNext;
      })
      .catch((error) => {
        if (versionRef.current !== version) return;
        failedPageRef.current = 1;
        if (keepPreviousRecords) {
          nextPageRef.current = previousNextPage;
          hasNextRef.current = previousHasNext;
        } else {
          setHasNext(false);
          hasNextRef.current = false;
        }
        onErrorRef.current?.(error);
      })
      .finally(() => {
        if (versionRef.current !== version) return;
        busyRef.current = false;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      if (versionRef.current === version) versionRef.current += 1;
    };
  }, [fetchPage, pageSize, reloadToken, scopeKey]);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasNextRef.current || failedPageRef.current !== null) return;

    const version = versionRef.current;
    const pageNo = nextPageRef.current;
    busyRef.current = true;
    setLoadingMore(true);

    try {
      const page = await fetchPage(pageNo, pageSize);
      if (versionRef.current !== version) return;
      const existingKeys = new Set(recordsRef.current.map(getKeyRef.current));
      if (page.hasNext && !page.records.some((record) => !existingKeys.has(getKeyRef.current(record)))) {
        throw new Error('分页数据未前进，请重试');
      }
      setRecords((current) => {
        const next = appendUniqueRecords(current, page.records, getKeyRef.current);
        recordsRef.current = next;
        return next;
      });
      setHasNext(page.hasNext);
      hasNextRef.current = page.hasNext;
      nextPageRef.current = pageNo + 1;
    } catch (error) {
      if (versionRef.current === version) {
        failedPageRef.current = pageNo;
        onErrorRef.current?.(error);
      }
    } finally {
      if (versionRef.current === version) {
        busyRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [fetchPage, pageSize]);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const retry = useCallback(async () => {
    const failedPage = failedPageRef.current;
    failedPageRef.current = null;
    if (failedPage === 1) reload();
    else if (failedPage !== null) await loadMore();
  }, [loadMore, reload]);

  // scope 改变发生在 effect 之前；这一帧直接隐藏旧作用域数据并展示骨架，避免串页闪现。
  const scopeChangedDuringRender = scopeKeyRef.current !== scopeKey;

  return {
    records: scopeChangedDuringRender ? [] : records,
    setRecords,
    hasNext: scopeChangedDuringRender ? true : hasNext,
    loading: scopeChangedDuringRender || loading,
    refreshing: scopeChangedDuringRender ? false : refreshing,
    loadingMore: scopeChangedDuringRender ? false : loadingMore,
    loadMore,
    reload,
    retry,
  };
};
