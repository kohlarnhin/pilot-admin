import { useEffect, useState } from 'react';

/** 输入即搜：值停止变化 delay 毫秒后才同步，避免每次按键都发请求。 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
