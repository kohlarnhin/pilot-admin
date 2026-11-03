import { t, useT } from '@/i18n';
import { type RefObject, useEffect, useMemo, useState } from 'react';
import { ArrowDown, Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { AgentChatProgress, AgentChoice } from '@/types';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import { Spinner } from '@/ui/spinner';
import type { AssistantMessage } from './conversationStorage';
import { EmptyState } from './EmptyState';
import type { AgentProfile } from '@/api/services/agentProfileService';
import { MessageBubble } from './MessageBubble';
import { ProgressIndicator, TypingIndicator } from './ProgressIndicator';

interface MessageListProps {
  fullScreen?: boolean;
  profile: AgentProfile;
  sessionId: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  anchorSpacerRef: RefObject<HTMLDivElement | null>;
  messages: AssistantMessage[];
  hasConfig: boolean | null;
  loading: boolean;
  loadingOlder: boolean;
  hasMoreBefore: boolean;
  sending: boolean;
  streamingMessageId: string | null;
  requestProgress: AgentChatProgress | null;
  activeChoiceMessageId: string | null;
  activeSelectionMessageId: string | null;
  showScrollToLatest: boolean;
  onScroll: () => void;
  onScrollToLatest: () => void;
  onPrompt: (prompt: string) => void;
  onChoice: (messageId: string, choice: AgentChoice) => void;
  onSelection: (messageId: string, selectedIds: string[]) => void;
  planBusyMessageId: string | null;
  onPlanConfirm: (messageId: string) => void;
  onPlanResume: (messageId: string) => void;
  onPlanStop: (messageId: string) => void;
  onPlanAdjust: (messageId: string) => void;
  onRetry: () => void;
  onProgressToggle: (anchor: HTMLButtonElement, toggle: () => void) => void;
}

type MessageListItem =
  | { kind: 'message'; message: AssistantMessage; index: number }
  | { kind: 'progress'; id: string; steps: AssistantMessage[]; live: boolean };

function groupProgressMessages(messages: AssistantMessage[]): MessageListItem[] {
  const items: MessageListItem[] = [];
  messages.forEach((message, index) => {
    if (message.kind !== 'progress') {
      items.push({ kind: 'message', message, index });
      return;
    }
    const previous = items[items.length - 1];
    if (previous?.kind === 'progress') {
      previous.steps.push(message);
      previous.live = index === messages.length - 1;
    } else {
      items.push({ kind: 'progress', id: message.id, steps: [message], live: index === messages.length - 1 });
    }
  });
  return items;
}

export function MessageList({ sessionId, fullScreen = false,
  profile, scrollRef, contentRef, anchorSpacerRef, messages, hasConfig, loading, loadingOlder, hasMoreBefore, sending,
  streamingMessageId, requestProgress, activeChoiceMessageId, activeSelectionMessageId, showScrollToLatest,
  onScroll, onScrollToLatest, onPrompt, onChoice, onSelection, onRetry, onProgressToggle,
  planBusyMessageId, onPlanConfirm, onPlanResume, onPlanStop, onPlanAdjust,
}: MessageListProps) {
  useT();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const items = useMemo(() => groupProgressMessages(messages), [messages]);

  useEffect(() => {
    if (loading || messages.length === 0) setExpandedGroups(new Set());
  }, [loading, messages.length]);

  const progressIsInMessages = requestProgress?.messageId !== undefined
    && requestProgress.messageId !== null
    && messages.some(message => message.id === String(requestProgress.messageId));
  const hasStreamingMessage = messages.some(message => message.id === streamingMessageId);
  const selectedChoices = new Map(messages.filter(message => message.sourceMessageId)
    .map(message => [message.sourceMessageId, message.selectedChoiceId]));
  const selections = new Map(messages.flatMap(message => message.sourceMessageId
    && message.interaction?.type === 'selection_submission'
    ? [[message.sourceMessageId, message.interaction.selectedIds] as const] : []));

  return (
    <div className="relative min-h-0 flex-1">
      {loadingOlder ? <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center"><span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/95 px-3 py-1 text-[11px] text-slate-500 shadow-xs" role="status"><Spinner size={12} />{t('assistant.messages.loadingOlder')}</span></div> : null}
      <div ref={scrollRef} onScroll={onScroll} className="ai-assistant-scroll h-full overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus [overflow-anchor:none]" aria-label={t('assistant.messages.region')} role="region" tabIndex={0}>
        <div ref={contentRef} className={`mx-auto flex min-h-full flex-col ${fullScreen ? 'max-w-[760px]' : 'max-w-[640px]'}`}>
          {loading ? (
            <div className="space-y-6" role="status" aria-label={t('assistant.messages.loading')}>
              <Skeleton className="ml-auto h-12 w-2/3 rounded-xl bg-slate-100" />
              <div className="space-y-3"><Skeleton className="h-5 w-28 bg-slate-100" /><Skeleton className="h-3 w-full bg-slate-100" /><Skeleton className="h-3 w-4/5 bg-slate-100" /></div>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState fullScreen={fullScreen} profile={profile} notConfigured={hasConfig === false} disabled={hasConfig !== true} onPrompt={onPrompt} />
          ) : (
            <div className="flex min-w-0 flex-col gap-5" role="log" aria-label={t('assistant.messages.log')} aria-live="polite" aria-relevant="additions text" aria-busy={sending}>
              {hasMoreBefore ? <p className="pb-1 text-center text-[11px] text-slate-500">{t('assistant.messages.olderHint')}</p> : null}
              {items.map(item => {
                if (item.kind === 'progress') {
                  const expanded = expandedGroups.has(item.id);
                  const stepsId = `assistant-progress-${item.id}`;
                  const steps = () => item.steps.map(message => (
                    <ProgressIndicator
                      key={message.id}
                      message={message.content}
                      active={item.live && sending && requestProgress?.messageId !== undefined && String(requestProgress.messageId) === message.id}
                      elapsedSeconds={requestProgress?.messageId !== undefined && String(requestProgress.messageId) === message.id ? requestProgress.elapsedSeconds : message.elapsedSeconds}
                    />
                  ));
                  return (
                    <div key={item.id} aria-live={item.live ? undefined : 'off'}>
                      {item.live ? <div className="flex min-w-0 flex-col gap-5">{steps()}</div> : (
                        <>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={stepsId}
                            onClick={event => onProgressToggle(event.currentTarget, () => setExpandedGroups(current => {
                              const next = new Set(current);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            }))}
                            className="flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-sm text-left text-xs leading-5 text-slate-500 hover:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            <Check className="mt-1 size-3 shrink-0" />
                            <span>{t('assistant.messages.stepsCompleted', { count: item.steps.length })}</span>
                            {expanded ? <ChevronDown className="mt-1 size-3 shrink-0" /> : <ChevronRight className="mt-1 size-3 shrink-0" />}
                          </button>
                          <div id={stepsId} hidden={!expanded}>
                            {expanded ? <div className="mt-3 flex min-w-0 flex-col gap-5">{steps()}</div> : null}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                const { message, index } = item;
                return (
                  <MessageBubble
                    key={message.id}
                    assistantName={profile.name}
                    message={message}
                    sessionId={sessionId}
                    streaming={sending && streamingMessageId === message.id}
                    activeProgress={sending && requestProgress?.messageId !== undefined && String(requestProgress.messageId) === message.id}
                    progressElapsedSeconds={requestProgress?.messageId !== undefined && String(requestProgress.messageId) === message.id ? requestProgress.elapsedSeconds : undefined}
                    choicesActive={activeChoiceMessageId === message.id}
                    selectionActive={activeSelectionMessageId === message.id}
                    submittedIds={selections.get(message.id)}
                    selectedChoiceId={message.selectedChoiceId || selectedChoices.get(message.id)}
                    canRetry={!sending && index === messages.length - 1 && message.kind === 'error'}
                    onRetry={onRetry}
                    onChoice={onChoice}
                    onSelection={onSelection}
                    planBusy={planBusyMessageId === message.id}
                    onPlanConfirm={onPlanConfirm}
                    onPlanResume={onPlanResume}
                    onPlanStop={onPlanStop}
                    onPlanAdjust={onPlanAdjust}
                  />
                );
              })}
              {sending && requestProgress && !progressIsInMessages ? <ProgressIndicator message={requestProgress.message} active elapsedSeconds={requestProgress.elapsedSeconds} /> : null}
              {sending && !hasStreamingMessage ? <TypingIndicator /> : null}
            </div>
          )}
          <div ref={anchorSpacerRef} aria-hidden="true" className="shrink-0" />
        </div>
      </div>
      {showScrollToLatest ? <Button variant="outline" size="xs" onClick={onScrollToLatest} aria-label={t('assistant.messages.latestLabel')} className="absolute bottom-3 left-1/2 h-8 -translate-x-1/2 rounded-full bg-white/95 px-3 text-xs text-slate-600 shadow-pop"><ArrowDown className="size-3" />{t('assistant.messages.latest')}</Button> : null}
    </div>
  );
}
