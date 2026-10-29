import { useCallback, useEffect, useRef, type RefObject } from 'react';

interface UseInfiniteScrollLoaderOptions<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  sentinelRef: RefObject<Element | null>;
  itemCount: number;
  hasNext: boolean;
  initialLoading?: boolean;
  loadingMore?: boolean;
  preloadDistance?: number;
  preloadRemainingRatio?: number;
  scrollContainerSelector?: string;
  onLoadMore?: () => void | Promise<void>;
}

export const INFINITE_SCROLL_PRELOAD_DISTANCE = 1200;
export const INFINITE_SCROLL_PRELOAD_REMAINING_RATIO = 0.5;

const SCROLLABLE_OVERFLOW = /^(auto|scroll|overlay)$/;

const resolveScrollContainer = (
  preferredContainer: HTMLElement,
  sentinel: Element | null,
  scrollContainerSelector?: string
): HTMLElement => {
  if (scrollContainerSelector) {
    const explicitContainer = preferredContainer.querySelector<HTMLElement>(scrollContainerSelector);
    if (explicitContainer) return explicitContainer;
  }

  let candidate: HTMLElement | null = sentinel?.parentElement ?? preferredContainer;

  while (candidate) {
    const { overflowY } = window.getComputedStyle(candidate);
    if (SCROLLABLE_OVERFLOW.test(overflowY)) return candidate;
    candidate = candidate.parentElement;
  }

  return preferredContainer;
};

/**
 * 统一的无感无限滚动：在用户触底前预取下一页，底部哨兵不占据可见空间。
 * 加载状态变化或数据合并后释放锁，避免刷新条数不变时阻塞后续追加。
 */
export const useInfiniteScrollLoader = <T extends HTMLElement>({
  containerRef,
  sentinelRef,
  itemCount,
  hasNext,
  initialLoading = false,
  loadingMore = false,
  preloadDistance = INFINITE_SCROLL_PRELOAD_DISTANCE,
  preloadRemainingRatio = INFINITE_SCROLL_PRELOAD_REMAINING_RATIO,
  scrollContainerSelector,
  onLoadMore,
}: UseInfiniteScrollLoaderOptions<T>) => {
  const loadTriggeredRef = useRef(false);
  const safePreloadDistance = Math.max(0, preloadDistance);
  const safePreloadRemainingRatio = Math.min(1, Math.max(0, preloadRemainingRatio));

  const triggerLoadMore = useCallback(() => {
    if (
      initialLoading
      || !hasNext
      || loadingMore
      || loadTriggeredRef.current
      || !onLoadMore
    ) return;

    loadTriggeredRef.current = true;
    void onLoadMore();
  }, [hasNext, initialLoading, loadingMore, onLoadMore]);

  const isInPreloadRange = useCallback((container: HTMLElement) => {
    const scrollableDistance = Math.max(0, container.scrollHeight - container.clientHeight);
    const distanceToBottom = Math.max(0, scrollableDistance - container.scrollTop);
    const relativePreloadDistance = scrollableDistance * safePreloadRemainingRatio;

    // 长列表滚动到约一半即预取；短列表仍至少保留 1200px 的提前量。
    return distanceToBottom <= Math.max(safePreloadDistance, relativePreloadDistance);
  }, [safePreloadDistance, safePreloadRemainingRatio]);

  useEffect(() => {
    loadTriggeredRef.current = false;
  }, [itemCount, initialLoading, loadingMore]);

  // 绑定真实滚动容器的 passive 监听，避免表格内部滚动时父级 React 事件拿不到位置。
  useEffect(() => {
    if (initialLoading || !hasNext || loadingMore || !onLoadMore) return;

    let scrollContainer: HTMLElement | null = null;
    const handleScroll = () => {
      if (!scrollContainer) return;
      if (isInPreloadRange(scrollContainer)) {
        triggerLoadMore();
      } else {
        loadTriggeredRef.current = false;
      }
    };

    const frame = window.requestAnimationFrame(() => {
      const preferredContainer = containerRef.current;
      if (!preferredContainer) return;

      scrollContainer = resolveScrollContainer(
        preferredContainer,
        sentinelRef.current,
        scrollContainerSelector
      );
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      // 首屏不足、或追加后仍位于预取区时继续补页，无需等待下一次滚动事件。
      handleScroll();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, hasNext, initialLoading, itemCount, loadingMore, onLoadMore,
    isInPreloadRange, scrollContainerSelector, sentinelRef, triggerLoadMore]);

  useEffect(() => {
    if (initialLoading || !hasNext || loadingMore || !onLoadMore) return;

    const preferredContainer = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!preferredContainer || !sentinel || typeof IntersectionObserver === 'undefined') return;
    const scrollContainer = resolveScrollContainer(
      preferredContainer,
      sentinel,
      scrollContainerSelector
    );
    // 虚拟表格的滚动层位于表格内部，而底部哨兵是其兄弟节点；此时由 passive
    // scroll 监听负责预取，避免创建永远无法相交的 observer。
    if (!scrollContainer.contains(sentinel)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          triggerLoadMore();
        } else if (!loadingMore) {
          loadTriggeredRef.current = false;
        }
      },
      {
        root: scrollContainer,
        rootMargin: `0px 0px ${safePreloadDistance}px 0px`,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [containerRef, hasNext, initialLoading, itemCount, loadingMore, onLoadMore,
    safePreloadDistance, scrollContainerSelector, sentinelRef, triggerLoadMore]);
};
