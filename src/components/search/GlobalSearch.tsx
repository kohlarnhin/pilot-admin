import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { Kbd } from '@/components/common/Kbd';
import { Tooltip } from '@/ui/tooltip';
import { cn } from '@/utils';

const Palette = lazy(() => import('./GlobalSearchPalette'));
const OPEN_EVENT = 'pilot-admin:search:open';
export const modKey = () => /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

export function GlobalSearchTrigger({ collapsed = false, workspace = false }: { collapsed?: boolean; workspace?: boolean }) {
  const button = <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    aria-label={`搜索 ${modKey()}K`}
    className={cn('flex h-9 items-center gap-2 rounded-lg text-13 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800',
      workspace ? 'px-2' : collapsed ? 'mx-auto w-10 justify-center' : 'mx-3 w-[calc(100%-24px)] border border-line bg-slate-50/50 px-3')}>
    <Icon icon="search" size={16} className="shrink-0" />
    {!collapsed && <><span className={cn('min-w-0 truncate', workspace ? 'hidden lg:inline' : 'text-xs')}>{'搜索页面、用户'}</span>
      <Kbd className={cn('ml-auto !border-slate-200 !bg-white !text-slate-400', workspace && 'hidden lg:inline-flex')}>{modKey()}K</Kbd></>}
  </button>;
  return collapsed ? <Tooltip title={`搜索 ${modKey()}K`} placement="right">{button}</Tooltip> : button;
}

/** 入口仅保留触发器和热键；搜索、预览及服务代码首次打开时才加载。 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => {
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    const show = () => {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (open) close(); else show();
      } else if (open && event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      }
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [open]);
  return open ? <Suspense fallback={<div role="dialog" aria-modal="true" aria-label="正在打开搜索" className="fixed inset-0 z-[1100] grid place-items-center bg-slate-900/40" onKeyDown={(event) => event.stopPropagation()}><span className="rounded-xl bg-white px-8 py-6 text-sm text-slate-500">正在打开搜索…</span></div>}>
    <Palette onClose={close} />
  </Suspense> : null;
}
