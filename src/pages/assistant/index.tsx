import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { t, useT } from '@/i18n';
import { useCan } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/authStore';
import { agentProfileService } from '@/api/services/agentProfileService';
import { PageHeader } from '@/components/common/PageHeader';
import { Icon } from '@/components/icon';
import { Alert } from '@/ui/controls';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import { getRovingTabProps } from '@/ui/roving-tabs';
import { message } from '@/ui/message';
import { cn } from '@/utils';
import { assistantSections, visibleAssistantSections } from './sections/registry';
import type { FormSection } from './sections/types';
import { isSectionDirty, rebaseProfileDrafts, resetSectionDraft, sectionPatch, type ProfileDrafts } from './drafts';

const formSections = assistantSections.filter((section): section is FormSection => section.kind === 'form');

function ProfileSkeleton() {
  return <div role="status" aria-label={t('assistantSettings.profile.loading')} className="space-y-6"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-9" /><Skeleton className="h-32" /></div>;
}

function AssistantSettingsWorkspace() {
  const { locale } = useT();
  const can = useCan();
  const canUpdate = can('agent-config:update');
  const sections = visibleAssistantSections(assistantSections, can);
  const [params, setParams] = useSearchParams();
  const section = sections.find((item) => item.key === params.get('tab')) || sections[0];
  const [profile, setProfile] = useState<ProfileDrafts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const savingRef = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    void agentProfileService.getSettings().then((result) => {
      if (active) setProfile((previous) => rebaseProfileDrafts(previous, result, formSections));
    }).catch((cause: Error) => {
      if (active) setLoadError(cause.message || t('assistantSettings.profile.loadFailed'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [locale, attempt]);

  if (!section) return null;
  const draft = profile?.sections[section.key] ?? null;
  const dirty = section.kind === 'form' && profile ? isSectionDirty(profile, section) : false;
  const disabled = !canUpdate || saving !== null || loading || Boolean(loadError);
  const select = (key: string) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    next.set('tab', key);
    return next;
  }, { replace: true });

  const save = async () => {
    if (!profile || !draft || section.kind !== 'form' || disabled || savingRef.current || !section.isValid(draft)) return;
    const patch = sectionPatch(draft, section);
    savingRef.current = true;
    setSaving(section.key);
    setSaveErrors((previous) => ({ ...previous, [section.key]: '' }));
    try {
      await agentProfileService.save(patch);
      if (!mounted.current) return;
      setProfile((previous) => previous ? rebaseProfileDrafts(previous, { ...previous.saved, ...patch }, formSections) : previous);
      message.success(t('common.toast.saved'));
    } catch (cause) {
      if (!mounted.current) return;
      const error = (cause as Error).message || t('common.toast.saveFailed');
      setSaveErrors((previous) => ({ ...previous, [section.key]: error }));
      message.error(error);
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(null);
    }
  };

  const ActiveSection = section.Component;
  const content = <Suspense fallback={<div className="p-6"><ProfileSkeleton /></div>}>
    <ActiveSection section={section} draft={draft} disabled={disabled} onDraftChange={(next) => {
      setProfile((previous) => previous ? { ...previous, sections: { ...previous.sections, [section.key]: next } } : previous);
      setSaveErrors((previous) => ({ ...previous, [section.key]: '' }));
    }} />
  </Suspense>;

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
    <PageHeader title={t('menu.assistant')} description={t('assistantSettings.description')} />
    <div className="flex min-h-0 min-w-0 flex-1 gap-5">
      <Card className="w-64 shrink-0 xl:w-72">
        <div role="tablist" aria-label={t('assistantSettings.workspace.sectionLabel')} aria-orientation="vertical" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {sections.map((item) => <button key={item.key} type="button" role="tab" id={`assistant-tab-${item.key}`} aria-selected={section.key === item.key}
            {...getRovingTabProps(section.key === item.key, () => select(item.key), 'vertical')}
            aria-controls={`assistant-panel-${item.key}`} onClick={() => select(item.key)}
            className={cn('flex w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400', section.key === item.key ? 'border-line bg-slate-100 text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50')}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500"><Icon icon={item.icon} size={18} /></span>
            <span className="min-w-0 flex-1"><span className="block text-13 font-medium">{t(item.titleKey)}</span><span className="mt-0.5 block text-[11px] leading-5 text-slate-500">{t(item.descriptionKey)}</span></span>
            {item.kind === 'form' && profile && isSectionDirty(profile, item) ? <span className="shrink-0"><span aria-hidden="true" className="block size-1.5 rounded-full bg-slate-500" /><span className="sr-only">{t('assistantSettings.workspace.unsaved')}</span></span> : null}
          </button>)}
        </div>
      </Card>
      <Card key={section.key} role="tabpanel" id={`assistant-panel-${section.key}`} aria-labelledby={`assistant-tab-${section.key}`} tabIndex={0} className="min-h-0 min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-300">
        {section.kind === 'panel' ? content : <>
          <CardHeader className="shrink-0"><div><CardTitle>{t(section.titleKey)}</CardTitle><CardDescription>{t(section.descriptionKey)}</CardDescription></div></CardHeader>
          <CardContent aria-busy={loading} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
            {loadError ? <Alert type="error" title={loadError} action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>{t('assistantSettings.profile.retry')}</Button>} className="mb-4" /> : null}
            {!profile ? (!loadError ? <ProfileSkeleton /> : null) : content}
          </CardContent>
          {saveErrors[section.key] ? <div className="shrink-0 px-6 pb-4"><Alert type="error" title={saveErrors[section.key]} /></div> : null}
          <CardFooter className="shrink-0 flex-wrap justify-between gap-3">
            <span role="status" className="text-xs text-slate-500">{!canUpdate ? t('assistantSettings.workspace.readOnly') : dirty ? t('assistantSettings.workspace.unsaved') : t('assistantSettings.workspace.saved')}</span>
            <div className="flex gap-2.5">
              <Button disabled={disabled || !dirty} onClick={() => {
                setProfile((previous) => previous ? resetSectionDraft(previous, section) : previous);
                setSaveErrors((previous) => ({ ...previous, [section.key]: '' }));
              }}><Icon icon="rotate-ccw" size={16} />{t('assistantSettings.workspace.reset')}</Button>
              <Button disabled={disabled || !draft || !section.isValid(draft)} loading={saving === section.key} onClick={() => void save()}><Icon icon="check" size={16} />{t(section.saveKey)}</Button>
            </div>
          </CardFooter>
        </>}
      </Card>
    </div>
  </div>;
}

export function AgentSettingsPage() {
  useT();
  const can = useCan();
  const userId = useAuthStore((state) => state.user?.id);
  if (!can('agent-config:view')) return <p className="p-6 text-slate-500">{t('assistantSettings.accessDenied')}</p>;
  return <AssistantSettingsWorkspace key={userId} />;
}
