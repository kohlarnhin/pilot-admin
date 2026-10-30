import { t, useT } from '@/i18n';
import { Check } from 'lucide-react';
import { Spinner } from '@/ui/spinner';
import { cn } from '@/utils';

interface ProgressIndicatorProps {
  message: string;
  active?: boolean;
  elapsedSeconds?: number;
  className?: string;
}

export function ProgressIndicator({ message, active, elapsedSeconds = 0, className }: ProgressIndicatorProps) {
  return (
    <div className={cn('flex min-w-0 items-start gap-2 text-xs leading-5 text-slate-400', className)} role={active ? 'status' : undefined}>
      {active ? <Spinner size={13} className="mt-1 text-brand-600 motion-reduce:animate-none" /> : <Check className="mt-1 size-3 shrink-0" />}
      <span className={cn('min-w-0 break-words', active && 'text-slate-500')}>{message}</span>
      {active && elapsedSeconds >= 15 ? <span className="shrink-0 tabular-nums">{elapsedSeconds}s</span> : null}
    </div>
  );
}

export function TypingIndicator() {
  useT();
  return (
    <span className="ai-assistant-thinking inline-flex h-5 items-center gap-1" role="status" aria-label={t('assistant.messages.typing')}>
      <i /><i /><i />
    </span>
  );
}
