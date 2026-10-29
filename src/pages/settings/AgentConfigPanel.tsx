import { t, useT } from '@/i18n';
import { useCan } from '@/hooks/usePermission';
import { useDataChanged } from '@/hooks/useDataChanged';
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
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { SectionBar } from '@/ui/tabs';
import { RowAction } from '@/ui/row-action';
import dayjs from 'dayjs';

export const AgentConfigPanel: React.FC<{ active: boolean }> = ({ active }) => {
  const { locale } = useT();
  const requestSequence = useRef(0);
  const initialLoadSettled = useRef(false);
  const can = useCan();
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingStatusIds, setChangingStatusIds] = useState<Set<string | number>>(new Set());
  const [form] = Form.useForm();

  const canAdd = can('agent-config:update');
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
        message.error((error as Error).message || t('agentConfig.errors.load'));
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
  useDataChanged((reason) => {
    if (reason === 'locale' && active) void loadConfigs();
  });

  const openCreate = () => {
    setEditingConfig(null);
    form.resetFields();
    form.setFieldsValue({ provider: t('agentConfig.providers.openai'), base_url: 'https://api.example.com/v1' });
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
        message.success(t('common.toast.updated'));
      } else {
        await agentConfigService.addConfig(values);
        message.success(t('common.toast.created'));
      }
      setModalOpen(false);
      void loadConfigs();
    } catch (error: any) {
      if (error?.errorFields) return; // Validation failed
      message.error((error as Error).message || t('common.toast.saveFailed'));
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
      message.success(checked ? t('common.status.enabled') : t('common.status.disabled'));
    } catch (error) {
      message.error((error as Error).message || t('common.toast.actionFailed'));
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
        title: t('agentConfig.columns.model'),
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
        title: t('agentConfig.fields.provider'),
        dataIndex: 'provider',
        width: '28%',
        render: (_, record) => <div className="min-w-0"><p className="text-13 text-slate-700">{record.provider}</p><p className="truncate font-mono text-[11px] text-slate-400" title={record.base_url}>{record.base_url}</p><p className="mt-1 font-mono text-[11px] text-slate-400">{record.api_key_masked}</p></div>,
      },
      {
        title: t('common.columns.updated'),
        dataIndex: 'last_update_date',
        width: '20%',
        render: (date: string) => (
          <span className="whitespace-nowrap font-mono text-xs text-slate-500">
            {date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '—'}
          </span>
        ),
      },
      {
        title: t('common.columns.status'),
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
            aria-label={record.status === 1 ? t('agentConfig.actions.disable') : t('agentConfig.actions.enable')}
          />
        ),
      },
      {
        title: t('common.columns.actions'),
        key: 'actions',
        width: 100,
        align: 'center',
        render: (_, record) => (
          <div className="flex items-center justify-center"><RowAction
            icon="pencil"
            label={t('agentConfig.actions.edit')}
            disabled={!canUpdate}
            disabledReason={t('agentConfig.access.editDenied')}
            onClick={() => openEdit(record)}
          /><RowAction icon="trash-2" label={t('agentConfig.actions.delete')} disabled={!canUpdate} onClick={() => Modal.confirm({ title: t('agentConfig.deleteDialog.title'), content: t('agentConfig.deleteDialog.content', { name: record.model_name }), okText: t('common.actions.delete'), onOk: async () => { await agentConfigService.deleteConfig(record.id); await loadConfigs(); } })} /></div>
        ),
      },
    ],
    [canUpdate, changingStatusIds, locale]
  );

  return (
    <>
      <SectionBar
        description={t('agentConfig.description')}
        actions={
          <Tooltip title={canAdd ? undefined : t('agentConfig.access.createDenied')}>
            <Button disabled={!canAdd} onClick={openCreate}>
              <Icon icon="plus" size={16} />
              {t('agentConfig.actions.create')}</Button>
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
                  title={t('agentConfig.empty.title')}
                  description={t('agentConfig.empty.description')}
                  action={canAdd ? <Button onClick={openCreate}>{t('agentConfig.actions.create')}</Button> : undefined}
                />
              ),
            }}
          />
        </CardContent>
      </Card>
      <Modal
        title={editingConfig ? t('agentConfig.form.editTitle') : t('agentConfig.form.createTitle')}
        icon="wand-sparkles"
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editingConfig ? t('common.actions.save') : t('common.actions.create')}
        width={460}
      >
        <Form form={form}>
          <Form.Item name="provider" label={t('agentConfig.fields.provider')} rules={[{ required: true, message: t('agentConfig.validation.providerRequired') }]}><Select options={[{ value: t('agentConfig.providers.openai'), label: t('agentConfig.providers.openai') }, { value: t('agentConfig.providers.local'), label: t('agentConfig.providers.local') }, { value: t('agentConfig.providers.other'), label: t('agentConfig.providers.other') }]} /></Form.Item>
          <Form.Item name="base_url" label="Base URL" rules={[{ required: true, message: t('agentConfig.validation.urlRequired') }]} extra={t('agentConfig.hints.url')}><Input className="font-mono" placeholder="https://api.example.com/v1" /></Form.Item>
          <Form.Item
            name="model_code"
            label={t('agentConfig.fields.modelCode')}
            rules={[
              { required: true, message: t('agentConfig.validation.codeRequired') },
              { max: 150, message: t('agentConfig.validation.codeLength') },
            ]}
          >
            <ModelCodeCombobox options={['pilot-demo', 'local-demo']} loading={false} maxLength={150} />
          </Form.Item>

          <Form.Item
            name="model_name"
            label={t('agentConfig.fields.modelName')}
            rules={[
              { required: true, message: t('agentConfig.validation.nameRequired') },
              { max: 150, message: t('agentConfig.validation.nameLength') },
            ]}
          >
            <Input placeholder={t('agentConfig.placeholders.name')} maxLength={150} />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key" className="mb-0" extra={editingConfig ? t('agentConfig.hints.keepKey') : t('agentConfig.hints.demoKey')}><Input.Password autoComplete="new-password" placeholder={editingConfig?.api_key_masked || t('agentConfig.placeholders.apiKey')} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};
