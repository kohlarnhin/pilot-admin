import { useCan } from '@/hooks/usePermission';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { settingsService } from '@/api/services/settingsService';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Icon } from '@/components/icon';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Form } from '@/ui/form';
import { Input } from '@/ui/input';
import { Alert, InputNumber, Switch } from '@/ui/controls';
import { Button } from '@/ui/button';
import { Modal } from '@/ui/modal';
import { Skeleton } from '@/ui/skeleton';
import { message } from '@/ui/message';
import { cn } from '@/utils';
import type { SystemSettings } from '@/types';

const SECTIONS = [
  { key: 'basic', label: '基本设置', description: '站点名称与基本信息', icon: 'settings-2' },
  { key: 'security', label: '安全设置', description: '账号密码与安全策略', icon: 'shield-check' },
  { key: 'notifications', label: '通知设置', description: '管理系统通知偏好', icon: 'bell' },
  { key: 'demo', label: '演示数据', description: '恢复初始演示环境', icon: 'database' },
] as const;

export const SettingsPage: React.FC = () => {
  const can = useCan();
  const canSave = can('settings:update');
  const canReset = can('settings:reset');
  const loadBrand = useAppStore((state) => state.loadBrand);
  const [params, setParams] = useSearchParams();
  const tab = SECTIONS.find((section) => section.key === params.get('tab')) || SECTIONS[0];
  const [draft, setDraft] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    let active = true; setError('');
    settingsService.getSettings().then((result) => {
      if (!active) return;
      setDraft(result.data); form.setFieldsValue(result.data.basic);
    }).catch((cause: Error) => { if (active) setError(cause.message || '加载设置失败'); });
    return () => { active = false; };
  }, [form, attempt]);

  const save = async () => {
    if (!draft || tab.key === 'demo' || saving) return;
    setSaving(true);
    try {
      if (tab.key === 'basic') {
        const values = await form.validateFields();
        await settingsService.updateSettings('basic', { siteName: values.siteName.trim(), description: values.description?.trim() || '' });
        await loadBrand();
      } else if (tab.key === 'security') await settingsService.updateSettings('security', draft.security);
      else await settingsService.updateSettings('notifications', draft.notifications);
      message.success('设置已保存');
    } catch (cause: any) {
      if (!cause?.errorFields) message.error(cause.message || '保存失败');
    } finally { setSaving(false); }
  };

  const reset = () => Modal.confirm({
    title: '重置演示数据', icon: <Icon icon="database" size={18} />,
    content: '用户、角色、菜单名称、系统设置和个人偏好将恢复初始状态，所有演示账号的密码也将重置。确定继续吗？',
    okText: '确认重置', okType: 'danger',
    onOk: async () => { await settingsService.resetDemoData(); window.location.reload(); },
  });

  const settingRow = (title: string, description: string, control: React.ReactNode) => (
    <div className="flex items-center justify-between gap-6 border-b border-line-soft py-5 last:border-0">
      <div className="min-w-0"><div className="text-13 font-medium text-slate-800">{title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>{control}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
      <PageHeader title="系统设置" description="配置站点信息、安全策略与通知偏好" />
      {error && <Alert type="error" title={error} action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>重试</Button>} className="mb-4" />}
      <div className="flex min-h-0 min-w-0 flex-1 gap-5">
        <Card className="w-64 shrink-0 xl:w-72">
          <div role="tablist" aria-label="设置分类" aria-orientation="vertical" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {SECTIONS.map((section) => <button key={section.key} type="button" role="tab" id={`settings-tab-${section.key}`} aria-selected={tab.key === section.key}
              aria-controls={`settings-panel-${section.key}`} onClick={() => setParams({ tab: section.key }, { replace: true })}
              className={cn('flex w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400', tab.key === section.key ? 'border-line bg-slate-100 text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50')}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500"><Icon icon={section.icon} size={18} /></span>
              <span className="min-w-0"><span className="block text-13 font-medium">{section.label}</span><span className="mt-0.5 block text-[11px] text-slate-500">{section.description}</span></span>
            </button>)}
          </div>
        </Card>
        <Card role="tabpanel" id={`settings-panel-${tab.key}`} aria-labelledby={`settings-tab-${tab.key}`} className="min-h-0 min-w-0 flex-1">
          <CardHeader className="shrink-0"><div><CardTitle>{tab.label}</CardTitle><CardDescription>{tab.description}</CardDescription></div></CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {!draft ? <div className="space-y-6"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-9" /><Skeleton className="h-24" /></div> : <>
              <div className={tab.key === 'basic' ? '' : 'hidden'}>
                <Form form={form} disabled={!canSave}>
                  <Form.Item name="siteName" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]} extra="显示在侧边栏与浏览器标题中">
                    <Input placeholder="请输入站点名称" maxLength={50} />
                  </Form.Item>
                  <Form.Item name="description" label="站点说明" className="mb-0"><Input.TextArea rows={3} maxLength={200} placeholder="简要介绍这个管理端" /></Form.Item>
                </Form>
              </div>
              {tab.key === 'security' && <div>
                <Alert type="info" title="密码策略" description="策略应用于新增账号、重置密码和修改密码；已有密码不会被自动修改。" className="mb-3" />
                {settingRow('密码最少长度', '可设置为 6–32 位', <InputNumber id="password-min-length" min={6} max={32} value={draft.security.passwordMinLength} disabled={!canSave} onChange={(value) => setDraft({ ...draft, security: { ...draft.security, passwordMinLength: value ?? 6 } })} className="w-28" />)}
                {settingRow('必须包含数字', '新密码至少包含一个数字', <Switch aria-label="必须包含数字" checked={draft.security.requireNumber} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, security: { ...draft.security, requireNumber: checked } })} />)}
                {settingRow('必须包含字母', '新密码至少包含一个英文字母', <Switch aria-label="必须包含字母" checked={draft.security.requireLetter} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, security: { ...draft.security, requireLetter: checked } })} />)}
              </div>}
              {tab.key === 'notifications' && <div>
                <p className="mb-2 text-xs text-slate-500">选择您希望接收的通知类型，演示环境仅保存偏好。</p>
                {settingRow('系统公告', '接收系统更新与维护公告', <Switch aria-label="系统公告" checked={draft.notifications.systemNotice} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, notifications: { ...draft.notifications, systemNotice: checked } })} />)}
                {settingRow('账号变更提醒', '账号资料或角色发生变化时提醒', <Switch aria-label="账号变更提醒" checked={draft.notifications.accountChange} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, notifications: { ...draft.notifications, accountChange: checked } })} />)}
                {settingRow('每周摘要', '汇总一周的系统使用情况', <Switch aria-label="每周摘要" checked={draft.notifications.weeklySummary} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, notifications: { ...draft.notifications, weeklySummary: checked } })} />)}
              </div>}
              {tab.key === 'demo' && <div className="space-y-5">
                <Alert type="warning" title="恢复初始演示环境" description="重置将覆盖当前浏览器中保存的所有演示数据，此操作无法撤销。" />
                <div className="rounded-xl border border-line p-5"><h3 className="text-13 font-medium text-slate-900">初始数据</h3><p className="mt-2 text-13 leading-6 text-slate-600">150 名用户 · 3 个角色 · 6 个功能页面</p><p className="mt-2 text-xs leading-5 text-slate-500">包含超级管理员、运营人员和访客账号，以及默认菜单、安全策略与通知偏好。</p></div>
                {canReset && <Button variant="danger" onClick={reset}><Icon icon="rotate-ccw" size={16} />重置演示数据</Button>}
              </div>}
            </>}
          </CardContent>
          {tab.key !== 'demo' && <CardFooter className="shrink-0 justify-end">{canSave && <Button onClick={save} loading={saving} disabled={!draft}><Icon icon="check" size={16} />保存设置</Button>}</CardFooter>}
        </Card>
      </div>
    </div>
  );
};
