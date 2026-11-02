import { useEffect, useState } from 'react';
import { t, useT } from '@/i18n';
import { profileService, type ProfilePermissionGroup } from '@/api/services/profileService';
import { isUnauthorizedError } from '@/api/errors';
import { useAuthStore } from '@/store/authStore';
import { useDataChanged } from '@/hooks/useDataChanged';
import { canAccessPage } from '@/routes/access';
import { adminPages, resolvePage } from '@/routes/routeModules';
import { canAccessAgent } from '@/agent/access';
import { isParameterizedPage } from '@/routes/pageResolver';
import { Icon } from '@/components/icon';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/ui/controls';
import { Button } from '@/ui/button';
import { CardContent } from '@/ui/card';
import { Skeleton } from '@/ui/skeleton';
import type { Menu } from '@/types';

interface PageNode {
  id: string;
  name: string;
  icon?: string;
  route?: string;
  children: PageNode[];
}

function PageTree({ nodes }: { nodes: PageNode[] }) {
  return <ul className="space-y-1">
    {nodes.map((node) => <li key={node.id}>
      <div className="flex min-h-10 min-w-0 items-center gap-2.5 py-2 text-13">
        <Icon icon={node.icon || (node.children.length ? 'folder' : 'file')} size={16} className="shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate text-slate-700" title={node.name}>{node.name}</span>
        {node.route ? <span className="max-w-[55%] truncate font-mono text-[11px] text-slate-400" title={node.route}>{node.route}</span> : null}
      </div>
      {node.children.length ? <div className="ml-2 border-l border-line-soft pl-5"><PageTree nodes={node.children} /></div> : null}
    </li>)}
  </ul>;
}

export function ProfilePermissions() {
  const { locale } = useT();
  const menus = useAuthStore((state) => state.menus);
  const permissions = useAuthStore((state) => state.permissions);
  const roles = useAuthStore((state) => state.roles);
  const roleNames = useAuthStore((state) => state.roleNames);
  const [groups, setGroups] = useState<ProfilePermissionGroup[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useDataChanged((reason) => { if (reason === 'data') setAttempt((value) => value + 1); });
  useEffect(() => {
    let active = true;
    setError('');
    setGroups(null);
    void profileService.getPermissions().then((result) => { if (active) setGroups(result.data); }).catch((cause: Error) => {
      if (!active) return;
      setError(cause.message || t('common.errors.loadData'));
      if (isUnauthorizedError(cause)) void useAuthStore.getState().refreshMe().catch(() => undefined);
    });
    return () => { active = false; };
  }, [locale, permissions, attempt]);

  const walk = (items: Menu[]): PageNode[] => [...items].sort((a, b) => a.sort_no - b.sort_no).flatMap((menu) => {
    if (menu.status === 0 || menu.visible === 0) return [];
    const children = walk(menu.children || []);
    const page = resolvePage(menu.route_path)?.page;
    const accessible = page && !isParameterizedPage(page) && canAccessPage(menu.route_path, { menus, permissions });
    return accessible || children.length ? [{ id: menu.id, name: menu.menu_name, icon: menu.icon, route: accessible ? menu.route_path : undefined, children }] : [];
  });
  const pages = walk(menus);
  for (const page of adminPages) {
    if (!isParameterizedPage(page) && page.access === 'authenticated' && page.titleKey && canAccessPage(page.path, { menus, permissions })) {
      pages.push({ id: page.path, name: t(page.titleKey), icon: 'user', route: page.path, children: [] });
    }
  }
  if (canAccessAgent(menus, permissions)) pages.push({ id: '/agent', name: t('agentMode.title'), icon: 'square-terminal', route: '/agent', children: [] });
  const countPages = (nodes: PageNode[]): number => nodes.reduce((count, node) => count + (node.route ? 1 : 0) + countPages(node.children), 0);
  return <CardContent className="min-h-0 flex-1 space-y-6 overflow-y-auto">
    <section aria-label={t('profile.permissions.roles')}>
      <h3 className="mb-3 text-13 font-medium text-slate-900">{t('profile.permissions.roles')}</h3>
      {roles.length ? <div className="space-y-2">{roles.map((code, index) => <div key={code} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
        <span className="min-w-0 truncate text-13 text-slate-700" title={roleNames[index]}>{roleNames[index] || code}</span><code className="max-w-[55%] shrink-0 truncate text-[11px] text-slate-500" title={code}>{code}</code>
      </div>)}</div> : <p className="text-xs text-slate-500">{t('profile.permissions.noRoles')}</p>}
    </section>
    <section aria-label={t('profile.permissions.pages')} className="border-t border-line-soft pt-5">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-13 font-medium text-slate-900">{t('profile.permissions.pages')}</h3><span className="text-xs text-slate-500">{t('profile.permissions.pageCount', { count: countPages(pages) })}</span></div>
      <PageTree nodes={pages} />
    </section>
    <section aria-label={t('profile.permissions.actions')} className="border-t border-line-soft pt-5">
      <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-13 font-medium text-slate-900">{t('profile.permissions.actions')}</h3><span className="text-xs text-slate-500">{t('profile.permissions.actionCount', { count: groups?.reduce((count, group) => count + group.actions.length, 0) ?? '—' })}</span></div>
      {error ? <Alert type="error" title={error} action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>{t('common.actions.retry')}</Button>} /> : groups === null ? <div className="space-y-3"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div> : groups.length ? <div className="space-y-5">
        {groups.map((group) => <div key={group.id}><h4 className="mb-2 text-xs font-medium text-slate-500">{group.name}</h4><ul className="divide-y divide-line-soft">{group.actions.map((action) => <li key={action.code} className="flex min-w-0 items-center justify-between gap-3 py-2.5">
          <span className="min-w-0 truncate text-13 text-slate-700" title={action.name}>{action.name}</span><code className="max-w-[55%] shrink-0 truncate text-[11px] text-slate-500" title={action.code}>{action.code}</code>
        </li>)}</ul></div>)}
      </div> : <EmptyState icon="shield-check" title={t('profile.permissions.noActions')} description={t('profile.permissions.readOnlyHint')} />}
    </section>
  </CardContent>;
}
