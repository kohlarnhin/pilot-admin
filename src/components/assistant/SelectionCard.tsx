import { t, useT } from '@/i18n';
import { useEffect, useRef, useState } from 'react';
import { Check, Rocket } from 'lucide-react';
import type { AgentSelection } from '@/types';
import { Checkbox } from '@/ui/controls';
import { Button } from '@/ui/button';

interface SelectionCardProps {
  form: AgentSelection;
  active: boolean;
  submittedIds?: string[];
  onSubmit: (ids: string[]) => void;
}

export function SelectionCard({ form, active, submittedIds, onSubmit }: SelectionCardProps) {
  useT();
  const [selectedIds, setSelectedIds] = useState(form.defaultSelectedIds);
  const submittingRef = useRef(false);
  const selected = new Set(submittedIds ?? selectedIds);
  const submitted = submittedIds !== undefined;
  const editable = active && !submitted;
  useEffect(() => {
    if (editable) submittingRef.current = false;
  }, [editable]);
  const selectableIds = form.options.filter(option => !option.disabled).map(option => option.id);

  return (
    <section className="mt-3 min-w-0 overflow-hidden rounded-xl border border-line bg-white" aria-label={t('assistant.selection.region')}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50 px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-700">
          {submitted ? <Check className="size-3.5 shrink-0 text-emerald-600" /> : <Rocket className="size-3.5 shrink-0 text-slate-400" />}
          {submitted ? t('assistant.selection.submitted') : form.title}
        </span>
        <span className="text-[11px] tabular-nums text-slate-500">{t('assistant.selection.count', { count: selected.size, max: form.maxSelected })}</span>
      </div>
      <div className="max-h-[min(320px,42dvh)] min-w-0 divide-y divide-line-row overflow-x-hidden overflow-y-auto overscroll-contain">
        {form.options.map(option => (
          <div key={option.id} className="flex min-w-0 items-start gap-2.5 px-3 py-3">
            <Checkbox
              className="mt-0.5 shrink-0"
              aria-label={t('assistant.selection.optionLabel', { label: option.label })}
              checked={selected.has(option.id)}
              disabled={!editable || option.disabled || (!selected.has(option.id) && selected.size >= form.maxSelected)}
              onChange={event => setSelectedIds(current => event.target.checked
                ? [...current, option.id] : current.filter(id => id !== option.id))}
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 [overflow-wrap:anywhere]">
                <span className="text-xs font-medium text-slate-700">{option.label}</span>
                <span className="font-mono text-[11px] text-slate-500">{option.description}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-slate-50/50 px-3 py-2.5">
        {editable ? (
          <>
            <div className="flex items-center gap-1">
              <Button size="xs" variant="ghost" disabled={selectableIds.length === 0} onClick={() => setSelectedIds(selectableIds.slice(0, form.maxSelected))}>{t('common.actions.selectAll')}</Button>
              <Button size="xs" variant="ghost" disabled={selected.size < form.minSelected} onClick={() => setSelectedIds([])}>{t('common.actions.clear')}</Button>
            </div>
            <Button variant="primary" size="xs" disabled={selected.size < form.minSelected} onClick={() => {
              if (submittingRef.current || selectedIds.length < form.minSelected) return;
              submittingRef.current = true;
              onSubmit(selectedIds);
            }}>{t('assistant.selection.confirm', { count: selected.size })}</Button>
          </>
        ) : <p className="text-[11px] leading-5 text-slate-500">{submitted ? t('assistant.selection.submittedHint') : t('assistant.selection.inactiveHint')}</p>}
      </div>
    </section>
  );
}
