import { useEffect, useRef, useState } from 'react';
import type { AgentChatResult } from '@/types';

const supported = () => typeof window !== 'undefined' && 'Notification' in window;

/** 只接受实时完成事件；历史加载和局部流式文本不会进入这里。 */
export function useAssistantNotifications(userId: string, isOpen: boolean, onOpenSession: (id: string | number) => void) {
  const key = `pilot-admin:assistant:notifications:${userId}`;
  const [enabled, setEnabled] = useState(() => {
    try { return supported() && Notification.permission === 'granted' && localStorage.getItem(key) === 'true'; }
    catch { return false; }
  });
  const [permission, setPermission] = useState(() => supported() ? Notification.permission : 'unsupported');
  const [requesting, setRequesting] = useState(false);
  const latest = useRef({ isOpen, onOpenSession, enabled });
  latest.current = { isOpen, onOpenSession, enabled };
  const notifications = useRef(new Set<Notification>());
  const seen = useRef(new Set<string>());

  useEffect(() => () => {
    notifications.current.forEach(notification => notification.close());
  }, [userId]);

  const toggle = async () => {
    if (requesting) return;
    if (enabled) {
      setEnabled(false);
      try { localStorage.setItem(key, 'false'); } catch { /* 私密浏览允许仅本次生效 */ }
      return;
    }
    if (!supported()) { setPermission('unsupported'); return; }
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setEnabled(result === 'granted');
      try { localStorage.setItem(key, String(result === 'granted')); } catch { /* 仅本次生效 */ }
    } catch { setEnabled(false); }
    finally { setRequesting(false); }
  };

  const notify = (sessionId: string | number, text: string, confirmation = false) => {
    if (!latest.current.enabled || !supported() || Notification.permission !== 'granted'
      || (!document.hidden && latest.current.isOpen)) return;
    try {
      const notification = new Notification('AI 助手', {
        body: `${confirmation ? '需要你确认' : '已完成'}：${Array.from(text.replace(/\s+/g, ' ').trim()).slice(0, 60).join('')}`,
        tag: `pilot-admin:assistant:${userId}:${sessionId}`,
      });
      notifications.current.add(notification);
      notification.onclick = () => {
        window.focus();
        latest.current.onOpenSession(sessionId);
        notification.close();
        notifications.current.delete(notification);
      };
      notification.onclose = () => notifications.current.delete(notification);
    } catch { /* 部分浏览器即使授予权限仍可能禁止系统通知 */ }
  };

  const onResult = (result: AgentChatResult) => {
    if (!result.sessionId) return;
    const id = `${result.sessionId}:${result.messageId}`;
    if (seen.current.has(id)) return;
    seen.current.add(id);
    const confirmation = result.choices?.some(choice => !choice.id.startsWith('prompt:'))
      || result.interaction?.type === 'selection'
      || (result.interaction?.type === 'execution_plan' && result.interaction.status === 'proposed');
    notify(result.sessionId, result.message, Boolean(confirmation));
  };

  const tooltip = permission === 'unsupported' ? '当前浏览器不支持通知'
    : permission === 'denied' ? '浏览器已禁止通知，请在浏览器的网站权限中开启'
    : enabled ? '已开启完成通知 · 关闭助手或离开标签页时提醒' : '开启助手完成通知';
  return { enabled, requesting, tooltip, toggle, onResult };
}
