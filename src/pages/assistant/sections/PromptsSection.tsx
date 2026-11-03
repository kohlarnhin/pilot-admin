import { t, useT } from '@/i18n';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import type { AssistantSectionProps } from './types';

export default function PromptsSection({ draft, disabled, onDraftChange }: AssistantSectionProps) {
  useT();
  if (!draft) return null;
  return <div>
    <div className="space-y-3">{draft.suggestions.map((suggestion, index) => <div key={index} className="flex min-w-0 items-start gap-3 rounded-xl border border-line-soft p-3">
      <span className="pt-2 font-mono text-xs text-slate-500">{String(index + 1).padStart(2, '0')}</span>
      <div className="grid min-w-0 flex-1 gap-2 xl:grid-cols-[minmax(140px,1fr)_2fr]">
        <div className="min-w-0">
          <Input aria-label={t('assistantSettings.shortcuts.label', { index: index + 1 })} aria-required aria-invalid={!suggestion.label.trim()} aria-describedby={!suggestion.label.trim() ? `shortcut-label-error-${index}` : undefined} maxLength={60} disabled={disabled} value={suggestion.label} onChange={(event) => onDraftChange({ ...draft, suggestions: draft.suggestions.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} />
          {!suggestion.label.trim() ? <p id={`shortcut-label-error-${index}`} role="alert" className="mt-1 text-xs text-red-600">{t('assistantSettings.shortcuts.labelRequired')}</p> : null}
        </div>
        <div className="min-w-0">
          <Input.TextArea aria-label={t('assistantSettings.shortcuts.prompt', { index: index + 1 })} aria-required aria-invalid={!suggestion.prompt.trim()} aria-describedby={!suggestion.prompt.trim() ? `shortcut-prompt-error-${index}` : undefined} rows={1} maxLength={2000} autoSize={{ minRows: 1, maxRows: 4 }} disabled={disabled} value={suggestion.prompt} onChange={(event) => onDraftChange({ ...draft, suggestions: draft.suggestions.map((item, i) => i === index ? { ...item, prompt: event.target.value } : item) })} />
          {!suggestion.prompt.trim() ? <p id={`shortcut-prompt-error-${index}`} role="alert" className="mt-1 text-xs text-red-600">{t('assistantSettings.shortcuts.promptRequired')}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">{([-1, 1] as const).map((delta) => <Button key={delta} variant="ghost" size="icon-sm" aria-label={t('assistantSettings.shortcuts.moveLabel', { index: index + 1, direction: delta < 0 ? t('assistantSettings.shortcuts.moveUp') : t('assistantSettings.shortcuts.moveDown') })} disabled={disabled || index + delta < 0 || index + delta >= draft.suggestions.length} onClick={() => {
        const next = [...draft.suggestions];
        [next[index], next[index + delta]] = [next[index + delta], next[index]];
        onDraftChange({ ...draft, suggestions: next });
      }}><Icon icon={delta < 0 ? 'arrow-up' : 'arrow-down'} size={14} /></Button>)}
        <Button variant="ghost" size="icon-sm" aria-label={t('assistantSettings.shortcuts.deleteLabel', { index: index + 1 })} disabled={disabled} onClick={() => onDraftChange({ ...draft, suggestions: draft.suggestions.filter((_, i) => i !== index) })}><Icon icon="x" size={14} /></Button>
      </div>
    </div>)}</div>
    <Button className="mt-3" variant="outline" size="sm" disabled={disabled || draft.suggestions.length >= 6} onClick={() => onDraftChange({ ...draft, suggestions: [...draft.suggestions, { label: '', prompt: '' }] })}><Icon icon="plus" size={14} />{t('assistantSettings.shortcuts.add')}</Button>
  </div>;
}
