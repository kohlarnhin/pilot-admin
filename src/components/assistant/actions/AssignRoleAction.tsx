import { t, useT } from '@/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { userService } from '@/api/services/userService';
import { roleService } from '@/api/services/roleService';
import { triggerDataChangeSideEffects } from '@/api/services/agentService';
import { useInfinitePage } from '@/hooks/useInfinitePage';
import { useInfiniteScrollLoader } from '@/hooks/useInfiniteScrollLoader';
import { useFixedRowVirtualizer } from '@/hooks/useFixedRowVirtualizer';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Modal } from '@/ui/modal';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Checkbox } from '@/ui/controls';
import { Button } from '@/ui/button';
import { useAuthStore } from '@/store/authStore';
import type { Role, User } from '@/types';
import type { AssistantActionProps } from './registry';
import { registerAssistantAction } from './registry';

export function AssignRoleAction({ onComplete, onCancel }: AssistantActionProps) {
  useT();
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [saving, setSaving] = useState(false);
  const applied = useRef(new Set<string>());
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const q = useDebouncedValue(keyword, 200);
  const fetchPage = useCallback((pageNo: number, pageSize: number) => userService.getUsers({ pageNo, pageSize, keyword: q }).then((res) => res.data), [q]);
  const page = useInfinitePage<User>({ scopeKey: q, getKey: (user) => user.id, fetchPage, onError: (cause) => setListError((cause as Error).message) });
  useEffect(() => { setListError(''); }, [q]);
  const virtual = useFixedRowVirtualizer({ containerRef: scrollRef, itemCount: page.records.length, rowHeight: 48 });
  useInfiniteScrollLoader({ containerRef: scrollRef, sentinelRef, itemCount: page.records.length, hasNext: page.hasNext, initialLoading: page.loading, loadingMore: page.loadingMore, onLoadMore: page.loadMore });
  useEffect(() => {
    let active = true;
    void roleService.getAllRoles().then((items) => { if (active) setRoles(items.filter((role) => role.status === 1)); }).catch((cause: Error) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, []);
  const save = async () => {
    if (saving) return;
    if (!roleId || !selected.size) { setError(t('assistant.assignRoles.selectionRequired')); return; }
    setSaving(true);
    setError('');
    try {
      for (const id of selected) {
        if (applied.current.has(id)) continue;
        await userService.updateUser(id, { role_ids: [roleId] });
        applied.current.add(id);
        triggerDataChangeSideEffects();
      }
      const role = roles.find((item) => item.id === roleId)!;
      await onComplete({ status: 'completed', summary: t('assistant.assignRoles.completed', { count: selected.size, role: role.role_name }), count: selected.size });
      const auth = useAuthStore.getState();
      if (auth.user && selected.has(auth.user.id)) await auth.refreshMe();
    } catch (cause) {
      setError(applied.current.size ? t('assistant.assignRoles.partialError', { error: (cause as Error).message, count: applied.current.size }) : (cause as Error).message);
    } finally { setSaving(false); }
  };
  return <Modal open title={t('agentCommands.assignRoles.primary')} icon="users" width={640} keyboard={false} maskClosable={false} confirmLoading={saving}
    onOk={save} onCancel={() => { void (applied.current.size ? onComplete({ status: 'completed', summary: t('assistant.assignRoles.cancelledRest', { count: applied.current.size }), count: applied.current.size }) : onCancel()).catch((cause: Error) => setError(cause.message)); }} okText={t('assistant.assignRoles.save')} description={t('assistant.assignRoles.description')}>
    <div className="space-y-4">
      <label className="block text-13 text-slate-600">{t('assistant.assignRoles.targetRole')}<Select aria-label={t('assistant.assignRoles.targetRole')} className="mt-2 w-full" value={roleId} disabled={saving || applied.current.size > 0} onChange={setRoleId} options={roles.map((role) => ({ value: role.id, label: role.role_name }))} /></label>
      <Input.Search aria-label={t('assistant.assignRoles.searchLabel')} value={keyword} disabled={saving} onChange={(event) => setKeyword(event.target.value)} placeholder={t('assistant.assignRoles.searchPlaceholder')} />
      <div className="rounded-xl border border-line"><div className="border-b border-line px-3 py-2 text-xs text-slate-500">{t('assistant.assignRoles.selected', { count: selected.size })}</div>
        <div ref={scrollRef} className="relative h-64 overflow-y-auto overscroll-contain" aria-label={t('assistant.assignRoles.listLabel')}>
          {page.loading ? <p className="p-4 text-xs text-slate-500">{t('assistant.assignRoles.loading')}</p> : <div style={{ height: page.records.length * 48, position: 'relative' }}>{page.records.slice(virtual.start, virtual.end).map((user, offset) => {
            const row = { size: 48, start: (virtual.start + offset) * 48 };
            return <div key={user.id} className="absolute left-0 top-0 flex w-full items-center border-b border-line-soft px-3" style={{ height: row.size, transform: `translateY(${row.start}px)` }}><Checkbox checked={selected.has(user.id)} disabled={saving || applied.current.has(user.id)} aria-label={t('assistant.selection.optionLabel', { label: user.user_name })} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(user.id); else next.delete(user.id); return next; })}><span className="text-xs">{user.user_name}<span className="ml-2 font-mono text-slate-500">{user.login_name}</span></span></Checkbox></div>;
          })}</div>}
          <div ref={sentinelRef} className="h-px" />
          {listError ? <p role="alert" className="p-3 text-xs text-red-600">{listError}<Button size="xs" onClick={() => { setListError(''); void page.retry(); }}>{t('common.actions.retry')}</Button></p> : null}
        </div>
      </div>
      {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
    </div>
  </Modal>;
}
registerAssistantAction('users.assign-role', AssignRoleAction);
