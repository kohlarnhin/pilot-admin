import { t, useT } from '@/i18n';
import { useState } from 'react';
import { History, Maximize2, Minimize2, SquarePen, SquareTerminal, X } from 'lucide-react';
import { Icon } from '@/components/icon';
import { LogoMark } from '@/components/logo';
import { Button } from '@/ui/button';
import { Tooltip } from '@/ui/tooltip';
import { Popconfirm } from '@/ui/popover';
import { getAssistantShortcut } from './assistantUtils';
import { Kbd } from '@/components/common/Kbd';

interface AssistantHeaderProps {
  name: string;
  notifications: { enabled: boolean; requesting: boolean; tooltip: string; toggle: () => Promise<void> };
  expanded: boolean;
  historyOpen: boolean;
  busy: boolean;
  onNewChat: () => void;
  onHistory: () => void;
  onExpand: () => void;
  onAgent: () => void;
  onClose: () => void;
}

export function AssistantHeader({
  name, notifications, expanded, historyOpen, busy, onNewChat, onHistory, onExpand, onAgent, onClose,
}: AssistantHeaderProps) {
  useT();
  const [shortcut] = useState(getAssistantShortcut);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line-soft px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <LogoMark size={28} />
        <div className="min-w-0">
          <h2 id="ai-assistant-title" className="truncate text-13 font-semibold tracking-tight text-slate-900">
            {name}
          </h2>
          <p id="ai-assistant-description" className="truncate text-[11px] leading-4 text-slate-400">
            {t('assistant.header.subtitle')}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip title={notifications.tooltip}>
          <Button variant="ghost" size="icon-xs" aria-label={t('assistant.header.notifications')} aria-pressed={notifications.enabled} disabled={notifications.requesting} onClick={() => void notifications.toggle()}>
            <Icon icon={notifications.enabled ? 'bell-ring' : 'bell-off'} size={14} />
          </Button>
        </Tooltip>
        <Popconfirm title={t('assistant.header.newConfirm')} okText={t('assistant.header.start')} cancelText={t('common.actions.cancel')} onConfirm={onNewChat} disabled={busy}>
          <Tooltip title={t('assistant.header.newConversation')}>
            <Button variant="ghost" size="icon-xs" aria-label={t('assistant.header.startConversation')} disabled={busy}>
              <SquarePen className="size-3.5" />
            </Button>
          </Tooltip>
        </Popconfirm>
        <Tooltip title={t('assistant.header.history')}>
          <Button variant="ghost" size="icon-xs" aria-label={t('assistant.header.history')} aria-expanded={historyOpen} aria-controls="ai-assistant-history" pressed={historyOpen} onClick={onHistory}>
            <History className="size-3.5" />
          </Button>
        </Tooltip>
        <Tooltip title={t('agentEntry.agent')}><Button variant="ghost" size="icon-xs" aria-label={t('agentEntry.agent')} onClick={onAgent}><SquareTerminal className="size-3.5" /></Button></Tooltip>
        <Tooltip title={expanded ? t('assistant.header.collapse') : t('assistant.header.expand')}>
          <Button variant="ghost" size="icon-xs" aria-label={expanded ? t('assistant.header.collapse') : t('assistant.header.expand')} aria-pressed={expanded} onClick={onExpand}>
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
        </Tooltip>
        <Tooltip title={
          <div className="space-y-1">
            <span className="flex items-center justify-between gap-3">{t('common.actions.close')}<Kbd>Esc</Kbd></span>
            <span className="flex items-center gap-2 text-slate-300"><Kbd>{shortcut.label}</Kbd>{t('assistant.header.toggle')}</span>
          </div>
        }>
          <Button variant="ghost" size="icon-xs" aria-label={t('assistant.header.close')} onClick={onClose}>
            <X className="size-4" />
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
