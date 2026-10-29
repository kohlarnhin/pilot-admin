import { useEffect, useState } from 'react';

/** 连续等待 delay 毫秒后显示，结束或卸载时取消等待。 */
export function useDelayedFlag(active: boolean, delay = 200): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (!active) return;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [active, delay]);

  return active && visible;
}
