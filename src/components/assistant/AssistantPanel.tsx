import { type ReactNode, useEffect, useState } from 'react';
import { cn } from '@/utils';

interface AssistantPanelProps {
  open: boolean;
  expanded: boolean;
  children: ReactNode;
}

export function AssistantPanel({ open, expanded, children }: AssistantPanelProps) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    const timer = window.setTimeout(() => setPresent(false), 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open && !present) return null;

  return (
    <section
      id="ai-assistant-panel"
      role="dialog"
      aria-labelledby="ai-assistant-title"
      aria-describedby="ai-assistant-description"
      aria-modal="false"
      aria-hidden={!open || undefined}
      inert={!open || undefined}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'ai-assistant-panel fixed inset-x-0 bottom-0 z-[80] flex h-[min(760px,100dvh)] min-w-0 flex-col overflow-hidden rounded-t-2xl border border-line bg-white text-13 text-slate-700 shadow-overlay sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(760px,calc(100dvh-48px))] sm:max-w-[calc(100vw-48px)] sm:rounded-2xl',
        expanded ? 'sm:w-[720px]' : 'sm:w-[440px]'
      )}
    >
      {children}
    </section>
  );
}
