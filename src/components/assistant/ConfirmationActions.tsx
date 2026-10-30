import { t, useT } from '@/i18n';
import { Check, ShieldCheck, MessageCircle } from 'lucide-react';
import type { AgentChoice } from '@/types';
import { Button } from '@/ui/button';
import { cn } from '@/utils';

interface ConfirmationActionsProps {
  messageId: string;
  choices: AgentChoice[];
  selectedChoiceId?: string;
  active: boolean;
  onChoice: (messageId: string, choice: AgentChoice) => void;
}

export function ConfirmationActions({ messageId, choices, selectedChoiceId, active, onChoice }: ConfirmationActionsProps) {
  useT();
  const selectedChoice = choices.find(choice => choice.id === selectedChoiceId);

  const prompts = choices.every(choice => choice.id.startsWith('prompt:'));
  const selectingRole = choices.every(choice => choice.id.startsWith('role:'));

  return (
    <div className="mt-3 w-full rounded-xl border border-line bg-slate-50/60 p-3">
      <div className="flex items-start gap-2">
        {selectedChoice ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : prompts ? <MessageCircle className="mt-0.5 size-4 shrink-0 text-slate-400" /> : <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" />}
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-800">{selectedChoice ? t('assistant.confirmation.selected', { label: selectedChoice.label }) : prompts ? t('assistant.confirmation.prompts') : selectingRole ? t('assistant.confirmation.role') : t('assistant.confirmation.waiting')}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {selectedChoice ? t('assistant.confirmation.selectedHint') : active ? prompts ? t('assistant.confirmation.promptHint') : selectingRole ? t('assistant.confirmation.roleHint') : t('assistant.confirmation.activeHint') : t('assistant.confirmation.expiredHint')}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t('assistant.confirmation.groupLabel')}>
        {choices.map(choice => {
          const selected = selectedChoiceId === choice.id;
          return (
            <Button
              key={choice.id}
              variant={choice.id === 'confirm' ? 'primary' : 'outline'}
              size="xs"
              disabled={!active}
              aria-pressed={selected}
              onClick={() => onChoice(messageId, choice)}
              className={cn('h-8 min-w-0 max-w-full shadow-none', selected && 'ring-2 ring-slate-300 disabled:opacity-100')}
            >
              {selected ? <Check className="size-3" /> : null}
              <span className="truncate">{choice.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
