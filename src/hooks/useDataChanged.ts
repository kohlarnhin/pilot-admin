import { useEffect, useRef } from 'react';
import { AGENT_DATA_CHANGED_EVENT } from '@/api/services/agentEvents';

/** 订阅保持稳定，事件始终调用最近一次渲染提供的处理函数。 */
export function useDataChanged(handler: () => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const onChange = () => handlerRef.current();
    window.addEventListener(AGENT_DATA_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AGENT_DATA_CHANGED_EVENT, onChange);
  }, []);
}
