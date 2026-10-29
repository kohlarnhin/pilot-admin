import { useCan } from '@/hooks/usePermission';
import { useDataChanged } from '@/hooks/useDataChanged';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../../components/common/EmptyState';
import { CopyButton } from '../../components/common/CopyButton';
import { FixedTable } from '../../components/common/FixedTable';
import { userService, roleService } from '../../api/services/userService';
import { useInfinitePage } from '../../hooks/useInfinitePage';
import { User, Role } from '../../types';
import { Card, CardContent, ListToolbar } from '@/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/store/authStore';
import { Input, SearchInput } from '@/ui/input';
import { RowAction, RowActions } from '@/ui/row-action';
import { Modal } from '@/ui/modal';
import { Form } from '@/ui/form';
import { Select } from '@/ui/select';
import { Alert, Switch } from '@/ui/controls';
import { Tooltip } from '@/ui/tooltip';
import { message } from '@/ui/message';
import type { ColumnsType } from '@/ui/data-table';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router';

export const UsersPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const can = useCan();
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const canCreate = can('user:create');
  const canEdit = can('user:update');
  const canDelete = can('user:delete');
  const canResetPassword = can('user:reset-password');
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [passwordForm] = Form.useForm();
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchParams] = useSearchParams();
  const routeKeyword = searchParams.get('keyword') || '';
  const [keyword, setKeyword] = useState<string>(routeKeyword);
  const [queryKeyword, setQueryKeyword] = useState<string>(routeKeyword);
  useEffect(() => { setKeyword(routeKeyword); setQueryKeyword(routeKeyword); }, [routeKeyword]);
  // 输入即搜：停止输入 350ms 后自动查询，回车立即查询
  useEffect(() => {
    const timer = window.setTimeout(() => setQueryKeyword(keyword.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [keyword]);
  const countRequest = useRef(0);
  const [changingStatusIds, setChangingStatusIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState<number>(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  // 页面内联错误（便于直接看到加载失败原因）
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (pageNo: number, pageSize: number) => {
    const response = await userService.getUsers({
      pageNo,
      pageSize,
      keyword: queryKeyword || undefined,
    });
    return response.data;
  }, [queryKeyword]);

  const {
    records: rawUsers,
    setRecords: setRawUsers,
    hasNext,
    loading,
    refreshing,
    loadingMore,
    loadMore,
    reload,
    retry,
  } = useInfinitePage({
    fetchPage: fetchUsers,
    scopeKey: queryKeyword,
    getKey: (user: User) => user.id,
    onError: (error) => {
      const errorMessage = (error as Error).message || '加载用户失败';
      setLoadError(errorMessage);
      message.error(errorMessage);
    },
  });

  const users = useMemo(() => {
    const roleMap = new Map(roles.map((role) => [role.id, role]));
    return rawUsers.map((user) => ({
      ...user,
      roles: (user.role_ids || []).map((roleId) => roleMap.get(roleId)).filter(Boolean) as Role[],
    }));
  }, [rawUsers, roles]);

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await roleService.getAllRoles());
    } catch (error) {
      const errorMessage = (error as Error).message || '加载角色失败';
      setLoadError((current) => current ? `${current}；${errorMessage}` : errorMessage);
      message.error(errorMessage);
    }
  }, []);

  const loadCount = useCallback(async () => {
    const request = ++countRequest.current;
    try {
      const count = await userService.countUsers({ keyword: queryKeyword || undefined });
      if (request === countRequest.current) setTotal(count);
    } catch (error) {
      message.error((error as Error).message || '加载用户总数失败');
    }
  }, [queryKeyword]);

  useEffect(() => {
    void Promise.all([loadRoles(), loadCount()]);
  }, [loadCount, loadRoles]);

  const refreshUsers = useCallback(() => {
    setLoadError(null);
    reload();
    void loadCount();
  }, [reload, loadCount]);

  const handleSearch = () => {
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword === queryKeyword) {
      refreshUsers();
      return;
    }
    setQueryKeyword(normalizedKeyword);
  };

  useDataChanged(refreshUsers);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    form.resetFields();
    form.setFieldsValue({
      login_name: user.login_name,
      user_name: user.user_name,
      email: user.email,
      role_ids: user.roles?.map(r => r.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await userService.updateUser(editingUser.id, {
          login_name: values.login_name,
          user_name: values.user_name,
          email: values.email,
          role_ids: values.role_ids,
          password: canResetPassword ? values.password_hash || undefined : undefined,
        });
        if (editingUser.id === currentUser?.id) await refreshMe();
        message.success('用户信息更新成功');
        setIsModalOpen(false);
      } else {
        const created = await userService.createUser({
          login_name: values.login_name,
          user_name: values.user_name,
          email: values.email,
          password_hash: values.password_hash || undefined,
          role_ids: values.role_ids || [],
        });
        setIsModalOpen(false);
        Modal.success({
          title: '新增用户成功',
          width: 440,
          content: (
            <div>
              <div className="mt-1 divide-y divide-line-soft rounded-lg border border-line bg-slate-50/70">
                {[
                  { label: '账号', value: values.login_name, secret: false },
                  { label: '密码', value: created.data.initial_password, secret: true },
                ].map(({ label, value, secret }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2">
                    <span className="w-8 shrink-0 text-xs text-slate-400">{label}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-13 text-slate-800">{value}</span>
                    <CopyButton text={value} tip={`复制${label}`} secret={secret} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">请妥善保存，关闭后将不再显示密码。</p>
            </div>
          ),
        });
      }
      refreshUsers();
    } catch (err: any) {
      if (err?.errorFields) return; // Validation failed
      message.error(err.message || '保存失败');
    }
  };

  const handleToggleStatus = async (user: User, checked: boolean) => {
    if (changingStatusIds.has(user.id)) return;
    const isSelf = Boolean(
      currentUser && (user.id === currentUser.id || user.login_name === currentUser.login_name)
    );
    if (isSelf && !checked) {
      message.warning('不可禁用当前登录账号');
      return;
    }

    const newStatus = checked ? 1 : 0;
    setChangingStatusIds((current) => new Set(current).add(user.id));
    // 乐观局部状态更新，避免全表重新加载和闪烁
    setRawUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));

    try {
      await userService.updateStatus(user.id, newStatus);
      if (checked) {
        message.success(`用户【${user.user_name}】已启用`);
      } else {
        message.warning(`用户【${user.user_name}】已禁用`);
      }
    } catch (err: any) {
      // 失败时回滚
      setRawUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u)));
      message.error(err.message || '操作失败');
    } finally {
      setChangingStatusIds((current) => { const next = new Set(current); next.delete(user.id); return next; });
    }
  };

  const isSelfUser = (record: User) => Boolean(
    currentUser && (record.id === currentUser.id || record.login_name === currentUser.login_name)
  );

  const handleDelete = (user: User) => {
    Modal.confirm({
      title: '删除用户', content: `确定删除用户「${user.user_name}」吗？删除后该账号无法再登录。`, okText: '确认删除', okType: 'danger',
      onOk: async () => {
        await userService.deleteUser(user.id);
        message.success('用户已删除'); refreshUsers();
      },
    });
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const values = await passwordForm.validateFields();
      await userService.resetPassword(resetTarget.id, values.password);
      setResetTarget(null); message.success('密码已重置');
    } catch (error: any) {
      if (!error?.errorFields) message.error(error.message || '重置失败');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: '26%',
      minWidth: 170,
      render: (name: string, record) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-8">
            {record.avatar ? (
              <img alt="" src={record.avatar} className="size-full object-cover" />
            ) : (
              <AvatarFallback>{name ? name.slice(0, 1) : '用'}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-13 font-medium text-slate-900" title={name}>{name}</span>
            <div className="group flex min-w-0 items-center gap-1">
              <span className="truncate font-mono text-[11px] text-slate-500" title={`@${record.login_name} · ${record.id}`}>@{record.login_name} · {record.id}</span>
              <CopyButton text={record.id} tip="复制用户 ID" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '角色',
      key: 'roles',
      width: '22%',
      render: (_, record) =>
        record.roles && record.roles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {record.roles.map((role) => (
              <Badge key={role.id} variant="default">{role.role_name}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-400">未分配角色</span>
        ),
    },
    {
      title: '工作邮箱',
      dataIndex: 'email',
      key: 'email',
      width: '24%',
      render: (email: string) => (
        <span className="block truncate text-13 text-slate-600" title={email || undefined}>
          {email || <span className="text-slate-300">—</span>}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 72,
      align: 'center',
      render: (status: number, record) => (
        <Tooltip title={isSelfUser(record) ? '不可禁用当前登录账号' : undefined}>
          <Switch
            size="small"
            checked={status === 1}
            loading={changingStatusIds.has(record.id)}
            disabled={!canEdit || isSelfUser(record)}
            onChange={(checked) => handleToggleStatus(record, checked)}
            aria-label={status === 1 ? '禁用用户' : '启用用户'}
          />
        </Tooltip>
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
          {canEdit && <RowAction size="sm" icon="pencil" label="编辑用户" onClick={() => handleOpenEditModal(record)} />}
          {canResetPassword && <RowAction size="sm" icon="key-round" label="重置密码" onClick={() => { passwordForm.resetFields(); setResetTarget(record); }} />}
          {canDelete && <RowAction size="sm" icon="trash-2" label="删除用户" tone="danger" disabled={isSelfUser(record)} disabledReason="不可删除当前登录账号" onClick={() => handleDelete(record)} />}
        </RowActions>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {loadError && (
        <Alert type="error" title={`加载失败：${loadError}`} description={<Button size="xs" onClick={() => { setLoadError(null); void retry(); }}>重试</Button>} className="mb-4 shrink-0" />
      )}

      <PageHeader
        title="用户管理"
        description="维护平台用户账号，并为其分配 RBAC 角色权限"
        actions={canCreate ?
          <Button onClick={handleOpenAddModal}>
            <Icon icon="user-plus" size={16} />
            新增用户
          </Button> : undefined
        }
      />
      <Card className="min-h-0 flex-1">
        <ListToolbar extra={<span>共 {total} 名用户</span>}>
          <SearchInput className="w-72"
            placeholder="搜索账号或姓名"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
        </ListToolbar>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <FixedTable
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            refreshing={refreshing}
            loadingMore={loadingMore}
            hasNext={hasNext}
            onLoadMore={loadMore}
            locale={{
              emptyText: (
                <EmptyState
                  title={loadError ? '数据加载失败' : queryKeyword ? '没有匹配的用户' : '暂无系统用户'}
                  description={loadError ? '请点击上方重试，重新加载用户数据' : queryKeyword ? '换个关键词试试' : '点击右上角「新增用户」，创建新的登录账号'}
                  icon="users-round"
                />
              ),
            }}
          />
        </CardContent>
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        icon="user"
        description={editingUser ? `@${editingUser.login_name}` : '创建平台登录账号并分配角色'}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? '保存' : '创建'}
        width={520}
      >
        <Form form={form}>
          <Form.Item
            name="login_name"
            label="登录账号"
            rules={[
              { required: true, message: '请输入登录账号' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字和下划线' },
            ]}
          >
            <Input placeholder="例如：dev_zhang" disabled={!!editingUser} className="font-mono" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="user_name" label="用户姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="例如：张工" />
            </Form.Item>
            <Form.Item name="email" label="工作邮箱" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input placeholder="name@company.com" />
            </Form.Item>
          </div>

          {(!editingUser || canResetPassword) && <Form.Item
            name="password_hash"
            label={editingUser ? '重置密码' : '初始密码'}
            extra={editingUser ? '无需重置请留空' : '留空将由系统自动生成随机密码'}
          >
            <Input.Password
              placeholder={editingUser ? '输入新密码，留空则不修改' : '留空自动生成'}
              autoComplete="new-password"
            />
          </Form.Item>}

          <Form.Item
            name="role_ids"
            label="分配角色"
            className="mb-0"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roles.filter((r) => r.status === 1).map((r) => ({ label: `${r.role_name} · ${r.role_code}`, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="重置密码" icon="key-round" description={resetTarget ? `为 @${resetTarget.login_name} 设置新密码` : undefined}
        open={Boolean(resetTarget)} onCancel={() => setResetTarget(null)} onOk={handleResetPassword} okText="确认重置" width={420}>
        <Form form={passwordForm}>
          <Form.Item name="password" label="新密码" rules={[{ required: true, message: '请输入新密码' }]} className="mb-0">
            <Input.Password autoComplete="new-password" placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
