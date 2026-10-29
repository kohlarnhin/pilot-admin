import { useLayoutEffect, useState, type RefObject } from 'react';

interface UseFixedRowVirtualizerOptions<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  itemCount: number;
  rowHeight: number;
  headerHeight?: number;
  overscan?: number;
  enabled?: boolean;
}

interface VirtualRange {
  start: number;
  end: number;
}

const rangesMatch = (left: VirtualRange, right: VirtualRange) => (
  left.start === right.start && left.end === right.end
);

/**
 * 面向固定行高表格的轻量窗口化：只监听真实滚动容器，不接管滚动行为。
 * 上下占位行保持原始滚动高度，因此无限加载和浏览器原生滚动手感不变。
 */
export const useFixedRowVirtualizer = <T extends HTMLElement>({
  containerRef,
  itemCount,
  rowHeight,
  headerHeight = 0,
  overscan = 8,
  enabled = true,
}: UseFixedRowVirtualizerOptions<T>) => {
  const [range, setRange] = useState<VirtualRange>(() => ({
    start: 0,
    end: enabled ? Math.min(itemCount, 30) : itemCount,
  }));

  useLayoutEffect(() => {
    if (!enabled) {
      const fullRange = { start: 0, end: itemCount };
      setRange((current) => rangesMatch(current, fullRange) ? current : fullRange);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      const initialRange = { start: 0, end: Math.min(itemCount, 30) };
      setRange((current) => rangesMatch(current, initialRange) ? current : initialRange);
      return;
    }

    let animationFrame: number | null = null;

    const updateRange = () => {
      animationFrame = null;
      const viewportStart = Math.max(0, container.scrollTop - headerHeight);
      const viewportEnd = Math.max(
        viewportStart,
        container.scrollTop + container.clientHeight - headerHeight
      );
      const nextRange = {
        start: Math.max(0, Math.floor(viewportStart / rowHeight) - overscan),
        end: Math.min(itemCount, Math.ceil(viewportEnd / rowHeight) + overscan),
      };

      setRange((current) => rangesMatch(current, nextRange) ? current : nextRange);
    };

    const scheduleUpdate = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(updateRange);
    };

    updateRange();
    container.addEventListener('scroll', scheduleUpdate, { passive: true });

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleUpdate);
    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener('scroll', scheduleUpdate);
      resizeObserver?.disconnect();
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [containerRef, enabled, headerHeight, itemCount, overscan, rowHeight]);

  const start = Math.min(range.start, itemCount);
  const end = Math.max(start, Math.min(range.end, itemCount));

  return {
    start,
    end,
    topPadding: start * rowHeight,
    bottomPadding: Math.max(0, itemCount - end) * rowHeight,
  };
};
