import { t, useT } from '@/i18n';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/ui/button';
import { useLazyResource } from '@/hooks/useLazyResource';
import { useAssistantRuntime } from './AssistantRuntime';
import { useAssistantStore } from '@/store/assistantStore';
import { assistantUI } from './assistantResources';
import { AssistantLoadState } from './AssistantLoadState';
import { assistantPanelClassName } from './panelStyles';

export function AIAssistant() {
  useT();
  const { chat } = useAssistantRuntime();
  const isOpen = useAssistantStore((state) => state.panelOpen);
  const closePanel = useAssistantStore((state) => state.closePanel);
  const togglePanel = useAssistantStore((state) => state.togglePanel);
  const setStreaming = useAssistantStore((state) => state.setStreaming);
  const [expanded, setExpanded] = useState(false);
  const { value, error, retry } = useLazyResource(assistantUI, isOpen);
  useEffect(() => {
    setStreaming(chat.isSending);
  }, [chat.isSending, setStreaming]);

  useEffect(() => () => setStreaming(false), [setStreaming]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        if (chat.showHistory) chat.setShowHistory(false);
        else closePanel();
      } else if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'j') {
        const target = event.target;
        if (target instanceof HTMLElement
          && target.closest('input, textarea, select, [contenteditable], [role="textbox"]')
          && !target.closest('[data-assistant-composer]')) return;
        event.preventDefault();
        togglePanel(target instanceof HTMLElement ? target : undefined);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, chat.showHistory, chat.setShowHistory, closePanel, togglePanel]);

  if (value) return <value.AssistantPanelUI expanded={expanded} setExpanded={setExpanded} />;
  if (!isOpen) return null;
  return <section id="ai-assistant-panel" role="dialog" aria-modal="false" aria-label={t('layout.assistant')} className={assistantPanelClassName(expanded)}>
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line-soft px-4"><h2 className="text-13 font-semibold text-slate-900">{t('layout.assistant')}</h2><Button variant="ghost" size="icon-xs" aria-label={t('assistant.header.close')} onClick={closePanel}><X className="size-4" /></Button></header>
    <AssistantLoadState error={error} retry={retry} />
  </section>;
}
