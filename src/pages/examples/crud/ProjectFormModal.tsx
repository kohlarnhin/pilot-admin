import { useRef, useState } from 'react';
import { t, useT } from '@/i18n';
import { ApiRequestError } from '@/api/http';
import { exampleProjectService, PROJECT_CODE_EXISTS, type ProjectInput } from '@/api/services/exampleProjectService';
import type { ExampleProject } from '@/types';
import { Form } from '@/ui/form';
import { Input, TextArea } from '@/ui/input';
import { Select } from '@/ui/select';
import { Modal } from '@/ui/modal';
import { message } from '@/ui/message';

export function ProjectFormModal({ project, onClose, onSaved }: {
  project: ExampleProject | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  useT();
  const [form] = Form.useForm<ProjectInput>();
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);
  const submit = async () => {
    if (submitLock.current) return;
    submitLock.current = true;
    try {
      // 模板：先校验再进入保存态，禁用的输入框无法接收校验失败的焦点。
      const values = await form.validateFields();
      setSaving(true);
      if (project) await exampleProjectService.updateProject(project.id, values);
      else await exampleProjectService.createProject(values);
      message.success(t(project ? 'common.toast.updated' : 'common.toast.created'));
      onSaved();
      onClose();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      // 模板：用稳定业务码关联字段，失败时保留已填内容。
      if (error instanceof ApiRequestError && error.code === PROJECT_CODE_EXISTS) {
        form.setFields([{ name: 'code', errors: [error.message] }]);
      } else message.error((error as Error).message || t('common.toast.saveFailed'));
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  };

  return <Modal open title={t(project ? 'button.exampleUpdate' : 'button.exampleCreate')} icon="package" width={520}
    onOk={submit} onCancel={saving ? undefined : onClose} confirmLoading={saving}
    okText={t(project ? 'common.actions.save' : 'common.actions.create')}>
    <Form form={form} initialValues={project || { status: 'active', description: '' }} onFinish={() => void submit()}>
      <Form.Item name="name" label={t('exampleProjects.fields.name')} rules={[{ required: true, whitespace: true, max: 60, message: t('serverErrors.example.invalidName') }]}>
        <Input maxLength={60} placeholder={t('exampleProjects.form.nameHint')} disabled={saving} />
      </Form.Item>
      <Form.Item name="code" label={t('exampleProjects.fields.code')} extra={t('exampleProjects.form.codeHint')}
        rules={[{ required: true, pattern: /^[A-Z][A-Z0-9-]{1,19}$/, message: t('serverErrors.example.invalidCode') }]}>
        <Input maxLength={20} className="font-mono" disabled={saving} />
      </Form.Item>
      <div className="grid grid-cols-2 gap-x-4">
        <Form.Item name="owner" label={t('exampleProjects.fields.owner')} rules={[{ required: true, whitespace: true, max: 40, message: t('serverErrors.example.invalidOwner') }]}>
          <Input maxLength={40} disabled={saving} />
        </Form.Item>
        <Form.Item name="status" label={t('common.columns.status')} rules={[{ required: true, enum: ['active', 'paused', 'archived'], message: t('serverErrors.example.invalidStatus') }]}>
          <Select disabled={saving} options={(['active', 'paused', 'archived'] as const).map((value) => ({ value, label: t(`exampleProjects.status.${value}`) }))} />
        </Form.Item>
      </div>
      <Form.Item name="description" label={t('exampleProjects.fields.description')} rules={[{ max: 200, message: t('serverErrors.example.invalidDescription') }]}>
        <TextArea rows={3} maxLength={200} showCount disabled={saving} />
      </Form.Item>
    </Form>
  </Modal>;
}
