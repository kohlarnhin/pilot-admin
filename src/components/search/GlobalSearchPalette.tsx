import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { searchService } from '@/api/services/searchService';
import { useAuthStore } from '@/store/authStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Icon } from '@/components/icon';
import { Kbd } from '@/components/common/Kbd';
import { CopyButton } from '@/components/common/CopyButton';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Modal } from '@/ui/modal';
import { Skeleton } from '@/ui/skeleton';
import { Tag } from '@/ui/controls';
import { preloadRoute } from '@/routes/routeModules';
import { cn } from '@/utils';
import { searchTargets, type SearchPage } from './searchTargets';
import type { User } from '@/types';

type Result = { kind: 'page'; id: string; page: SearchPage } | { kind: 'user'; id: string; user: User };

export default function GlobalSearchPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const menus = useAuthStore((state) => state.menus);
  const pages = useMemo(() => searchTargets(menus), [menus]);
  const canSearchUsers = pages.some((page) => page.route === '/system/users');
  const [query, setQuery] = useState('');
  const q = useDebouncedValue(query.trim(), 200);
  const [bundle, setBundle] = useState<{ query: string; users: User[] }>({ query: '', users: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);

  useEffect(() => {
    let active = true;
    setError('');
    if (!q || !canSearchUsers) { setLoading(false); return; }
    setLoading(true);
    searchService.searchUsers(q).then((users) => { if (active) setBundle({ query: q, users }); })
      .catch((cause: Error) => { if (active) setError(cause.message || '搜索失败，请重试'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q, canSearchUsers, attempt]);

  const matches = (value: string) => q.toLowerCase().split(/\s+/).every((token) => value.toLowerCase().includes(token));
  const pageResults: Result[] = pages.filter((page) => !q || matches(`${page.title} ${page.route}`)).map((page) => ({ kind: 'page', id: `page:${page.route}`, page }));
  const userResults: Result[] = q && bundle.query === q && canSearchUsers ? bundle.users.map((user) => ({ kind: 'user', id: `user:${user.id}`, user })) : [];
  const sections = [{ title: q ? '用户' : '常用页面', items: q ? userResults : pageResults }, ...(q ? [{ title: '页面', items: pageResults }] : [])];
  const results = sections.flatMap((section) => section.items);
  const activeIndex = Math.max(0, results.findIndex((result) => result.id === activeId));
  const selected = results[activeIndex];
  const routeFor = (result: Result) => result.kind === 'page' ? result.page.route : `/system/users?keyword=${encodeURIComponent(result.user.login_name)}`;

  const openResult = (result?: Result) => {
    if (!result) return;
    onClose(); navigate(routeFor(result));
  };
  useEffect(() => { setActiveId(null); listRef.current?.scrollTo({ top: 0 }); }, [q]);
  useEffect(() => { listRef.current?.querySelector(`[data-result-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' }); }, [activeIndex, activeId]);

  const row = (result: Result) => {
    const index = results.indexOf(result);
    const title = result.kind === 'user' ? result.user.user_name : result.page.title;
    const description = result.kind === 'user' ? `@${result.user.login_name} · ${result.user.email || result.user.id}` : result.page.route;
    return <button key={result.id} id={`search-result-${index}`} data-result-index={index} type="button" role="option"
      aria-selected={selected?.id === result.id} onMouseMove={() => setActiveId(result.id)} onFocus={() => setActiveId(result.id)} onClick={() => openResult(result)}
      onPointerEnter={() => void preloadRoute(routeFor(result))}
      className={cn('flex w-full gap-3 rounded-lg px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-300', selected?.id === result.id ? 'bg-slate-100' : 'hover:bg-slate-50')}>
      <Icon icon={result.kind === 'user' ? 'user' : 'file-text'} size={17} className="mt-0.5 shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1"><span className="block truncate text-13 font-medium text-slate-700" title={title}>{title}</span>
        <span className="mt-1 block truncate font-mono text-[11px] text-slate-500" title={description}>{description}</span></span>
      {selected?.id === result.id && <Icon icon="arrow-right" size={14} className="mt-1 shrink-0 text-slate-400" />}
    </button>;
  };

  return <Modal open ariaLabel="全局搜索" closable={false} onCancel={onClose} footer={null} width={720} zIndex={1100}
    className="h-[620px] max-h-[calc(100svh-48px)]" bodyClassName="!flex min-h-0 flex-1 !flex-col !overflow-hidden !p-0">
    <div className="flex min-h-0 flex-1 flex-col" onKeyDown={(event) => {
      event.stopPropagation();
      if (event.nativeEvent.isComposing || composing.current || event.keyCode === 229) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (results.length) setActiveId(results[(activeIndex + direction + results.length) % results.length].id);
      } else if (event.key === 'Enter') { event.preventDefault(); openResult(selected); }
    }}>
      <div className="flex shrink-0 items-center gap-2 border-b border-line-soft px-4 py-3">
        <Input ref={inputRef} prefix={<Icon icon="search" size={17} />} autoFocus role="combobox" aria-label="搜索页面、用户" aria-autocomplete="list"
          aria-expanded="true" aria-controls="global-search-results" aria-activedescendant={selected ? `search-result-${activeIndex}` : undefined}
          value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} placeholder="搜索页面、姓名、账号或邮箱…"
          onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} className="min-w-0 flex-1" />
        <Button variant="ghost" size="xs" onClick={onClose}>Esc</Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <div ref={listRef} id="global-search-results" role="listbox" aria-label="搜索结果" aria-busy={loading} className="min-h-0 min-w-0 w-[54%] overflow-y-auto overscroll-contain p-2">
          {sections.map((section) => <div key={section.title} role="group" aria-label={section.title} className="mb-3">
            <div className="px-3 pb-1 pt-2 text-[11px] font-medium text-slate-500">{section.title}</div>{section.items.map(row)}
            {section.title === '用户' && loading && !userResults.length && <div aria-label="正在搜索" className="space-y-5 px-3 py-4">{[0, 1, 2].map((index) => <div key={index} className="space-y-2"><Skeleton className="h-3.5 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>)}</div>}
            {section.title === '用户' && !canSearchUsers && <p className="px-3 py-5 text-xs text-slate-500">当前角色可搜索已授权页面</p>}
            {section.title === '用户' && canSearchUsers && !loading && !userResults.length && !error && <p className="px-3 py-5 text-xs text-slate-500">没有匹配的用户</p>}
          </div>)}
          {error && <p role="alert" className="px-3 py-4 text-xs text-slate-600">{error}<Button size="xs" className="ml-2" onClick={() => setAttempt((value) => value + 1)}>重试</Button></p>}
        </div>
        <aside aria-label="搜索预览" className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-line-soft bg-slate-50/40">
          {selected?.kind === 'user' ? <>
            <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mb-4 text-[11px] text-slate-500">用户预览</div>
              <h2 className="break-words text-base font-medium text-slate-900">{selected.user.user_name}</h2><p className="mt-1 break-all font-mono text-xs text-slate-500">@{selected.user.login_name}</p>
              <div className="mt-5"><Tag dot color={selected.user.status === 1 ? 'success' : 'default'}>{selected.user.status === 1 ? '已启用' : '已停用'}</Tag></div>
              <dl className="mt-5 space-y-4 text-xs"><div><dt className="text-slate-500">邮箱</dt><dd className="mt-1 break-all text-slate-700">{selected.user.email || '—'}</dd></div>
                <div><dt className="text-slate-500">用户 ID</dt><dd className="mt-1 flex items-center gap-1 break-all font-mono text-slate-700">{selected.user.id}<CopyButton text={selected.user.id} /></dd></div></dl>
            </div>
            <div className="shrink-0 border-t border-line-soft p-4"><Button size="sm" onClick={() => openResult(selected)}>查看用户<Icon icon="arrow-right" size={13} /></Button></div>
          </> : <div className="m-auto px-5 text-center text-xs leading-6 text-slate-500"><Icon icon="search" size={26} className="mx-auto mb-3 text-slate-300" />{selected?.kind === 'page' ? selected.page.title : '搜索并选择用户，查看详细信息'}</div>}
        </aside>
      </div>
      <div className="flex shrink-0 items-center gap-4 border-t border-line-soft px-4 py-3 text-[11px] text-slate-500">
        <span><Kbd className="!border-slate-200 !bg-slate-50 !text-slate-500">↑↓</Kbd> 选择</span><span><Kbd className="!border-slate-200 !bg-slate-50 !text-slate-500">↵</Kbd> 打开</span>
        <span className="ml-auto"><Kbd className="!border-slate-200 !bg-slate-50 !text-slate-500">Esc</Kbd> 关闭</span>
      </div>
    </div>
  </Modal>;
}
