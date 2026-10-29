import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/ui/modal';
import { Switch } from '@/ui/controls';
import { Tooltip } from '@/ui/tooltip';
import { message } from '@/ui/message';
import { Form } from '@/ui/form';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import type { ColumnsType } from '@/ui/data-table';
import { agentConfigService } from '@/api/services/agentConfigService';
import { ModelCodeCombobox } from './ModelCodeCombobox';
import type { AgentConfig } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { FixedTable } from '@/components/common/FixedTable';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { SectionBar } from '@/ui/tabs';
import { RowAction } from '@/ui/row-action';
import dayjs from 'dayjs';

export const AgentConfigPanel: React.FC<{ active: boolean }> = ({ active }) => {
  const requestSequence = useRef(0);
  const initialLoadSettled = useRef(false);
  const permissions = useAuthStore((state) => state.permissions);
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingStatusIds, setChangingStatusIds] = useState<Set<string | number>>(new Set());
  const [form] = Form.useForm();

  const canAdd = permissions.includes('agent-config:update');
  const canUpdate = canAdd;

  const loadConfigs = useCallback(async () => {
    const sequence = ++requestSequence.current;
    const initial = !initialLoadSettled.current;
    if (!initial) setRefreshing(true);
    try {
      const res = await agentConfigService.getConfigs();
      if (sequence !== requestSequence.current) return;
      setConfigs(res);
    } catch (error) {
      if (sequence === requestSequence.current && initial) {
        message.error((error as Error).message || '加载AI助手配置失败');
      }
    } finally {
      if (sequence === requestSequence.current) {
        initialLoadSettled.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => () => { requestSequence.current += 1; }, []);

  useEffect(() => {
    if (active) void loadConfigs();
  }, [active, loadConfigs]);

  const openCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    form.setFieldsValue({ provider: 'OpenAI 兼容', base_url: 'https://api.example.com/v1' });
    setModalOpen(true);
  };
  const openEdit = (config: AgentConfig) => {
    setEditingConfig(config);
    form.resetFields();
    form.setFieldsValue({ provider: config.provider, base_url: config.base_url, model_code: config.model_code, model_name: config.model_name });
    setModalOpen(true);
  };
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingConfig) {
        await agentConfigService.updateConfig(editingConfig.id, values);
        message.success('更新成功');
      } else {
        await agentConfigService.addConfig(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      void loadConfigs();
    } catch (error: any) {
      if (error?.errorFields) return; // Validation failed
      message.error((error as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (config: AgentConfig, checked: boolean) => {
    setChangingStatusIds((current) => new Set(current).add(config.id));
    try {
      await agentConfigService.updateConfigStatus(config.id, checked ? 1 : 0);
      setConfigs((current) =>
        current.map((item) => (item.id === config.id ? { ...item, status: checked ? 1 : 0 } : item))
      );
      message.success(checked ? '已启用' : '已停用');
    } catch (error) {
      message.error((error as Error).message || '操作失败');
    } finally {
      setChangingStatusIds((current) => {
        const next = new Set(current);
        next.delete(config.id);
        return next;
      });
    }
  };

  const columns = useMemo<ColumnsType<AgentConfig>>(
    () => [
      {
        title: '模型',
        dataIndex: 'model_name',
        width: '28%',
        render: (_, record) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-slate-50 text-slate-500">
              <Icon icon="wand-sparkles" size={17} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-13 font-medium text-slate-900">{record.model_name}</div>
              <div className="truncate font-mono text-xs text-slate-400">{record.model_code}</div>
            </div>
          </div>
        ),
      },
      {
        title: '提供方',
        dataIndex: 'provider',
        width: '28%',
        render: (_, record) => <div className="min-w-0"><p className="text-13 text-slate-700">{record.provider}</p><p className="truncate font-mono text-[11px] text-slate-400" title={record.base_url}>{record.base_url}</p><p className="mt-1 font-mono text-[11px] text-slate-400">{record.api_key_masked}</p></div>,
      },
      {
        title: '最后更新',
        dataIndex: 'last_update_date',
        width: '20%',
        render: (date: string) => (
          <span className="whitespace-nowrap font-mono text-xs text-slate-500">
            {date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '—'}
          </span>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 88,
        align: 'center',
        render: (_, record) => (
          <Switch
            size="small"
            checked={record.status === 1}
            loading={changingStatusIds.has(record.id)}
            disabled={!canUpdate || changingStatusIds.has(record.id)}
            onChange={(checked) => void handleStatusChange(record, checked)}
            aria-label={record.status === 1 ? '停用配置' : '启用配置'}
          />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        align: 'center',
        render: (_, record) => (
          <div className="flex items-center justify-center"><RowAction
            icon="pencil"
            label="编辑配置"
            disabled={!canUpdate}
            disabledReason="无修改权限"
            onClick={() => openEdit(record)}
          /><RowAction icon="trash-2" label="删除配置" disabled={!canUpdate} onClick={() => Modal.confirm({ title: '删除模型配置？', content: `即将删除 ${record.model_name}`, okText: '删除', onOk: async () => { await agentConfigService.deleteConfig(record.id); await loadConfigs(); } })} /></div>
        ),
      },
    ],
    [canUpdate, changingStatusIds]
  );

  return (
    <>
      <SectionBar
        description="本地演示配置 · 不会发起模型调用"
        actions={
          <Tooltip title={canAdd ? undefined : '无新增权限'}>
            <Button disabled={!canAdd} onClick={openCreate}>
              <Icon icon="plus" size={16} />
              新增配置
            </Button>
          </Tooltip>
        }
      />
      <Card className="min-h-0 flex-1">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <FixedTable<AgentConfig>
            rowKey="id"
            columns={columns}
            dataSource={configs}
            loading={loading}
            refreshing={refreshing}
            locale={{
              emptyText: (
                <EmptyState
                  icon="wand-sparkles"
                  title="暂无 AI 助手配置"
                  description="添加一个演示模型配置后即可使用助手"
                  action={canAdd ? <Button onClick={openCreate}>新增配置</Button> : undefined}
                />
              ),
            }}
          />
        </CardContent>
      </Card>
      <Modal
        title={editingConfig ? '编辑 AI 助手配置' : '新增 AI 助手配置'}
        icon="wand-sparkles"
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editingConfig ? '保存' : '创建'}
        width={460}
      >
        <Form form={form}>
          <Form.Item name="provider" label="提供方" rules={[{ required: true, message: '请选择提供方' }]}><Select options={[{ value: 'OpenAI 兼容', label: 'OpenAI 兼容' }, { value: '本地模型', label: '本地模型' }, { value: '其他', label: '其他' }]} /></Form.Item>
          <Form.Item name="base_url" label="Base URL" rules={[{ required: true, message: '请输入 Base URL' }]} extra="仅保存用于展示，不会访问该地址。"><Input className="font-mono" placeholder="https://api.example.com/v1" /></Form.Item>
          <Form.Item
            name="model_code"
            label="模型编号"
            rules={[
              { required: true, message: '请输入模型编号' },
              { max: 150, message: '模型编号最多 150 字符' },
            ]}
          >
            <ModelCodeCombobox options={['pilot-demo', 'local-demo']} loading={false} maxLength={150} />
          </Form.Item>

          <Form.Item
            name="model_name"
            label="模型名称"
            rules={[
              { required: true, message: '请输入模型名称' },
              { max: 150, message: '模型名称最多 150 字符' },
            ]}
          >
            <Input placeholder="例如：演示模型" maxLength={150} />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key" className="mb-0" extra={editingConfig ? '留空保留已有密钥；密钥仅以掩码展示。' : '演示配置无需真实密钥。'}><Input.Password autoComplete="new-password" placeholder={editingConfig?.api_key_masked || '仅本地保存'} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};
