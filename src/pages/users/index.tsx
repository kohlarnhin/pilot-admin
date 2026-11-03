import { t, useT } from '@/i18n';
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
  const { locale } = useT();
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
  const searchInput = useRef<HTMLInputElement>(null);
  const [changingStatusIds, setChangingStatusIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState<number>();

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
      const errorMessage = (error as Error).message || t('users.errors.loadUsers');
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
      const errorMessage = (error as Error).message || t('users.errors.loadRoles');
      setLoadError((current) => current ? t('users.errors.combined', { current, error: errorMessage }) : errorMessage);
      message.error(errorMessage);
    }
  }, []);

  const loadCount = useCallback(async () => {
    const request = ++countRequest.current;
    try {
      const count = await userService.countUsers({ keyword: queryKeyword || undefined });
      if (request === countRequest.current) setTotal(count);
    } catch (error) {
      message.error((error as Error).message || t('users.errors.loadCount'));
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

  const handleOpenEditModal = useCallback((user: User) => {
    setEditingUser(user);
    form.resetFields();
    form.setFieldsValue({
      login_name: user.login_name,
      user_name: user.user_name,
      email: user.email,
      // 角色元数据可能仍在加载；编辑必须保留记录本身的授权 ID。
      role_ids: user.role_ids,
    });
    setIsModalOpen(true);
  }, [form]);

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
        message.success(t('users.toast.updated'));
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
          title: t('users.toast.created'),
          width: 440,
          content: (
            <div>
              <div className="mt-1 divide-y divide-line-soft rounded-lg border border-line bg-slate-50/70">
                {[
                  { label: t('common.fields.account'), value: values.login_name, secret: false },
                  { label: t('common.fields.password'), value: created.data.initial_password, secret: true },
                ].map(({ label, value, secret }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2">
                    <span className={`${locale === 'en-US' ? 'w-16' : 'w-8'} shrink-0 text-xs text-slate-500`}>{label}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-13 text-slate-800">{value}</span>
                    <CopyButton text={value} tip={t('users.createdAccount.copyLabel', { name: label })} secret={secret} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">{t('users.createdAccount.notice')}</p>
            </div>
          ),
        });
      }
      refreshUsers();
    } catch (err: any) {
      if (err?.errorFields) return; // Validation failed
      message.error(err.message || t('common.toast.saveFailed'));
    }
  };

  const handleToggleStatus = useCallback(async (user: User, checked: boolean) => {
    if (changingStatusIds.has(user.id)) return;
    const isSelf = Boolean(
      currentUser && (user.id === currentUser.id || user.login_name === currentUser.login_name)
    );
    if (isSelf && !checked) {
      message.warning(t('serverErrors.user.selfDisable'));
      return;
    }

    const newStatus = checked ? 1 : 0;
    setChangingStatusIds((current) => new Set(current).add(user.id));
    // 乐观局部状态更新，避免全表重新加载和闪烁
    setRawUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));

    try {
      await userService.updateStatus(user.id, newStatus);
      if (checked) {
        message.success(t('users.toast.enabled', { name: user.user_name }));
      } else {
        message.warning(t('users.toast.disabled', { name: user.user_name }));
      }
    } catch (err: any) {
      // 失败时回滚
      setRawUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u)));
      message.error(err.message || t('common.toast.actionFailed'));
    } finally {
      setChangingStatusIds((current) => { const next = new Set(current); next.delete(user.id); return next; });
    }
  }, [changingStatusIds, currentUser, setRawUsers]);

  const isSelfUser = useCallback((record: User) => Boolean(
    currentUser && (record.id === currentUser.id || record.login_name === currentUser.login_name)
  ), [currentUser]);

  const handleDelete = useCallback((user: User) => {
    Modal.confirm({
      title: t('button.userDelete'), content: t('users.deleteDialog.content', { name: user.user_name }), okText: t('common.actions.confirmDelete'), okType: 'danger',
      onOk: async () => {
        await userService.deleteUser(user.id);
        message.success(t('users.toast.deleted')); refreshUsers();
      },
    });
  }, [refreshUsers]);

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const values = await passwordForm.validateFields();
      await userService.resetPassword(resetTarget.id, values.password);
      setResetTarget(null); message.success(t('users.toast.passwordReset'));
    } catch (error: any) {
      if (!error?.errorFields) message.error(error.message || t('users.errors.resetPassword'));
    }
  };

  const columns = useMemo<ColumnsType<User>>(() => [
    {
      title: t('users.columns.user'),
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
              <AvatarFallback>{name ? name.slice(0, 1) : t('users.avatarFallback')}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-13 font-medium text-slate-900" title={name}>{name}</span>
            <div className="group flex min-w-0 items-center gap-1">
              <span className="truncate font-mono text-[11px] text-slate-500" title={`@${record.login_name} · ${record.id}`}>@{record.login_name} · {record.id}</span>
              <CopyButton text={record.id} tip={t('users.columns.copyId')} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t('common.fields.role'),
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
          <span className="text-xs text-slate-500">{t('users.columns.noRole')}</span>
        ),
    },
    {
      title: t('users.fields.workEmail'),
      dataIndex: 'email',
      key: 'email',
      width: '24%',
      render: (email: string) => (
        <span className="block truncate text-13 text-slate-600" title={email || undefined}>
          {email || <span className="text-slate-500">—</span>}
        </span>
      ),
    },
    {
      title: t('common.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 72,
      align: 'center',
      render: (status: number, record) => (
        <Tooltip title={isSelfUser(record) ? t('serverErrors.user.selfDisable') : undefined}>
          <Switch
            size="small"
            checked={status === 1}
            loading={changingStatusIds.has(record.id)}
            disabled={!canEdit || isSelfUser(record)}
            onChange={(checked) => handleToggleStatus(record, checked)}
            aria-label={status === 1 ? t('users.actions.disable') : t('users.actions.enable')}
          />
        </Tooltip>
      ),
    },
    {
      title: t('common.columns.created'),
      dataIndex: 'create_date',
      key: 'create_date',
      width: 156,
      render: (date: string) => (
        <span className="whitespace-nowrap font-mono text-xs text-slate-500">
          {dayjs(date).locale(locale === 'zh-CN' ? 'zh-cn' : 'en').format('YYYY-MM-DD HH:mm')}
        </span>
      ),
    },
    {
      title: t('common.columns.actions'),
      key: 'action',
      width: 144,
      align: 'center',
      render: (_, record) => (
        <RowActions>
          {canEdit && <RowAction size="sm" icon="pencil" label={t('button.userUpdate')} onClick={() => handleOpenEditModal(record)} />}
          {canResetPassword && <RowAction size="sm" icon="key-round" label={t('button.userResetPassword')} onClick={() => { passwordForm.resetFields(); setResetTarget(record); }} />}
          {canDelete && <RowAction size="sm" icon="trash-2" label={t('button.userDelete')} tone="danger" disabled={isSelfUser(record)} disabledReason={t('serverErrors.user.selfDelete')} onClick={() => handleDelete(record)} />}
        </RowActions>
      ),
    },
  ], [locale, canEdit, canResetPassword, canDelete, changingStatusIds, isSelfUser, handleToggleStatus, handleOpenEditModal, handleDelete, passwordForm]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {loadError && (
        <Alert type="error" title={t('users.errors.load', { error: loadError })} description={<Button size="xs" onClick={() => { setLoadError(null); void retry(); }}>{t('common.actions.retry')}</Button>} className="mb-4 shrink-0" />
      )}

      <PageHeader
        title={t('menu.users')}
        description={t('users.description')}
        actions={canCreate ?
          <Button onClick={handleOpenAddModal}>
            <Icon icon="user-plus" size={16} />
            {t('button.userCreate')}</Button> : undefined
        }
      />
      <Card className="min-h-0 flex-1">
        <ListToolbar extra={<span>{t('users.total', { count: total ?? 0 })}</span>}>
          <SearchInput ref={searchInput} className="w-72"
            placeholder={t('users.searchPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
        </ListToolbar>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <FixedTable
            columns={columns}
            dataSource={users}
            totalCount={total}
            rowKey="id"
            loading={loading}
            refreshing={refreshing}
            loadingMore={loadingMore}
            hasNext={hasNext}
            onLoadMore={loadMore}
            locale={{
              emptyText: (
                <EmptyState
                  title={loadError ? t('common.errors.loadData') : queryKeyword ? t('search.noUsers') : t('users.empty.noUsers')}
                  description={loadError ? t('users.empty.retryHint') : queryKeyword ? t('users.empty.searchHint') : t('users.empty.createHint')}
                  icon="users-round"
                />
              ),
            }}
          />
        </CardContent>
      </Card>

      <Modal
        returnFocusRef={searchInput}
        title={editingUser ? t('button.userUpdate') : t('button.userCreate')}
        icon="user"
        description={editingUser ? `@${editingUser.login_name}` : t('users.createDialog.description')}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? t('common.actions.save') : t('common.actions.create')}
        width={520}
      >
        <Form form={form}>
          <Form.Item
            name="login_name"
            label={t('users.fields.loginName')}
            rules={[
              { required: true, message: t('users.validation.loginRequired') },
              { pattern: /^[a-zA-Z0-9_]+$/, message: t('common.validation.accountFormat') },
            ]}
          >
            <Input placeholder={t('users.placeholders.loginName')} disabled={!!editingUser} className="font-mono" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="user_name" label={t('users.fields.displayName')} rules={[{ required: true, message: t('common.validation.nameRequired') }]}>
              <Input placeholder={t('users.placeholders.displayName')} />
            </Form.Item>
            <Form.Item name="email" label={t('users.fields.workEmail')} rules={[{ type: 'email', message: t('common.validation.emailInvalid') }]}>
              <Input placeholder="name@company.com" />
            </Form.Item>
          </div>

          {(!editingUser || canResetPassword) && <Form.Item
            name="password_hash"
            label={editingUser ? t('button.userResetPassword') : t('users.fields.initialPassword')}
            extra={editingUser ? t('users.hints.keepPassword') : t('users.hints.generatePassword')}
          >
            <Input.Password
              placeholder={editingUser ? t('users.placeholders.keepPassword') : t('users.placeholders.password')}
              autoComplete="new-password"
            />
          </Form.Item>}

          <Form.Item
            name="role_ids"
            label={t('users.fields.roles')}
            className="mb-0"
            rules={[{ required: true, message: t('users.validation.rolesRequired') }]}
          >
            <Select
              mode="multiple"
              placeholder={t('users.placeholders.roles')}
              options={roles.filter((r) => r.status === 1).map((r) => ({ label: `${r.role_name} · ${r.role_code}`, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal returnFocusRef={searchInput} title={t('button.userResetPassword')} icon="key-round" description={resetTarget ? t('users.resetDialog.description', { account: resetTarget.login_name }) : undefined}
        open={Boolean(resetTarget)} onCancel={() => setResetTarget(null)} onOk={handleResetPassword} okText={t('common.actions.confirmReset')} width={420}>
        <Form form={passwordForm}>
          <Form.Item name="password" label={t('common.fields.newPassword')} rules={[{ required: true, message: t('common.validation.passwordRequired') }]} className="mb-0">
            <Input.Password autoComplete="new-password" placeholder={t('common.validation.passwordRequired')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
