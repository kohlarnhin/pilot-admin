import { useCan } from '@/hooks/usePermission';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { menuService, flattenMenuTree } from '@/api/services/menuService';
import { useAuthStore } from '@/store/authStore';
import { Card, CardToolbar } from '@/ui/card';
import { DataTable, type ColumnsType } from '@/ui/data-table';
import { Modal } from '@/ui/modal';
import { Input, SearchInput } from '@/ui/input';
import { Button } from '@/ui/button';
import { CodeTag } from '@/ui/badge';
import { Tag } from '@/ui/controls';
import { RowAction, RowActions } from '@/ui/row-action';
import { Spin } from '@/ui/spinner';
import { Icon } from '@/components/icon';
import { getMenuIcon } from '@/components/icon/menuIcons';
import { message } from '@/ui/message';
import { cn } from '@/utils';
import type { Button as MenuButton, Menu } from '@/types';

type RenameTarget = { kind: 'menu'; menu: Menu } | { kind: 'button'; menu: Menu; button: MenuButton };

export const MenusPage: React.FC = () => {
  const can = useCan();
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const canRename = can('menu:update');
  const [tree, setTree] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await menuService.getMenuTree();
      setTree(res.data);
      setSelectedMenuId((current) => current ?? res.data[0]?.id ?? null);
    } catch (err: any) {
      message.error(err.message || '加载菜单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTree(); }, [loadTree]);

  const allMenus = useMemo(() => flattenMenuTree(tree), [tree]);
  const selectedMenu = allMenus.find((menu) => menu.id === selectedMenuId) ?? null;
  const filteredTree = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) return tree;
    const filterNodes = (nodes: Menu[]): Menu[] => nodes.flatMap((menu) => {
      if ([menu.menu_name, menu.menu_code, menu.route_path].some((value) => value?.toLowerCase().includes(query))) return [menu];
      const children = filterNodes(menu.children || []);
      return children.length ? [{ ...menu, children }] : [];
    });
    return filterNodes(tree);
  }, [tree, filterText]);

  const openRename = (target: RenameTarget) => {
    setDisplayName(target.kind === 'menu' ? target.menu.menu_name : target.button.button_name);
    setRenameTarget(target);
  };

  const saveName = async () => {
    if (!renameTarget || !displayName.trim() || !canRename || saving) return;
    setSaving(true);
    try {
      if (renameTarget.kind === 'menu') {
        await menuService.updateMenu(renameTarget.menu.id, { menu_name: displayName.trim() });
      } else {
        await menuService.updateButton(renameTarget.menu.id, renameTarget.button.id, { button_name: displayName.trim() });
      }
      await refreshMe();
      message.success('显示名称已更新');
      setRenameTarget(null);
      await loadTree();
    } catch (err: any) {
      message.error(err.message || '重命名失败');
    } finally {
      setSaving(false);
    }
  };

  const renderNode = (menu: Menu, depth: number): React.ReactNode => {
    const hasChildren = Boolean(menu.children?.length);
    const expanded = Boolean(filterText.trim()) || !collapsedIds.has(menu.id);
    return (
      <div key={menu.id}>
        <button
          type="button"
          aria-current={selectedMenuId === menu.id ? 'true' : undefined}
          aria-expanded={hasChildren ? expanded : undefined}
          onClick={() => {
            setSelectedMenuId(menu.id);
            if (hasChildren) setCollapsedIds((current) => {
              const next = new Set(current);
              if (next.has(menu.id)) next.delete(menu.id);
              else next.add(menu.id);
              return next;
            });
          }}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-md pr-3 text-left text-13 transition-colors hover:bg-slate-50',
            selectedMenuId === menu.id ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600'
          )}
          style={{ paddingLeft: 10 + depth * 20 }}
        >
          {hasChildren ? <ChevronRight className={cn('size-4 shrink-0 text-slate-400', expanded && 'rotate-90')} /> : <span className="size-4 shrink-0" />}
          <Icon icon={getMenuIcon(menu.icon, hasChildren)} size={16} className="shrink-0 text-slate-400" />
          <span className="truncate" title={menu.menu_name}>{menu.menu_name}</span>
          {menu.visible === 0 && <span className="ml-auto text-xs font-normal text-slate-400">隐藏</span>}
        </button>
        {hasChildren && expanded && <div>{menu.children!.map((child) => renderNode(child, depth + 1))}</div>}
      </div>
    );
  };

  const columns: ColumnsType<MenuButton> = [
    { title: '按钮名称', dataIndex: 'button_name', key: 'name', width: '24%', render: (value: string) => <span className="text-13 font-medium text-slate-800">{value}</span> },
    { title: '按钮编码', dataIndex: 'button_code', key: 'code', width: '20%', render: (value: string) => <span className="font-mono text-xs text-slate-600">{value}</span> },
    { title: '权限标识', dataIndex: 'permission_code', key: 'permission', width: '56%', minWidth: 220, render: (value: string) => <CodeTag title={value} className="h-auto min-h-[22px] whitespace-normal break-all leading-5">{value}</CodeTag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 85, render: (value: number) => <Tag dot color={value === 1 ? 'success' : undefined}>{value === 1 ? '已启用' : '已停用'}</Tag> },
  ];
  if (canRename) columns.push({
    title: '操作', key: 'action', width: 84, align: 'center',
    render: (_, button) => <RowActions><RowAction icon="pencil" label="重命名按钮" onClick={() => selectedMenu && openRename({ kind: 'button', menu: selectedMenu, button })} /></RowActions>,
  });

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <PageHeader title="菜单管理" meta={`${allMenus.length} 个菜单`} description="菜单路由与权限标识由系统内置，仅支持修改显示名称" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
        <Card className="min-h-0 w-full shrink-0 lg:w-72 xl:w-80">
          <div className="flex min-h-[60px] items-center border-b border-line-soft px-3">
            <SearchInput placeholder="过滤菜单" value={filterText} onChange={(event) => setFilterText(event.target.value)} className="w-full" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <Spin spinning={loading}>
              <nav aria-label="内置菜单结构">
                {filteredTree.length ? filteredTree.map((menu) => renderNode(menu, 0)) : <EmptyState icon="list-tree" title={filterText ? '无匹配菜单' : '暂无菜单'} />}
              </nav>
            </Spin>
          </div>
        </Card>
        <Card className="min-h-0 flex-1">
          <CardToolbar
            className="min-h-[60px]"
            title={selectedMenu?.menu_name || '菜单详情'}
            actions={canRename && selectedMenu ? <Button size="sm" onClick={() => openRename({ kind: 'menu', menu: selectedMenu })}><Icon icon="pencil" size={14} />重命名菜单</Button> : undefined}
          />
          {selectedMenu && (
            <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-4 border-b border-line-soft px-5 py-5 xl:grid-cols-3">
              <div><dt className="mb-1.5 text-xs text-slate-500">菜单编码</dt><dd><CodeTag>{selectedMenu.menu_code}</CodeTag></dd></div>
              <div><dt className="mb-1.5 text-xs text-slate-500">前端路由</dt><dd className="break-all font-mono text-xs text-slate-700">{selectedMenu.route_path || '—'}</dd></div>
              <div><dt className="mb-1.5 text-xs text-slate-500">图标</dt><dd className="flex items-center gap-2 font-mono text-xs text-slate-700">{selectedMenu.icon ? <><Icon icon={selectedMenu.icon} size={15} />{selectedMenu.icon}</> : '—'}</dd></div>
              <div><dt className="mb-1.5 text-xs text-slate-500">可见性</dt><dd className="text-13 text-slate-700">{selectedMenu.visible === 1 ? '显示' : '隐藏'}</dd></div>
              <div><dt className="mb-1.5 text-xs text-slate-500">菜单状态</dt><dd className="text-13 text-slate-700">{selectedMenu.status === 1 ? '已启用' : '已停用'}</dd></div>
            </dl>
          )}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-5 py-3 text-xs font-medium text-slate-500">按钮权限 {selectedMenu ? `· ${selectedMenu.buttons?.length || 0}` : ''}</div>
            <DataTable
              fill rowKey="id" loading={loading} columns={columns} dataSource={selectedMenu?.buttons || []}
              locale={{ emptyText: selectedMenu
                ? <EmptyState icon="mouse-pointer-click" title="此菜单没有按钮权限" />
                : <EmptyState icon="mouse-pointer-click" title="选择一个菜单" description="在左侧菜单树中选择节点，查看内置路由与权限标识" /> }}
            />
          </div>
        </Card>
      </div>
      <Modal
        open={Boolean(renameTarget)} title={renameTarget?.kind === 'button' ? '重命名按钮' : '重命名菜单'} icon="pencil"
        description="仅修改显示名称" onOk={saveName} onCancel={() => { if (!saving) setRenameTarget(null); }}
        okText="保存名称" confirmLoading={saving} okButtonProps={{ disabled: !displayName.trim() || !canRename }}
        cancelButtonProps={{ disabled: saving }} closable={!saving} maskClosable={!saving} keyboard={!saving}
      >
        <label htmlFor="menu-display-name" className="mb-2 block text-13 text-slate-700">显示名称</label>
        <Input id="menu-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={100} disabled={saving} />
      </Modal>
    </div>
  );
};
