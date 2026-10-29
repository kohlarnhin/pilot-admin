import { t, useT } from '@/i18n';
import { useCan } from '@/hooks/usePermission';
import { useEffect, useState, type ReactNode } from 'react';
import { AgentConfigPanel } from '@/pages/settings/AgentConfigPanel';
import { agentProfileService, type AgentProfile } from '@/api/services/agentProfileService';
import { EmptyState } from '@/components/assistant/EmptyState';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { FieldLabel } from '@/ui/form';
import { message } from '@/ui/message';

function Section({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-line bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
      <div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>{action}
    </div><div className="p-5">{children}</div>
  </section>;
}

export function AgentSettingsPage() {
  useT();
  const can = useCan();
  const canView = can('agent-config:view');
  const canUpdate = can('agent-config:update');
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [saving, setSaving] = useState<'greeting' | 'suggestions' | null>(null);
  const [failed, setFailed] = useState(false);
  const load = () => {
    setFailed(false);
    void agentProfileService.getSettings().then(setProfile).catch(e => { setFailed(true); message.error(e.message); });
  };
  useEffect(() => { if (canView) load(); }, [canView]);

  if (!canView) return <p className="p-6 text-slate-500">{t('assistantSettings.accessDenied')}</p>;
  const save = async (section: 'greeting' | 'suggestions', input: Parameters<typeof agentProfileService.save>[0]) => {
    setSaving(section);
    try { await agentProfileService.save(input); message.success(t('common.toast.saved')); }
    catch (e) { message.error((e as Error).message); }
    finally { setSaving(null); }
  };
  const saveButton = (section: 'greeting' | 'suggestions', input: Parameters<typeof agentProfileService.save>[0], invalid = false) =>
    <Button variant="outline" size="sm" disabled={!canUpdate || saving !== null || invalid} loading={saving === section} onClick={() => void save(section, input)}>{t(section === 'greeting' ? 'assistantSettings.greeting.save' : 'assistantSettings.shortcuts.save')}</Button>;

  return <div className="mx-auto min-h-0 w-full max-w-[1440px] space-y-5 overflow-y-auto px-1 pb-6 pr-3" aria-label={t('menu.assistant')}>
    <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl border border-line bg-white"><Icon icon="bot" size={21} className="text-slate-600" /></div>
      <div><h1 className="text-xl font-semibold tracking-tight text-slate-900">{t('menu.assistant')}</h1><p className="mt-1 text-xs text-slate-500">{t('assistantSettings.description')}</p></div>
    </div>
    <Section title={t('assistantSettings.models.title')} description={t('assistantSettings.models.description')}><AgentConfigPanel active /></Section>
    {!profile ? <div role="status" className="rounded-xl border border-line bg-white p-8 text-center text-sm text-slate-500">{failed ? <Button variant="outline" onClick={load}>{t('assistantSettings.profile.retry')}</Button> : t('assistantSettings.profile.loading')}</div> : <>
      <Section title={t('assistantSettings.greeting.title')} description={t('assistantSettings.greeting.description')} action={saveButton('greeting', { name: profile.name, greeting: profile.greeting }, !profile.greeting.trim() || !profile.name.trim())}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]">
          <div><FieldLabel htmlFor="assistant-name">{t('assistantSettings.greeting.name')}</FieldLabel><Input id="assistant-name" className="mb-4" value={profile.name} disabled={!canUpdate} maxLength={40} onChange={e => setProfile({ ...profile, name: e.target.value })} /><FieldLabel htmlFor="assistant-greeting">{t('assistantSettings.greeting.introduction')}</FieldLabel><Input.TextArea id="assistant-greeting" rows={6} maxLength={4000} showCount disabled={!canUpdate} value={profile.greeting} onChange={e => setProfile({ ...profile, greeting: e.target.value })} /><p className="mt-2 text-xs text-slate-400">{t('assistantSettings.greeting.placeholder')}</p></div>
          <div aria-label={t('assistantSettings.greeting.preview')} className="rounded-xl border border-line-soft bg-slate-50/40 px-4 [&>div]:py-5"><EmptyState profile={profile} onPrompt={() => {}} promptHint={t('assistantSettings.greeting.promptHint')} /></div>
        </div>
      </Section>
      <Section title={t('assistantSettings.shortcuts.title')} description={t('assistantSettings.shortcuts.description')} action={saveButton('suggestions', { suggestions: profile.suggestions }, profile.suggestions.some(s => !s.label.trim() || !s.prompt.trim()))}>
        <div className="space-y-3">{profile.suggestions.map((suggestion, index) => <div key={index} className="flex items-start gap-3 rounded-lg border border-line-soft p-3">
          <span className="pt-2 font-mono text-xs text-slate-400">{String(index + 1).padStart(2, '0')}</span>
          <div className="grid min-w-0 flex-1 gap-2 lg:grid-cols-[minmax(160px,1fr)_2fr]">
            <Input aria-label={t('assistantSettings.shortcuts.label', { index: index + 1 })} maxLength={60} disabled={!canUpdate} value={suggestion.label} onChange={e => setProfile({ ...profile, suggestions: profile.suggestions.map((s, i) => i === index ? { ...s, label: e.target.value } : s) })} />
            <Input.TextArea aria-label={t('assistantSettings.shortcuts.prompt', { index: index + 1 })} rows={1} maxLength={2000} autoSize={{ minRows: 1, maxRows: 4 }} disabled={!canUpdate} value={suggestion.prompt} onChange={e => setProfile({ ...profile, suggestions: profile.suggestions.map((s, i) => i === index ? { ...s, prompt: e.target.value } : s) })} />
          </div>
          <div className="flex shrink-0 gap-1">{([-1, 1] as const).map(delta => <Button key={delta} variant="ghost" size="icon-sm" aria-label={t('assistantSettings.shortcuts.moveLabel', { index: index + 1, direction: delta < 0 ? t('assistantSettings.shortcuts.moveUp') : t('assistantSettings.shortcuts.moveDown') })} disabled={!canUpdate || index + delta < 0 || index + delta >= profile.suggestions.length} onClick={() => { const next = [...profile.suggestions]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; setProfile({ ...profile, suggestions: next }); }}><Icon icon={delta < 0 ? 'arrow-up' : 'arrow-down'} size={14} /></Button>)}
            <Button variant="ghost" size="icon-sm" aria-label={t('assistantSettings.shortcuts.deleteLabel', { index: index + 1 })} disabled={!canUpdate} onClick={() => setProfile({ ...profile, suggestions: profile.suggestions.filter((_, i) => i !== index) })}><Icon icon="x" size={14} /></Button>
          </div>
        </div>)}</div>
        <Button className="mt-3" variant="outline" size="sm" disabled={!canUpdate || profile.suggestions.length >= 6} onClick={() => setProfile({ ...profile, suggestions: [...profile.suggestions, { label: '', prompt: '' }] })}><Icon icon="plus" size={14} />{t('assistantSettings.shortcuts.add')}</Button>
      </Section>

    </>}
  </div>;
}
