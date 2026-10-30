import { type ReactNode, useEffect, useState } from 'react';
import { assistantPanelClassName } from './panelStyles';

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
      className={assistantPanelClassName(expanded)}
    >
      {children}
    </section>
  );
}
