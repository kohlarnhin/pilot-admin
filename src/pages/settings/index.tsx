import { t, useT } from '@/i18n';
import { useCan } from '@/hooks/usePermission';
import { useDataChanged } from '@/hooks/useDataChanged';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { settingsService } from '@/api/services/settingsService';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/common/PageHeader';
import { Icon } from '@/components/icon';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Form } from '@/ui/form';
import { getRovingTabProps } from '@/ui/roving-tabs';
import { Input } from '@/ui/input';
import { Alert, InputNumber, Switch } from '@/ui/controls';
import { Button } from '@/ui/button';
import { Modal } from '@/ui/modal';
import { Skeleton } from '@/ui/skeleton';
import { message } from '@/ui/message';
import { cn } from '@/utils';
import type { SystemSettings } from '@/types';

const SECTIONS = [
  { key: 'basic', label: 'settings.sections.basic.title', description: 'settings.sections.basic.description', icon: 'settings-2' },
  { key: 'security', label: 'settings.sections.security.title', description: 'settings.sections.security.description', icon: 'shield-check' },
  { key: 'notifications', label: 'settings.sections.notifications.title', description: 'settings.sections.notifications.description', icon: 'bell' },
  { key: 'demo', label: 'settings.sections.demo.title', description: 'settings.sections.demo.description', icon: 'database' },
] as const;

export const SettingsPage: React.FC = () => {
  useT();
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
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const preserveDraftOnReload = useRef(false);
  useDataChanged((reason) => {
    if (reason !== 'locale') return;
    preserveDraftOnReload.current = true;
    setAttempt((value) => value + 1);
  });

  useEffect(() => {
    let active = true; setError('');
    const preserveDraft = preserveDraftOnReload.current;
    preserveDraftOnReload.current = false;
    settingsService.getSettings().then((result) => {
      if (!active) return;
      if (preserveDraft && draftRef.current) return;
      setDraft(result.data); form.setFieldsValue(result.data.basic);
    }).catch((cause: Error) => { if (active) setError(cause.message || t('settings.errors.load')); });
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
      message.success(t('settings.toast.saved'));
    } catch (cause: any) {
      if (!cause?.errorFields) message.error(cause.message || t('common.toast.saveFailed'));
    } finally { setSaving(false); }
  };

  const reset = () => Modal.confirm({
    title: t('button.settingsReset'), icon: <Icon icon="database" size={18} />,
    content: t('settings.demo.confirmContent'),
    okText: t('common.actions.confirmReset'), okType: 'danger',
    onOk: async () => { await settingsService.resetDemoData(); window.location.reload(); },
  });

  const settingRow = (title: string, description: string, control: React.ReactNode) => (
    <div className="flex items-center justify-between gap-6 border-b border-line-soft py-5 last:border-0">
      <div className="min-w-0"><div className="text-13 font-medium text-slate-800">{title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>{control}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
      <PageHeader title={t('menu.settings')} description={t('settings.description')} />
      {error && <Alert type="error" title={error} action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>{t('common.actions.retry')}</Button>} className="mb-4" />}
      <div className="flex min-h-0 min-w-0 flex-1 gap-5">
        <Card className="w-64 shrink-0 xl:w-72">
          <div role="tablist" aria-label={t('settings.sectionLabel')} aria-orientation="vertical" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {SECTIONS.map((section) => <button key={section.key} type="button" role="tab" id={`settings-tab-${section.key}`} aria-selected={tab.key === section.key}
              {...getRovingTabProps(tab.key === section.key, () => setParams({ tab: section.key }, { replace: true }), 'vertical')}
              aria-controls={`settings-panel-${section.key}`} onClick={() => setParams({ tab: section.key }, { replace: true })}
              className={cn('flex w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400', tab.key === section.key ? 'border-line bg-slate-100 text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50')}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500"><Icon icon={section.icon} size={18} /></span>
              <span className="min-w-0"><span className="block text-13 font-medium">{t(section.label)}</span><span className="mt-0.5 block text-[11px] text-slate-500">{t(section.description)}</span></span>
            </button>)}
          </div>
        </Card>
        <Card role="tabpanel" id={`settings-panel-${tab.key}`} aria-labelledby={`settings-tab-${tab.key}`} tabIndex={0} className="min-h-0 min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-300">
          <CardHeader className="shrink-0"><div><CardTitle>{t(tab.label)}</CardTitle><CardDescription>{t(tab.description)}</CardDescription></div></CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {!draft ? <div className="space-y-6"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-9" /><Skeleton className="h-24" /></div> : <>
              <div className={tab.key === 'basic' ? '' : 'hidden'}>
                <Form form={form} disabled={!canSave}>
                  <Form.Item name="siteName" label={t('settings.basic.name')} rules={[{ required: true, message: t('serverErrors.settings.nameRequired') }]} extra={t('settings.basic.nameHint')}>
                    <Input placeholder={t('serverErrors.settings.nameRequired')} maxLength={50} />
                  </Form.Item>
                  <Form.Item name="description" label={t('settings.basic.description')} className="mb-0"><Input.TextArea rows={3} maxLength={200} placeholder={t('settings.basic.descriptionPlaceholder')} /></Form.Item>
                </Form>
              </div>
              {tab.key === 'security' && <div>
                <Alert type="info" title={t('settings.security.title')} description={t('settings.security.policyHint')} className="mb-3" />
                {settingRow(t('settings.security.minLength'), t('settings.security.lengthHint'), <InputNumber id="password-min-length" min={6} max={32} value={draft.security.passwordMinLength} disabled={!canSave} onChange={(value) => setDraft({ ...draft, security: { ...draft.security, passwordMinLength: value ?? 6 } })} className="w-28" />)}
                {settingRow(t('settings.security.requireNumber'), t('settings.security.numberHint'), <Switch aria-label={t('settings.security.requireNumber')} checked={draft.security.requireNumber} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, security: { ...draft.security, requireNumber: checked } })} />)}
                {settingRow(t('settings.security.requireLetter'), t('settings.security.letterHint'), <Switch aria-label={t('settings.security.requireLetter')} checked={draft.security.requireLetter} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, security: { ...draft.security, requireLetter: checked } })} />)}
              </div>}
              {tab.key === 'notifications' && <div>
                <p className="mb-2 text-xs text-slate-500">{t('settings.notifications.description')}</p>
                {settingRow(t('settings.notifications.systemNotices'), t('settings.notifications.noticesHint'), <Switch aria-label={t('settings.notifications.systemNotices')} checked={draft.notifications.systemNotice} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, notifications: { ...draft.notifications, systemNotice: checked } })} />)}
                {settingRow(t('settings.notifications.accountChanges'), t('settings.notifications.accountHint'), <Switch aria-label={t('settings.notifications.accountChanges')} checked={draft.notifications.accountChange} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, notifications: { ...draft.notifications, accountChange: checked } })} />)}
                {settingRow(t('settings.notifications.weeklySummary'), t('settings.notifications.summaryHint'), <Switch aria-label={t('settings.notifications.weeklySummary')} checked={draft.notifications.weeklySummary} disabled={!canSave} onChange={(checked) => setDraft({ ...draft, notifications: { ...draft.notifications, weeklySummary: checked } })} />)}
              </div>}
              {tab.key === 'demo' && <div className="space-y-5">
                <Alert type="warning" title={t('settings.sections.demo.description')} description={t('settings.demo.warning')} />
                <div className="rounded-xl border border-line p-5"><h3 className="text-13 font-medium text-slate-900">{t('settings.demo.initialData')}</h3><p className="mt-2 text-13 leading-6 text-slate-600">{t('settings.demo.summary')}</p><p className="mt-2 text-xs leading-5 text-slate-500">{t('settings.demo.description')}</p></div>
                {canReset && <Button variant="danger" onClick={reset}><Icon icon="rotate-ccw" size={16} />{t('button.settingsReset')}</Button>}
              </div>}
            </>}
          </CardContent>
          {tab.key !== 'demo' && <CardFooter className="shrink-0 justify-end">{canSave && <Button onClick={save} loading={saving} disabled={!draft}><Icon icon="check" size={16} />{t('button.settingsUpdate')}</Button>}</CardFooter>}
        </Card>
      </div>
    </div>
  );
};
