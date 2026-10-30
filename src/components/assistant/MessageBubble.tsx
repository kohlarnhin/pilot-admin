import { t, useT } from '@/i18n';
import { memo, useMemo } from 'react';
import { AlertCircle, RotateCcw, Square } from 'lucide-react';
import type { AgentChoice } from '@/types';
import { CopyButton } from '@/components/common/CopyButton';
import { LogoMark } from '@/components/logo';
import { Button } from '@/ui/button';
import { cn } from '@/utils';
import type { AssistantMessage } from './conversationStorage';
import { ConfirmationActions } from './ConfirmationActions';
import { Markdown } from './Markdown';
import { ProgressIndicator } from './ProgressIndicator';
import { SelectionCard } from './SelectionCard';
import { PageActionCard } from './PageActionCard';
import { ExecutionPlanCard } from './ExecutionPlanCard';

interface MessageBubbleProps {
  assistantName: string;
  message: AssistantMessage;
  sessionId: string;
  streaming: boolean;
  activeProgress: boolean;
  progressElapsedSeconds?: number;
  choicesActive: boolean;
  selectionActive: boolean;
  submittedIds?: string[];
  selectedChoiceId?: string;
  canRetry: boolean;
  onRetry: () => void;
  onChoice: (messageId: string, choice: AgentChoice) => void;
  onSelection: (messageId: string, selectedIds: string[]) => void;
  planBusy: boolean;
  onPlanConfirm: (messageId: string) => void;
  onPlanResume: (messageId: string) => void;
  onPlanStop: (messageId: string) => void;
  onPlanAdjust: (messageId: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
  assistantName, message, sessionId, streaming, activeProgress, progressElapsedSeconds, choicesActive, selectionActive, submittedIds,
  selectedChoiceId, canRetry, onRetry, onChoice, onSelection,
  planBusy, onPlanConfirm, onPlanResume, onPlanStop, onPlanAdjust,
}: MessageBubbleProps) {
  const { locale } = useT();
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }), [locale]);
  const date = new Date(message.createdAt);
  const time = Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date);
  const timeElement = time ? <time dateTime={message.createdAt} className="text-[11px] tabular-nums text-slate-400">{time}</time> : null;

  if (message.kind === 'progress') {
    return <ProgressIndicator message={message.content} active={activeProgress} elapsedSeconds={progressElapsedSeconds ?? message.elapsedSeconds} />;
  }

  if (message.role === 'user') {
    if (message.selectedChoiceId === 'plan_step') {
      return (
        <div className="flex items-center gap-3 py-1 text-[11px] text-slate-400" aria-label={t('assistant.messages.continuePlan')}>
          <span className="h-px flex-1 bg-slate-100" />
          <span className="rounded-full bg-slate-50 px-2.5 py-1">{t('assistant.messages.continuePlan')}</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
      );
    }
    if (message.selectedChoiceId === 'auto_continue') {
      return (
        <div className="flex items-center gap-3 py-1 text-[11px] text-slate-400" aria-label={t('assistant.messages.continueBatch')}>
          <span className="h-px flex-1 bg-slate-100" />
          <span className="rounded-full bg-slate-50 px-2.5 py-1">{t('assistant.messages.continueBatch')}</span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>
      );
    }
    return (
      <article className="group flex min-w-0 flex-col items-end gap-1" aria-label={t('assistant.messages.user')}>
        <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-slate-100 px-3.5 py-2.5 text-13 leading-6 text-slate-800 [overflow-wrap:anywhere]">
          {message.content}
          {message.interaction?.type === 'attachment_metadata' ? message.interaction.attachments.map(attachment => <p key={attachment.attachmentId} className="mt-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">{t('assistant.messages.attachment', { name: attachment.fileName, size: attachment.size })}</p>) : null}
        </div>
        <div className="px-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{timeElement}</div>
      </article>
    );
  }

  return (
    <article className="group min-w-0" aria-label={message.kind === 'error' ? t('assistant.messages.failed') : t('assistant.messages.assistant')}>
      <div className="mb-2 flex items-center gap-2">
        <LogoMark size={20} />
        <span className="text-xs font-medium text-slate-700">{assistantName}</span>
        <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{timeElement}</span>
      </div>
      {message.kind === 'error' ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/70 p-3 text-13 text-red-700" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap leading-6 [overflow-wrap:anywhere]">{message.content}</p>
            {canRetry ? <Button variant="ghost" size="xs" onClick={onRetry} className="mt-2 -ml-2 text-red-700 hover:bg-red-100 hover:text-red-800"><RotateCcw className="size-3" />{t('assistant.messages.retry')}</Button> : null}
          </div>
        </div>
      ) : (
        <Markdown content={message.content} sessionId={sessionId} />
      )}
      {streaming ? <span className="mt-1 inline-block h-3.5 w-1 animate-pulse rounded-full bg-brand-500 motion-reduce:animate-none" aria-label={t('assistant.messages.generating')} /> : null}
      {message.stopped ? <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-400"><Square className="size-2.5" />{t('assistant.messages.stopped')}</span> : null}
      {message.choices?.length ? (
        <ConfirmationActions messageId={message.id} choices={message.choices} selectedChoiceId={selectedChoiceId} active={choicesActive} onChoice={onChoice} />
      ) : null}
      {message.interaction?.type === 'selection' ? (
        <SelectionCard form={message.interaction} active={selectionActive}
          submittedIds={submittedIds} onSubmit={ids => onSelection(message.id, ids)} />
      )
        : message.interaction?.type === 'execution_plan' ? <ExecutionPlanCard plan={message.interaction}
          busy={planBusy}
          actions={{
            onConfirm: () => onPlanConfirm(message.id),
            onResume: () => onPlanResume(message.id),
            onStop: () => onPlanStop(message.id),
            onAdjust: () => onPlanAdjust(message.id),
          }} />
          : message.interaction?.type === 'page_action' ? <PageActionCard action={message.interaction} sessionId={sessionId} messageId={message.id} /> : null}
      {message.kind !== 'error' && !streaming ? (
        <div className={cn('mt-1 flex h-7 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100')}>
          <CopyButton text={message.content} tip={t('assistant.messages.copy')} secret className="size-7 rounded-md hover:bg-slate-100" size={14} />
        </div>
      ) : null}
    </article>
  );
});
