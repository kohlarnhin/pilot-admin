import { useCan } from '@/hooks/usePermission';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { FixedTable } from '../../components/common/FixedTable';
import { roleService, type RoleWithPermissions } from '../../api/services/roleService';
import { useInfinitePage } from '../../hooks/useInfinitePage';
import type { Menu, Button as MenuButton } from '../../types';
import { Card, CardContent } from '@/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { RowAction, RowActions } from '@/ui/row-action';
import { Button } from '@/ui/button';
import { Badge, CodeTag } from '@/ui/badge';
import { Icon } from '@/components/icon';
import { flattenMenuTree } from '../../api/services/menuService';
import { Input } from '@/ui/input';
import { Modal } from '@/ui/modal';
import { Form } from '@/ui/form';
import { message } from '@/ui/message';
import { Alert, Checkbox, Switch } from '@/ui/controls';
import { Spin } from '@/ui/spinner';
import { Tooltip } from '@/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { getMenuIcon } from '@/components/icon/menuIcons';
import type { ColumnsType } from '@/ui/data-table';
import dayjs from 'dayjs';


export const RolesPage: React.FC = () => {
  const can = useCan();
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const canCreate = can('role:create');
  const canEdit = can('role:update');
  const canConfigure = can('role:permissions');
  const canDelete = can('role:delete');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [buttons, setButtons] = useState<MenuButton[]>([]);
  const [loadError, setLoadError] = useState('');
  const [total, setTotal] = useState<number>(0);

  // Add / Edit Role Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [form] = Form.useForm();

  // Permission Modal
  const [isPermModalOpen, setIsPermModalOpen] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<RoleWithPermissions | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);
  const [selectedButtonIds, setSelectedButtonIds] = useState<string[]>([]);
  const [savingPerm, setSavingPerm] = useState<boolean>(false);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [loadingPermissionResources, setLoadingPermissionResources] = useState(true);
  const [permissionResourcesReady, setPermissionResourcesReady] = useState(false);
  const permissionRequestRef = useRef(0);

  const flatMenus = useMemo(() => flattenMenuTree(menus), [menus]);
  const menuById = useMemo(
    () => new Map(flatMenus.map((menu) => [menu.id, menu])),
    [flatMenus]
  );
  const buttonById = useMemo(
    () => new Map(buttons.map((button) => [button.id, button])),
    [buttons]
  );
  const selectedMenuIdSet = useMemo(() => new Set(selectedMenuIds), [selectedMenuIds]);
  const selectedButtonIdSet = useMemo(() => new Set(selectedButtonIds), [selectedButtonIds]);
  const buttonsByMenuId = useMemo(() => {
    const grouped = new Map<string, MenuButton[]>();
    buttons.forEach((button) => {
      const menuButtons = grouped.get(button.menu_id) || [];
      menuButtons.push(button);
      grouped.set(button.menu_id, menuButtons);
    });
    return grouped;
  }, [buttons]);

  const menuHierarchyById = useMemo(() => {
    const hierarchies = new Map<string, { menuIds: string[]; grantable: boolean }>();

    flatMenus.forEach((menu) => {
      const hierarchyMenuIds: string[] = [];
      const visitedMenuIds = new Set<string>();
      let currentMenu: Menu | undefined = menu;
      let grantable = true;

      while (currentMenu) {
        if (visitedMenuIds.has(currentMenu.id)) {
          grantable = false;
          break;
        }
        visitedMenuIds.add(currentMenu.id);
        if (currentMenu.id === menu.id || !currentMenu.route_path) hierarchyMenuIds.push(currentMenu.id);
        if (currentMenu.status !== 1) grantable = false;

        const parentId = currentMenu.parent_id;
        if (!parentId) break;
        currentMenu = menuById.get(parentId);
        if (!currentMenu) grantable = false;
      }

      hierarchies.set(menu.id, { menuIds: hierarchyMenuIds, grantable });
    });

    return hierarchies;
  }, [flatMenus, menuById]);

  const grantableMenuIds = useMemo(() => new Set(
    Array.from(menuHierarchyById.entries())
      .filter(([, hierarchy]) => hierarchy.grantable)
      .map(([menuId]) => menuId)
  ), [menuHierarchyById]);

  const addMenusWithAncestors = useCallback((currentIds: string[], menuIds: string[]) => {
    const nextIds = new Set(currentIds);
    for (const menuId of menuIds) {
      const hierarchy = menuHierarchyById.get(menuId);
      (hierarchy?.menuIds || [menuId]).forEach((requiredMenuId) => nextIds.add(requiredMenuId));
    }
    return Array.from(nextIds);
  }, [menuHierarchyById]);

  const normalizePermissionSelection = useCallback((menuIds: string[], buttonIds: string[]) => {
    const requiredMenuIds = buttonIds.flatMap((buttonId) => {
      const button = buttonById.get(buttonId);
      return button ? [button.menu_id] : [];
    });
    return {
      menuIds: addMenusWithAncestors(menuIds, [...menuIds, ...requiredMenuIds]),
      buttonIds,
    };
  }, [addMenusWithAncestors, buttonById]);

  const collectMenuSubtreeIds = useCallback((rootMenu: Menu) => {
    const subtreeIds = new Set<string>();
    const pendingMenus: Menu[] = [rootMenu];
    while (pendingMenus.length > 0) {
      const currentMenu = pendingMenus.pop();
      if (!currentMenu || subtreeIds.has(currentMenu.id)) continue;
      subtreeIds.add(currentMenu.id);
      pendingMenus.push(...(currentMenu.children || []));
    }
    return subtreeIds;
  }, []);

  const removeMenusAndButtons = useCallback((menuIdsToRemove: Set<string>) => {
    setSelectedMenuIds((currentIds) => currentIds.filter((id) => !menuIdsToRemove.has(id)));
    setSelectedButtonIds((currentIds) => currentIds.filter((id) => {
      const button = buttonById.get(id);
      return !button || !menuIdsToRemove.has(button.menu_id);
    }));
  }, [buttonById]);

  const fetchRoles = useCallback(async (pageNo: number, pageSize: number) => {
    const response = await roleService.getRoles({ pageNo, pageSize });
    return response.data;
  }, []);

  /** 列表页启用/停用切换（乐观更新 + 失败回滚） */
  const handleToggleStatus = async (role: RoleWithPermissions, checked: boolean) => {
    const newStatus = checked ? 1 : 0;
    setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, status: newStatus } : r)));
    try {
      await roleService.updateRoleStatus(role.id, newStatus);
      await refreshMe();
      if (checked) {
      message.success(`角色【${role.role_name}】已启用`);
    } else {
      message.warning(`角色【${role.role_name}】已停用`);
    }
    } catch (err: any) {
      setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, status: role.status } : r)));
      message.error(err.message || '操作失败');
    }
  };

  const {
    records: roles,
    setRecords: setRoles,
    hasNext,
    loading,
    refreshing,
    loadingMore,
    loadMore,
    reload,
    retry,
  } = useInfinitePage({
    fetchPage: fetchRoles,
    getKey: (role: RoleWithPermissions) => role.id,
    onError: (error) => { const text = (error as Error).message || '加载角色列表失败'; setLoadError(text); message.error(text); },
  });

  const ensureRolePermissions = useCallback(async (
    role: RoleWithPermissions
  ): Promise<RoleWithPermissions> => {
    if (role.permissionsLoaded) return role;
    const permissions = await roleService.getRolePermissions(role.id);
    const enrichedRole: RoleWithPermissions = {
      ...role,
      ...permissions,
      menu_count: permissions.menuIds.length,
      button_count: permissions.buttonIds.length,
      permissionsLoaded: true,
    };
    setRoles((current) => current.map((item) => (
      item.id === role.id
        ? {
            ...item,
            ...permissions,
            menu_count: permissions.menuIds.length,
            button_count: permissions.buttonIds.length,
            permissionsLoaded: true,
          }
        : item
    )));
    return enrichedRole;
  }, [setRoles]);

  const loadPermissionResources = useCallback(async () => {
    setLoadingPermissionResources(true);
    setPermissionResourcesReady(false);
    try {
      const response = await roleService.getMenusAndButtons();
      setMenus(response.data.menus);
      setButtons(response.data.buttons);
      setPermissionResourcesReady(true);
    } catch (error) {
      message.error((error as Error).message || '加载菜单按钮权限失败');
    } finally {
      setLoadingPermissionResources(false);
    }
  }, []);

  const loadCount = useCallback(async () => {
    try {
      setTotal(await roleService.countRoles());
    } catch (error) {
      message.error((error as Error).message || '加载角色总数失败');
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadPermissionResources(), loadCount()]);
  }, [loadCount, loadPermissionResources]);

  // 打开历史角色时补齐旧数据中缺失的所属菜单与父级，确保界面所见即保存结果。
  useEffect(() => {
    if (!isPermModalOpen || loadingRolePermissions || !permissionResourcesReady) return;
    setSelectedMenuIds((currentMenuIds) => {
      const normalizedMenuIds = normalizePermissionSelection(
        currentMenuIds,
        selectedButtonIds
      ).menuIds;
      const currentMenuIdSet = new Set(currentMenuIds);
      const unchanged = normalizedMenuIds.length === currentMenuIds.length
        && normalizedMenuIds.every((menuId) => currentMenuIdSet.has(menuId));
      return unchanged ? currentMenuIds : normalizedMenuIds;
    });
  }, [
    isPermModalOpen,
    loadingRolePermissions,
    normalizePermissionSelection,
    permissionResourcesReady,
    selectedButtonIds,
  ]);

  const refreshRoles = () => {
    reload();
    void loadCount();
  };

  const handleOpenAddModal = () => {
    setEditingRole(null);
    form.resetFields();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleWithPermissions) => {
    setEditingRole(role);
    form.setFieldsValue({
      role_name: role.role_name,
      role_code: role.role_code,
      description: role.description || '',
    });
    setIsAddModalOpen(true);
  };

  const handleRoleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRole) {
        await roleService.updateRole(editingRole.id, {
          role_name: values.role_name,
          role_code: values.role_code,
          description: values.description,
        });
        await refreshMe();
        message.success('修改角色成功');
      } else {
        await roleService.createRole({
          role_name: values.role_name,
          role_code: values.role_code,
          description: values.description,
        });
        message.success('新增角色成功');
      }
      setIsAddModalOpen(false);
      refreshRoles();
    } catch (err: any) {
      // 表单校验失败：错误已内联展示在字段下方，不再弹出错误提示
      if (err?.errorFields) return;
      message.error(err.message || '保存失败');
    }
  };

  const handleOpenPermModal = async (role: RoleWithPermissions) => {
    const requestId = permissionRequestRef.current + 1;
    permissionRequestRef.current = requestId;
    const initialSelection = normalizePermissionSelection(role.menuIds || [], role.buttonIds || []);
    setCurrentRole(role);
    setSelectedMenuIds(initialSelection.menuIds);
    setSelectedButtonIds(initialSelection.buttonIds);
    setIsPermModalOpen(true);
    setLoadingRolePermissions(!role.permissionsLoaded);

    try {
      const resolvedRole = await ensureRolePermissions(role);
      if (permissionRequestRef.current !== requestId) return;
      const resolvedSelection = normalizePermissionSelection(
        resolvedRole.menuIds,
        resolvedRole.buttonIds
      );
      setCurrentRole(resolvedRole);
      setSelectedMenuIds(resolvedSelection.menuIds);
      setSelectedButtonIds(resolvedSelection.buttonIds);
    } catch (error) {
      if (permissionRequestRef.current === requestId) {
        message.error((error as Error).message || '加载角色权限失败');
      }
    } finally {
      if (permissionRequestRef.current === requestId) {
        setLoadingRolePermissions(false);
      }
    }
  };

  const handleClosePermModal = () => {
    permissionRequestRef.current += 1;
    setLoadingRolePermissions(false);
    setIsPermModalOpen(false);
  };

  // 后端要求按钮依附菜单、子菜单依附父级；前端同步维护这一授权不变量。
  const handleToggleMenu = (menu: Menu) => {
    if (selectedMenuIdSet.has(menu.id)) {
      removeMenusAndButtons(collectMenuSubtreeIds(menu));
      return;
    }
    if (!grantableMenuIds.has(menu.id)) return;
    setSelectedMenuIds((currentIds) => addMenusWithAncestors(currentIds, [menu.id]));
  };

  const handleToggleButton = (button: MenuButton) => {
    if (selectedButtonIdSet.has(button.id)) {
      setSelectedButtonIds((currentIds) => currentIds.filter((id) => id !== button.id));
      return;
    }
    if (button.status !== 1 || !grantableMenuIds.has(button.menu_id)) return;
    setSelectedMenuIds((currentIds) => addMenusWithAncestors(currentIds, [button.menu_id]));
    setSelectedButtonIds((currentIds) => Array.from(new Set([...currentIds, button.id])));
  };

  const resolveMenuIcon = (menu: Menu) => getMenuIcon(menu.icon, Boolean(menu.children?.length));

  // 全选时跳过已停用资源，避免提交后端无法授予的权限。
  const handleSelectAll = () => {
    const allMenuIds = flatMenus.filter((menu) => grantableMenuIds.has(menu.id)).map((menu) => menu.id);
    const allButtonIds = buttons
      .filter((button) => button.status === 1 && grantableMenuIds.has(button.menu_id))
      .map((button) => button.id);
    setSelectedMenuIds(allMenuIds);
    setSelectedButtonIds(allButtonIds);
  };

  // 清空选择
  const handleClearAll = () => {
    setSelectedMenuIds([]);
    setSelectedButtonIds([]);
  };

  // 页面内按钮一键全选 / 反选
  const handleTogglePageButtons = (pageMenuId: string, pageButtons: MenuButton[]) => {
    const activeButtons = pageButtons.filter(
      (button) => button.status === 1 && grantableMenuIds.has(button.menu_id)
    );
    if (activeButtons.length === 0) return;
    const activeButtonIds = activeButtons.map((b) => b.id);
    const activeButtonIdSet = new Set(activeButtonIds);
    const allSelected = activeButtonIds.every((id) => selectedButtonIdSet.has(id));

    if (allSelected) {
      setSelectedButtonIds((current) => current.filter((id) => !activeButtonIdSet.has(id)));
    } else {
      setSelectedMenuIds((current) => addMenusWithAncestors(current, [pageMenuId]));
      setSelectedButtonIds((current) => Array.from(new Set([...current, ...activeButtonIds])));
    }
  };

  // 模块内所有子页面一键全选 / 反选
  const handleToggleModule = (moduleMenu: Menu) => {
    const subtreeMenuIds = collectMenuSubtreeIds(moduleMenu);
    const targetMenuIds = Array.from(subtreeMenuIds)
      .filter((menuId) => grantableMenuIds.has(menuId));
    const allSelected = targetMenuIds.length > 0
      && targetMenuIds.every((menuId) => selectedMenuIdSet.has(menuId));

    if (allSelected) {
      removeMenusAndButtons(subtreeMenuIds);
    } else {
      setSelectedMenuIds((current) => addMenusWithAncestors(current, targetMenuIds));
    }
  };

  const handleSavePermissions = async () => {
    if (!currentRole) return;
    const normalizedSelection = normalizePermissionSelection(selectedMenuIds, selectedButtonIds);
    setSavingPerm(true);
    try {
      await roleService.updateRolePermissions(
        currentRole.id,
        normalizedSelection.menuIds,
        normalizedSelection.buttonIds
      );
      await refreshMe();
      message.success(`角色【${currentRole.role_name}】权限配置已更新`);
      setIsPermModalOpen(false);
      setRoles((current) => current.map((role) => role.id === currentRole.id
        ? {
            ...role,
            menuIds: normalizedSelection.menuIds,
            buttonIds: normalizedSelection.buttonIds,
            menu_count: normalizedSelection.menuIds.length,
            button_count: normalizedSelection.buttonIds.length,
            permissionsLoaded: true,
          }
        : role));
    } catch (err: any) {
      message.error(err.message || '保存权限失败');
    } finally {
      setSavingPerm(false);
    }
  };

  const handleDelete = (role: RoleWithPermissions) => {
    Modal.confirm({
      title: '删除角色', content: `确定删除角色「${role.role_name}」吗？正在使用的角色需先解除用户关联。`, okText: '确认删除', okType: 'danger',
      onOk: async () => { await roleService.deleteRole(role.id); message.success('角色已删除'); refreshRoles(); },
    });
  };

  const columns: ColumnsType<RoleWithPermissions> = [
    {
      title: '角色',
      dataIndex: 'role_name',
      key: 'role_name',
      width: '30%',
      render: (name: string, record) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-slate-50 text-slate-500">
            <Icon icon="shield-check" size={17} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-13 font-medium text-slate-900" title={name}>{name}</div>
            <div className="truncate text-xs text-slate-500" title={record.description}>{record.description || '暂无说明'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '角色编码',
      dataIndex: 'role_code',
      key: 'role_code',
      width: '22%',
      render: (code: string) => <CodeTag className="select-all">{code}</CodeTag>,
    },
    {
      title: '授权资源',
      key: 'permsCount',
      width: '18%',
      render: (_, record) => (
        <span className="whitespace-nowrap text-13 text-slate-600">
          <span className="font-mono tabular-nums text-slate-900">{record.menu_count || 0}</span> 菜单
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="font-mono tabular-nums text-slate-900">{record.button_count || 0}</span> 按钮
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 88,
      align: 'center',
      render: (status: number, record) => (
        <Switch
          size="small"
          disabled={!canEdit}
          checked={status === 1}
          onChange={(checked) => handleToggleStatus(record, checked)}
          aria-label={status === 1 ? '停用角色' : '启用角色'}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_date',
      key: 'create_date',
      width: 156,
      render: (date: string) => (
        <span className="whitespace-nowrap font-mono text-xs text-slate-500">
          {dayjs(date).format('YYYY-MM-DD HH:mm')}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 144,
      align: 'center',
      render: (_, record) => (
        <RowActions>
          {canEdit && <RowAction size="sm" icon="pencil" label="编辑角色" onClick={() => handleOpenEditModal(record)} />}
          {canConfigure && <RowAction size="sm" icon="shield-check" label="配置权限" onClick={() => handleOpenPermModal(record)} />}
          {canDelete && <RowAction size="sm" icon="trash-2" label="删除角色" tone="danger" disabled={record.id === 'role-admin'} disabledReason="内置超级管理员角色不可删除" onClick={() => handleDelete(record)} />}
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {loadError && <Alert type="error" title={loadError} action={<Button size="xs" onClick={() => { setLoadError(''); void retry(); }}>重试</Button>} className="mb-4 shrink-0" />}
      <PageHeader
        title="角色管理"
        description="维护系统角色，按菜单与按钮鉴权编码进行细粒度授权"
        meta={`共 ${total} 个角色`}
        actions={canCreate ?
          <Button onClick={handleOpenAddModal}>
            <Icon icon="plus" size={16} />
            新增角色
          </Button> : undefined
        }
      />
      <Card className="min-h-0 flex-1">

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <FixedTable
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={loading}
            refreshing={refreshing}
            loadingMore={loadingMore}
            hasNext={hasNext}
            onLoadMore={loadMore}
            locale={{
              emptyText: (
                <EmptyState
                  title={loadError ? '数据加载失败' : '暂无角色'}
                  description={loadError ? '请点击上方重试，重新加载角色列表' : '点击右上角「新增角色」，定义职责与权限边界'}
                  icon="shield-check"
                />
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Role Modal */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        icon={editingRole ? 'square-pen' : 'shield-check'}
        description={editingRole ? editingRole.role_code : '定义角色职责，稍后可配置菜单与按钮权限'}
        open={isAddModalOpen}
        onOk={handleRoleSubmit}
        onCancel={() => setIsAddModalOpen(false)}
        okText={editingRole ? '保存' : '创建'}
        width={480}
      >
        <Form form={form}>
          <Form.Item
            name="role_name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="例如：审计人员" />
          </Form.Item>

          <Form.Item
            name="role_code"
            label="角色编码"
            labelExtra={<span className="text-slate-400">仅支持字母、数字和下划线</span>}
            rules={[
              { required: true, message: '请输入角色编码' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字和下划线' },
            ]}
          >
            <Input placeholder="例如：ROLE_AUDITOR" className="font-mono" disabled={Boolean(editingRole)} />
          </Form.Item>

          <Form.Item name="description" label="角色说明" className="mb-0">
            <Input.TextArea placeholder="简要说明该角色的业务范围（选填）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Assignment Modal */}
      <Modal
        title="配置角色权限"
        icon="shield-check"
        description={
          currentRole ? (
            <>
              为 <span className="font-medium text-slate-700">{currentRole.role_name}</span>
              <span className="mx-1 font-mono text-slate-400">({currentRole.role_code})</span>
              分配可访问的菜单与操作权限，当前账号保存后立即生效，其他账号重新登录后生效
            </>
          ) : undefined
        }
        open={isPermModalOpen}
        onCancel={handleClosePermModal}
        onOk={handleSavePermissions}
        okText="保存权限"
        confirmLoading={savingPerm}
        okButtonProps={{ disabled: loadingRolePermissions || loadingPermissionResources || !permissionResourcesReady }}
        cancelButtonProps={{ disabled: savingPerm }}
        width={920}
      >
        {loadingRolePermissions || loadingPermissionResources ? (
          <div className="flex h-[360px] items-center justify-center">
            <Spin tip={loadingPermissionResources ? '正在读取菜单与按钮资源' : '正在读取角色权限'} />
          </div>
        ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-slate-50/70 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-900" />
                已选菜单 <strong className="font-mono text-sm font-semibold text-slate-900">{selectedMenuIds.length}</strong>
                <span className="font-mono text-slate-300">/{flatMenus.length}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                已选按钮 <strong className="font-mono text-sm font-semibold text-slate-900">{selectedButtonIds.length}</strong>
                <span className="font-mono text-slate-300">/{buttons.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="xs" onClick={handleSelectAll}>
                全选可用资源
              </Button>
              <Button variant="subtle" size="xs" onClick={handleClearAll}>
                清空
              </Button>
            </div>
          </div>

          <Alert
            type="warning"
            title="菜单与操作联动授权"
            description="勾选操作会自动补齐所属页面及父级菜单；取消菜单会同步移除其下级菜单和相关操作权限。"
          />

          {/* Modular Permission Matrix List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-13 font-medium text-slate-800">模块与页面权限</span>
              <span className="text-xs text-slate-400">勾选页面控制可访问性，右侧网格配置按钮操作权限</span>
            </div>

            <div className="space-y-3">
              {menus.length === 0 ? (
                <EmptyState
                  description="请先在菜单管理中创建菜单和按钮"
                  icon="shield-check"
                  minHeight={240}
                />
              ) : (
                menus.map((moduleMenu) => {
                  const hasChildren = moduleMenu.children && moduleMenu.children.length > 0;
                  const isModuleChecked = selectedMenuIdSet.has(moduleMenu.id);
                  const isModuleGrantable = grantableMenuIds.has(moduleMenu.id);

                  if (hasChildren) {
                    const activeChildren = moduleMenu.children!
                      .filter((menu) => grantableMenuIds.has(menu.id));
                    return (
                      <div
                        key={moduleMenu.id}
                        className="overflow-hidden rounded-xl border border-line bg-white"
                      >
                        {/* Module Header Bar */}
                        <div className="flex items-center justify-between border-b border-line-soft bg-slate-50/70 px-4 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-white text-slate-600">
                              <Icon icon={resolveMenuIcon(moduleMenu)} size={14} />
                            </div>
                            <Checkbox
                              checked={isModuleChecked}
                              disabled={!isModuleGrantable && !isModuleChecked}
                              onChange={() => handleToggleMenu(moduleMenu)}
                            >
                              <span className="text-13 font-medium text-slate-900">
                                {moduleMenu.menu_name}
                              </span>
                            </Checkbox>
                            <span className="text-[11px] font-mono text-slate-300 truncate">
                              {moduleMenu.route_path}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="font-normal">
                              {activeChildren.length} 个子页面
                            </Badge>
                            <Button
                              size="xs"
                              onClick={() => handleToggleModule(moduleMenu)}
                              disabled={!isModuleGrantable}
                            >
                              全选模块页面
                            </Button>
                          </div>
                        </div>

                        {/* Column Header */}
                        <div className="grid grid-cols-12 items-center gap-3 border-b border-line-soft px-4 py-2 text-xs font-medium text-slate-400">
                          <div className="col-span-3">页面导航</div>
                          <div className="col-span-7">操作按钮权限</div>
                          <div className="col-span-2 text-right">快捷操作</div>
                        </div>

                        {/* Sub-pages Rows */}
                        <div className="divide-y divide-slate-50">
                          {moduleMenu.children!.map((childMenu) => {
                            const isChildChecked = selectedMenuIdSet.has(childMenu.id);
                            const isChildGrantable = grantableMenuIds.has(childMenu.id);
                            const directButtons = buttonsByMenuId.get(childMenu.id) || [];
                            const activeDirectButtons = directButtons.filter(
                              (button) => button.status === 1 && isChildGrantable
                            );
                            const selectedCount = directButtons.filter((b) => selectedButtonIdSet.has(b.id)).length;
                            const isAllButtonsSelected = activeDirectButtons.length > 0 && activeDirectButtons.every((b) => selectedButtonIdSet.has(b.id));

                            return (
                              <div
                                key={childMenu.id}
                                className="grid grid-cols-12 gap-3 px-4 py-3 items-start hover: transition-colors"
                              >
                                {/* Col 1: Page (col-span-3) */}
                                <div className="col-span-3 min-w-0 pr-2 pt-0.5">
                                  <Checkbox
                                    checked={isChildChecked}
                                    disabled={!isChildGrantable && !isChildChecked}
                                    onChange={() => handleToggleMenu(childMenu)}
                                  >
                                    <span className="text-xs font-medium text-slate-800 truncate block max-w-[150px]" title={childMenu.menu_name}>
                                      {childMenu.menu_name}
                                    </span>
                                  </Checkbox>
                                  <div className="pl-6 text-[11px] font-mono text-slate-300 truncate" title={childMenu.route_path}>
                                    {childMenu.route_path}
                                  </div>
                                </div>

                                {/* Col 2: Buttons Grid (col-span-7) */}
                                <div className="col-span-7 min-w-0 pt-0.5">
                                  {directButtons.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5">
                                      {directButtons.map((btn) => {
                                        const isBtnChecked = selectedButtonIdSet.has(btn.id);
                                        return (
                                          <Tooltip
                                            key={btn.id}
                                            title={<span className="font-mono text-xs">权限码: {btn.permission_code}</span>}
                                          >
                                            <div className="flex items-center min-w-0">
                                              <Checkbox
                                                checked={isBtnChecked}
                                                disabled={(btn.status !== 1 || !isChildGrantable) && !isBtnChecked}
                                                onChange={() => handleToggleButton(btn)}
                                              >
                                                <span className="text-xs text-slate-600 truncate block select-none" title={btn.button_name}>
                                                  {btn.button_name}
                                                </span>
                                              </Checkbox>
                                            </div>
                                          </Tooltip>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span className="block select-none pt-0.5 text-xs text-slate-400">
                                      只读访问，无独立操作按钮
                                    </span>
                                  )}
                                </div>

                                {/* Col 3: Action Button (col-span-2) */}
                                <div className="col-span-2 flex items-center justify-end pt-0.5">
                                  {directButtons.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="xs"                                      onClick={() => handleTogglePageButtons(childMenu.id, directButtons)}
                                      disabled={activeDirectButtons.length === 0}
                                    >
                                      {isAllButtonsSelected ? '取消全部' : '全选操作'} ({selectedCount}/{directButtons.length})
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Single standalone page without sub-menus
                  const isChecked = selectedMenuIdSet.has(moduleMenu.id);
                  const directButtons = buttonsByMenuId.get(moduleMenu.id) || [];
                  const activeDirectButtons = directButtons.filter(
                    (button) => button.status === 1 && isModuleGrantable
                  );
                  const selectedCount = directButtons.filter((b) => selectedButtonIdSet.has(b.id)).length;
                  const isAllButtonsSelected = activeDirectButtons.length > 0 && activeDirectButtons.every((b) => selectedButtonIdSet.has(b.id));

                  return (
                    <div
                      key={moduleMenu.id}
                      className="overflow-hidden rounded-xl border border-line bg-white"
                    >
                      {/* Module Header Bar */}
                      <div className="flex items-center justify-between border-b border-line-soft bg-slate-50/70 px-4 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-line bg-white text-slate-600">
                            <Icon icon={resolveMenuIcon(moduleMenu)} size={14} />
                          </div>
                          <Checkbox
                            checked={isChecked}
                            disabled={!isModuleGrantable && !isChecked}
                            onChange={() => handleToggleMenu(moduleMenu)}
                          >
                            <span className="text-13 font-medium text-slate-900">
                              {moduleMenu.menu_name}
                            </span>
                          </Checkbox>
                          <span className="text-[11px] font-mono text-slate-300 truncate">
                            {moduleMenu.route_path}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="font-normal">
                            独立页面
                          </Badge>
                        </div>
                      </div>

                      {/* Column Header */}
                      <div className="grid grid-cols-12 items-center gap-3 border-b border-line-soft px-4 py-2 text-xs font-medium text-slate-400">
                        <div className="col-span-3">页面导航</div>
                        <div className="col-span-7">操作按钮权限</div>
                        <div className="col-span-2 text-right">快捷操作</div>
                      </div>

                      {/* Row */}
                      <div className="grid grid-cols-12 gap-3 px-4 py-3 items-start hover: transition-colors">
                        <div className="col-span-3 min-w-0 pr-2 pt-0.5">
                          <Checkbox
                            checked={isChecked}
                            disabled={!isModuleGrantable && !isChecked}
                            onChange={() => handleToggleMenu(moduleMenu)}
                          >
                            <span className="text-xs font-medium text-slate-800 truncate block max-w-[150px]" title={moduleMenu.menu_name}>
                              {moduleMenu.menu_name}
                            </span>
                          </Checkbox>
                          <div className="pl-6 text-[11px] font-mono text-slate-300 truncate" title={moduleMenu.route_path}>
                            {moduleMenu.route_path}
                          </div>
                        </div>

                        <div className="col-span-7 min-w-0 pt-0.5">
                          {directButtons.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5">
                              {directButtons.map((btn) => {
                                const isBtnChecked = selectedButtonIdSet.has(btn.id);
                                return (
                                  <Tooltip
                                    key={btn.id}
                                    title={<span className="font-mono text-xs">权限码: {btn.permission_code}</span>}
                                  >
                                    <div className="flex items-center min-w-0">
                                      <Checkbox
                                        checked={isBtnChecked}
                                        disabled={(btn.status !== 1 || !isModuleGrantable) && !isBtnChecked}
                                        onChange={() => handleToggleButton(btn)}
                                      >
                                        <span className="text-xs text-slate-600 truncate block select-none" title={btn.button_name}>
                                          {btn.button_name}
                                        </span>
                                      </Checkbox>
                                    </div>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="block select-none pt-0.5 text-xs text-slate-400">
                              只读访问，无独立操作按钮
                            </span>
                          )}
                        </div>

                        <div className="col-span-2 flex items-center justify-end pt-0.5">
                          {directButtons.length > 0 && (
                            <Button
                              variant="ghost"
                              size="xs"                              onClick={() => handleTogglePageButtons(moduleMenu.id, directButtons)}
                              disabled={activeDirectButtons.length === 0}
                            >
                              {isAllButtonsSelected ? '取消全部' : '全选操作'} ({selectedCount}/{directButtons.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
};
