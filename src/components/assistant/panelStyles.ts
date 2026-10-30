import { cn } from '@/utils';

export const assistantPanelClassName = (expanded: boolean) => cn(
  'ai-assistant-panel fixed inset-x-0 bottom-0 z-[80] flex h-[min(760px,100dvh)] min-w-0 flex-col overflow-hidden rounded-t-2xl border border-line bg-white text-13 text-slate-700 shadow-overlay sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(760px,calc(100dvh-48px))] sm:max-w-[calc(100vw-48px)] sm:rounded-2xl',
  expanded ? 'sm:w-[720px]' : 'sm:w-[440px]'
);
