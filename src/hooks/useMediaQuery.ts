import { useSyncExternalStore } from 'react';

/** 订阅 CSS 媒体查询；无 matchMedia 的环境（测试、SSR）视为不匹配。 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}

/** 与 Tailwind lg 断点对齐：低于 1024px 时侧栏固定为窄栏，展开改为浮层。 */
export const COMPACT_LAYOUT_QUERY = '(max-width: 1023.98px)';
export const useCompactLayout = () => useMediaQuery(COMPACT_LAYOUT_QUERY);
