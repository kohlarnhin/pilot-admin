import { t, useT } from '@/i18n';
import { EmptyState } from '@/components/assistant/EmptyState';
import { Input } from '@/ui/input';
import { FieldLabel } from '@/ui/form';
import type { AssistantSectionProps } from './types';

export default function IdentitySection({ draft, disabled, onDraftChange }: AssistantSectionProps) {
  useT();
  if (!draft) return null;
  return <div className="grid min-w-0 gap-6 xl:grid-cols-2">
    <div className="min-w-0">
      <FieldLabel htmlFor="assistant-name">{t('assistantSettings.greeting.name')}</FieldLabel>
      <Input id="assistant-name" value={draft.name} disabled={disabled} maxLength={40} aria-required aria-invalid={!draft.name.trim()} aria-describedby={!draft.name.trim() ? 'assistant-name-error' : undefined} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} />
      {!draft.name.trim() ? <p id="assistant-name-error" role="alert" className="mt-1 text-xs text-red-600">{t('assistantSettings.greeting.nameRequired')}</p> : null}
      <div className="h-4" />
      <FieldLabel htmlFor="assistant-greeting">{t('assistantSettings.greeting.introduction')}</FieldLabel>
      <Input.TextArea id="assistant-greeting" rows={6} maxLength={4000} showCount disabled={disabled} value={draft.greeting} aria-required aria-invalid={!draft.greeting.trim()} aria-describedby={`assistant-greeting-hint${!draft.greeting.trim() ? ' assistant-greeting-error' : ''}`} onChange={(event) => onDraftChange({ ...draft, greeting: event.target.value })} />
      {!draft.greeting.trim() ? <p id="assistant-greeting-error" role="alert" className="mt-1 text-xs text-red-600">{t('assistantSettings.greeting.greetingRequired')}</p> : null}
      <p id="assistant-greeting-hint" className="mt-2 text-xs leading-5 text-slate-500">{t('assistantSettings.greeting.placeholder')}</p>
    </div>
    <div aria-label={t('assistantSettings.greeting.preview')} className="min-w-0 rounded-xl border border-line-soft bg-slate-50/40 px-4 [&>div]:py-5 [&_h3]:break-words [&_p]:break-words [&_button_span]:break-words">
      <EmptyState profile={draft} disabled={disabled} onPrompt={() => {}} promptHint={t('assistantSettings.greeting.promptHint')} />
    </div>
  </div>;
}
