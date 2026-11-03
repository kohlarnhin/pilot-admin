import { t, useT } from '@/i18n';
import { useEffect, useRef, useState } from 'react';
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
  const { locale } = useT();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id || '');
  const recentKey = `pilot-admin:search:recent:v1:${userId}`;
  const [recent, setRecent] = useState<Result[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(recentKey) || '[]');
      if (!Array.isArray(value)) return [];
      return value.filter((item): item is Result => item && typeof item.id === 'string' && ((item.kind === 'page' && typeof item.page?.route === 'string') || (item.kind === 'user' && typeof item.user?.id === 'string' && typeof item.user?.login_name === 'string'))).slice(0, 12);
    } catch { return []; }
  });
  const menus = useAuthStore((state) => state.menus);
  const permissions = useAuthStore((state) => state.permissions);
  const pages = searchTargets(menus, permissions);
  const canSearchUsers = pages.some((page) => page.route === '/system/users');
  const [query, setQuery] = useState('');
  const queryText = query.trim();
  const q = useDebouncedValue(queryText, 200);
  const queryRef = useRef(queryText);
  queryRef.current = queryText;
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
    searchService.searchUsers(q).then((users) => { if (active && queryRef.current === q) setBundle({ query: q, users }); })
      .catch((cause: Error) => { if (active && queryRef.current === q) setError(cause.message || t('search.failed')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q, canSearchUsers, attempt, locale]);

  const searchLoading = Boolean(queryText && canSearchUsers && (loading || q !== queryText));
  const matches = (value: string) => queryText.toLowerCase().split(/\s+/).every((token) => value.toLowerCase().includes(token));
  const pageResults: Result[] = pages.filter((page) => !queryText || matches(`${page.title} ${page.route}`)).map((page) => ({ kind: 'page', id: `page:${page.route}`, page }));
  const userResults: Result[] = queryText && bundle.query === queryText && canSearchUsers ? bundle.users.map((user) => ({ kind: 'user', id: `user:${user.id}`, user })) : [];
  const recentResults = recent.flatMap<Result>((item) => {
    if (item.kind === 'user') return canSearchUsers ? [item] : [];
    const page = pages.find((page) => page.route === item.page.route);
    return page ? [{ ...item, page }] : [];
  });
  const sections = queryText ? [{ id: 'users', title: t('search.users'), items: userResults }, { id: 'pages', title: t('search.pages'), items: pageResults }] : [{ id: 'recent', title: t('search.recent'), items: recentResults }, { id: 'common', title: t('search.common'), items: pageResults.filter((item) => !recentResults.some((recentItem) => recentItem.id === item.id)) }];
  const results = sections.flatMap((section) => section.items);
  const activeIndex = Math.max(0, results.findIndex((result) => result.id === activeId));
  const selected = results[activeIndex];
  const routeFor = (result: Result) => result.kind === 'page' ? result.page.route : `/system/users?keyword=${encodeURIComponent(result.user.login_name)}`;

  const openResult = (result?: Result) => {
    if (!result) return;
    const next = [result, ...recent.filter((item) => item.id !== result.id)].slice(0, 12);
    setRecent(next);
    try { localStorage.setItem(recentKey, JSON.stringify(next)); } catch { /* 私密浏览仅在本次生效。 */ }
    onClose(); navigate(routeFor(result));
  };
  useEffect(() => { setActiveId(null); setError(''); listRef.current?.scrollTo({ top: 0 }); }, [queryText]);
  useEffect(() => { listRef.current?.querySelector(`[data-result-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' }); }, [activeIndex, activeId]);

  const row = (result: Result) => {
    const index = results.indexOf(result);
    const title = result.kind === 'user' ? result.user.user_name : result.page.title;
    const description = result.kind === 'user' ? `@${result.user.login_name} · ${result.user.email || result.user.id}` : result.page.route;
    return <button key={result.id} id={`search-result-${index}`} data-result-index={index} type="button" role="option"
      aria-selected={selected?.id === result.id} onMouseMove={() => setActiveId(result.id)} onFocus={() => setActiveId(result.id)} onClick={() => openResult(result)}
      onPointerEnter={() => void preloadRoute(routeFor(result))}
      className={cn('flex w-full gap-3 rounded-lg px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', selected?.id === result.id ? 'bg-slate-100' : 'hover:bg-slate-50')}>
      <Icon icon={result.kind === 'user' ? 'user' : 'file-text'} size={17} className="mt-0.5 shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1"><span className="block truncate text-13 font-medium text-slate-700" title={title}>{title}</span>
        <span className="mt-1 block truncate font-mono text-[11px] text-slate-600" title={description}>{description}</span></span>
      {selected?.id === result.id && <Icon icon="arrow-right" size={14} className="mt-1 shrink-0 text-slate-400" />}
    </button>;
  };

  return <Modal open ariaLabel={t('search.title')} closable={false} onCancel={onClose} footer={null} width={720} zIndex={1100}
    className="h-[620px] max-h-[calc(100svh-48px)]" bodyClassName="!flex min-h-0 flex-1 !flex-col !overflow-hidden !p-0">
    <div className="flex min-h-0 flex-1 flex-col" onKeyDown={(event) => {
      event.stopPropagation();
      if (event.target !== inputRef.current || event.defaultPrevented) return;
      if (event.nativeEvent.isComposing || composing.current || event.keyCode === 229) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (results.length) setActiveId(results[(activeIndex + direction + results.length) % results.length].id);
      } else if (event.key === 'Enter') { event.preventDefault(); openResult(selected); }
    }}>
      <div className="flex shrink-0 items-center gap-2 border-b border-line-soft px-4 py-3">
        <Input ref={inputRef} prefix={<Icon icon="search" size={17} />} autoFocus role="combobox" aria-label={t('search.label')} aria-autocomplete="list"
          aria-expanded="true" aria-controls="global-search-results" aria-activedescendant={selected ? `search-result-${activeIndex}` : undefined}
          value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} placeholder={t('search.placeholder')}
          onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} className="min-w-0 flex-1" />
        <Button variant="ghost" size="xs" onClick={onClose}>Esc</Button>
      </div>
      <div className="flex min-h-0 flex-1">
        <div ref={listRef} id="global-search-results" role="listbox" aria-label={t('search.results')} aria-busy={searchLoading} className="min-h-0 min-w-0 w-[54%] overflow-y-auto overscroll-contain p-2">
          {sections.filter((section) => section.items.length || ['users', 'recent'].includes(section.id)).map((section) => <div key={section.id} role="group" aria-label={section.title} className="mb-3">
            <div className="px-3 pb-1 pt-2 text-[11px] font-medium text-slate-500">{section.title}</div>{section.items.map(row)}
            {section.id === 'recent' && !section.items.length && <p className="px-3 py-4 text-xs text-slate-500">{t('search.recentEmpty')}</p>}
            {section.id === 'users' && searchLoading && !userResults.length && <div aria-label={t('search.loading')} className="space-y-5 px-3 py-4">{[0, 1, 2].map((index) => <div key={index} className="space-y-2"><Skeleton className="h-3.5 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>)}</div>}
            {section.id === 'users' && !canSearchUsers && <p className="px-3 py-5 text-xs text-slate-500">{t('search.pagesOnly')}</p>}
            {section.id === 'users' && canSearchUsers && !searchLoading && !userResults.length && !error && <p className="px-3 py-5 text-xs text-slate-500">{t('search.noUsers')}</p>}
          </div>)}
          {error && <p role="alert" className="px-3 py-4 text-xs text-slate-600">{error}<Button size="xs" className="ml-2" onClick={() => setAttempt((value) => value + 1)}>{t('common.actions.retry')}</Button></p>}
        </div>
        <aside aria-label={t('search.preview')} className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-line-soft bg-slate-50/40">
          {selected?.kind === 'user' ? <>
            <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mb-4 text-[11px] text-slate-500">{t('search.userPreview')}</div>
              <h2 className="break-words text-base font-medium text-slate-900">{selected.user.user_name}</h2><p className="mt-1 break-all font-mono text-xs text-slate-500">@{selected.user.login_name}</p>
              <div className="mt-5"><Tag dot color={selected.user.status === 1 ? 'success' : 'default'}>{selected.user.status === 1 ? t('common.status.enabled') : t('common.status.disabled')}</Tag></div>
              <dl className="mt-5 space-y-4 text-xs"><div><dt className="text-slate-500">{t('common.fields.email')}</dt><dd className="mt-1 break-all text-slate-700">{selected.user.email || '—'}</dd></div>
                <div><dt className="text-slate-500">{t('search.userId')}</dt><dd className="mt-1 flex items-center gap-1 break-all font-mono text-slate-700">{selected.user.id}<CopyButton text={selected.user.id} /></dd></div></dl>
            </div>
            <div className="shrink-0 border-t border-line-soft p-4"><Button size="sm" onClick={() => openResult(selected)}>{t('search.viewUser')}<Icon icon="arrow-right" size={13} /></Button></div>
          </> : <div className="m-auto px-5 text-center text-xs leading-6 text-slate-500"><Icon icon="search" size={26} className="mx-auto mb-3 text-slate-300" />{selected?.kind === 'page' ? selected.page.title : t('search.selectUser')}</div>}
        </aside>
      </div>
      <div className="flex shrink-0 items-center gap-4 border-t border-line-soft px-4 py-3 text-[11px] text-slate-500">
        <span><Kbd className="!border-slate-200 !bg-slate-50 !text-slate-500">↑↓</Kbd> {t('search.select')}</span><span><Kbd className="!border-slate-200 !bg-slate-50 !text-slate-500">↵</Kbd> {t('search.open')}</span>
        <span className="ml-auto"><Kbd className="!border-slate-200 !bg-slate-50 !text-slate-500">Esc</Kbd> {t('common.actions.close')}</span>
      </div>
    </div>
  </Modal>;
}
