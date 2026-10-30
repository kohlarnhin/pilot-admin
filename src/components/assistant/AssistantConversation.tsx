import { t, useT } from '@/i18n';
import { useEffect } from 'react';
import { useAssistantRuntime } from './AssistantRuntime';
import { useAssistantScroll } from './useAssistantScroll';
import { MessageList } from './MessageList';
import { Composer } from './Composer';

/** 两种对话界面共享消息、交互卡片、滚动和输入框。 */
export function AssistantConversation({ fullScreen = false }: { fullScreen?: boolean }) {
  useT();
  const runtime = useAssistantRuntime();
  const { chat, profile, inputRef } = runtime;
  const isOpen = fullScreen || runtime.panelOpen;
  const historyOverlay = !fullScreen && chat.showHistory;
  const scroll = useAssistantScroll({
    isOpen, showHistory: historyOverlay, messages: chat.messages, isSending: chat.isSending,
    hasMoreBefore: chat.hasMoreBefore, onLoadOlder: chat.loadOlderMessages,
  });
  useEffect(() => {
    if (!isOpen || historyOverlay || chat.isSending || chat.isLoadingSession) return;
    const frame = requestAnimationFrame(() => {
      // 异步配置/历史恢复完成不能抢走用户刚打开的菜单、弹窗或后台输入焦点。
      const active = document.activeElement;
      if (document.querySelector('[role="menu"], [aria-haspopup="menu"][aria-expanded="true"]')) return;
      if (active instanceof HTMLElement && (active.closest('[role="dialog"]:not(#ai-assistant-panel)')
        || (active.matches('input, textarea, select') && active !== inputRef.current))) return;
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, historyOverlay, chat.isSending, chat.isLoadingSession, chat.hasConfig, inputRef]);
  return <div className="flex h-full min-h-0 min-w-0 flex-col" inert={historyOverlay || undefined} aria-hidden={historyOverlay || undefined}>
    <MessageList fullScreen={fullScreen} profile={profile} sessionId={String(chat.activeSessionId ?? '')}
      scrollRef={scroll.scrollRef} contentRef={scroll.contentRef} anchorSpacerRef={scroll.anchorSpacerRef}
      messages={chat.messages} hasConfig={chat.hasConfig} loading={chat.isLoadingSession}
      loadingOlder={chat.isLoadingMoreMessages} hasMoreBefore={chat.hasMoreBefore} sending={chat.isSending}
      streamingMessageId={chat.streamingMessageId} requestProgress={chat.requestProgress}
      activeChoiceMessageId={chat.activeChoiceMessageId} activeSelectionMessageId={chat.activeSelectionMessageId}
      showScrollToLatest={scroll.showScrollToLatest} onScroll={scroll.handleScroll}
      onScrollToLatest={() => scroll.scrollToLatest('smooth')}
      onPrompt={prompt => { chat.setDraft(prompt); void chat.sendContent(prompt); }}
      onChoice={chat.handleChoice} onSelection={chat.handleSelection}
      planBusyMessageId={chat.planBusyMessageId}
      onPlanConfirm={chat.confirmPlan} onPlanResume={chat.resumePlan} onPlanStop={messageId => { void chat.stopPlan(messageId); }}
      onPlanAdjust={() => { chat.setDraft(t('assistant.plan.adjustPrompt')); requestAnimationFrame(() => inputRef.current?.focus()); }}
      onRetry={chat.retryLastMessage} onProgressToggle={scroll.preserveScrollAnchor} />
    {chat.hasConfig === false && chat.messages.length > 0
      ? <p className="px-5 pb-2 text-xs text-slate-500" role="status">{t('assistant.empty.modelRequired')}</p> : null}
    <div className={fullScreen ? 'mx-auto w-full max-w-[792px] shrink-0 px-4 pb-3' : 'shrink-0'}>
      <Composer attachment={runtime.attachment} parsingAttachment={runtime.parsingAttachment}
        onAttach={file => { void runtime.handleAttach(file); }} onRemoveAttachment={runtime.removeAttachment}
        inputRef={inputRef} draft={chat.draft} disabled={chat.hasConfig !== true || chat.isLoadingSession || chat.isReconciling}
        sending={chat.isSending || chat.planBusyMessageId !== null} awaitingChoice={Boolean(chat.activeChoiceMessageId)}
        onChange={chat.setDraft} onSend={runtime.sendDraft} onStop={chat.stopGenerating} />
    </div>
  </div>;
}
