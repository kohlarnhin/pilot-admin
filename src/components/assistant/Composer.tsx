import { type KeyboardEvent, type RefObject, useLayoutEffect, useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/ui/button';
import { Tooltip } from '@/ui/tooltip';
import { cn } from '@/utils';
import { MAX_INPUT_LENGTH } from './assistantUtils';
import { Icon } from '@/components/icon';
import type { AssistantAttachment } from './attachmentStore';

interface ComposerProps {
  attachment: AssistantAttachment | null;
  parsingAttachment: boolean;
  onAttach: (file: File) => void;
  onRemoveAttachment: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  disabled: boolean;
  sending: boolean;
  awaitingChoice: boolean;
  onChange: (draft: string) => void;
  onSend: () => void;
  onStop: () => void;
}

export function Composer({ attachment, parsingAttachment, onAttach, onRemoveAttachment, inputRef, draft, disabled, sending, awaitingChoice, onChange, onSend, onStop }: ComposerProps) {
  const composingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blocked = disabled || parsingAttachment || Boolean(attachment?.error);

  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    const resize = () => {
      textarea.style.height = '0px';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
    };
    resize();
    let previousWidth = textarea.parentElement?.clientWidth;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width !== previousWidth) {
        previousWidth = width;
        resize();
      }
    });
    if (textarea.parentElement) observer.observe(textarea.parentElement);
    return () => observer.disconnect();
  }, [draft, inputRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing
      || composingRef.current || event.keyCode === 229) return;
    event.preventDefault();
    if (!sending && !blocked) onSend();
  };

  return (
    <footer className="shrink-0 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
      <form
        data-assistant-composer
        onDragOver={event => { if (!disabled && !sending) event.preventDefault(); }}
        onDrop={event => { event.preventDefault(); if (!disabled && !sending && event.dataTransfer.files[0]) onAttach(event.dataTransfer.files[0]); }}
        onSubmit={event => { event.preventDefault(); if (!sending && !blocked) onSend(); }}
        className={cn('rounded-xl border border-line bg-slate-50/60 p-2 shadow-2xs transition-colors focus-within:border-slate-400 focus-within:bg-white focus-within:ring-[3px] focus-within:ring-slate-900/10', disabled && 'opacity-60')}
      >
        <input ref={fileInputRef} type="file"  className="hidden" aria-label="附加文件" disabled={disabled || sending || parsingAttachment} onChange={event => { const file = event.target.files?.[0]; if (file) onAttach(file); event.target.value = ''; }} />
        {attachment || parsingAttachment ? <div role="status" className={cn('mb-1 flex items-center gap-2 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-slate-600', attachment?.error && 'border-red-200 text-red-600')}>
          <Icon icon="file-code" size={14} className="shrink-0" /><div className="min-w-0 flex-1"><p className="truncate">{attachment?.file.name || '正在读取附件…'}</p><p className="mt-0.5 text-[11px]">{parsingAttachment ? '正在解析…' : attachment?.error || `${attachment?.metadata.size ?? 0} 字节${attachment?.metadata.lineCount === undefined ? '' : ` · ${attachment.metadata.lineCount} 行`} · 仅元数据`}</p></div>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="移除附件" disabled={sending || parsingAttachment} onClick={onRemoveAttachment}><Icon icon="x" size={12} /></Button>
        </div> : null}
        <textarea
          ref={inputRef}
          value={draft}
          rows={1}
          maxLength={MAX_INPUT_LENGTH}
          disabled={disabled || sending}
          onChange={event => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { composingRef.current = true; }}
          onCompositionEnd={() => { composingRef.current = false; }}
          placeholder={disabled ? '助手暂不可用' : awaitingChoice ? '请输入你的决定…' : '描述你的问题或需求…'}
          aria-label="发送给 AI 助手的消息"
          className="ai-assistant-scroll block min-h-12 w-full resize-none overflow-y-auto bg-transparent px-1.5 py-2 text-13 leading-5 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <div className="mt-1 flex items-center justify-between gap-2 pl-1.5">
          <Tooltip title="附加文件，最大 5 MB；仅保留名称、大小、类型和文本行数">
            <Button type="button" variant="ghost" size="icon-xs" aria-label="附加文件" disabled={disabled || sending || parsingAttachment} onClick={() => fileInputRef.current?.click()}><Icon icon="paperclip" size={14} /></Button>
          </Tooltip>
          <span className="hidden flex-1 text-[11px] text-slate-400 sm:block">{sending ? '可随时停止' : 'Enter 发送'}</span>
          <div className="flex shrink-0 items-center gap-2">
            {draft.length >= MAX_INPUT_LENGTH * 0.8 ? <span className={cn('text-[11px] tabular-nums text-slate-400', draft.length === MAX_INPUT_LENGTH && 'text-amber-600')} aria-live="polite">{draft.length}/{MAX_INPUT_LENGTH}</span> : null}
            <Tooltip title={sending ? '停止生成' : '发送消息'}>
              <Button
                type={sending ? 'button' : 'submit'}
                variant={sending ? 'secondary' : 'primary'}
                size="icon-sm"
                disabled={!sending && (blocked || (!draft.trim() && !attachment))}
                onClick={sending ? onStop : undefined}
                aria-label={sending ? '停止生成' : '发送消息'}
                className="size-8 rounded-lg shadow-none"
              >
                {sending ? <Square className="size-3 fill-current" /> : <ArrowUp className="size-4" />}
              </Button>
            </Tooltip>
          </div>
        </div>
      </form>
    </footer>
  );
}
