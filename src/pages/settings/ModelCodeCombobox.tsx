import { t, useT } from '@/i18n';
import { useId, useRef, useState } from 'react';
import { Icon } from '@/components/icon';
import { Input } from '@/ui/input';

interface ModelCodeComboboxProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: string[];
  loading: boolean;
  disabled?: boolean;
  maxLength?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
}

/** 模型发现只提供建议，始终允许输入服务端列表之外的模型编号。 */
export function ModelCodeCombobox({ options, loading, value = '', onChange, ...props }: ModelCodeComboboxProps) {
  useT();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(-1);
  const matches = options.filter(option => option.toLowerCase().includes(query.toLowerCase()));
  const select = (model: string) => {
    onChange?.(model);
    setOpen(false);
    setHighlighted(-1);
  };

  return (
    <div className="relative" onBlur={event => {
      const root = event.currentTarget;
      if (root.contains(event.relatedTarget)) return;
      // 先完成原生焦点转移，再卸载建议项，避免弹窗焦点保护把焦点送回容器。
      window.setTimeout(() => { if (!root.contains(document.activeElement)) setOpen(false); }, 0);
    }}>
      <Input {...props} ref={inputRef} value={value} role="combobox" aria-autocomplete="list" aria-expanded={open}
        aria-controls={listId} aria-activedescendant={open && highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
        placeholder={t('agentConfig.modelPicker.placeholder')} className="pr-9 font-mono"
        onFocus={() => { setQuery(''); setOpen(true); }}
        onChange={event => { onChange?.(event.target.value); setQuery(event.target.value); setHighlighted(-1); setOpen(true); }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setHighlighted(current => matches.length ? Math.max(0, Math.min(matches.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))) : -1);
          } else if (event.key === 'Enter' && open && matches[highlighted]) {
            event.preventDefault();
            select(matches[highlighted]);
          } else if (event.key === 'Escape' && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
        }} />
      <button type="button" disabled={props.disabled} tabIndex={-1} aria-label={t('agentConfig.modelPicker.toggle')} className="absolute right-0 top-0 flex size-9 items-center justify-center text-slate-400"
        onMouseDown={event => event.preventDefault()} onClick={() => {
          inputRef.current?.focus(); setQuery(''); setOpen(!open);
        }}>
        <Icon icon={loading ? 'loader-circle' : 'chevron-down'} size={14} className={loading ? 'animate-spin' : undefined} />
      </button>
      {open && <div id={listId} role="listbox" aria-label={t('agentConfig.modelPicker.label')} className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-line bg-white p-1 shadow-pop">
        {loading ? <p className="px-3 py-2 text-xs text-slate-400">{t('agentConfig.modelPicker.loading')}</p> : matches.length ? matches.map((model, index) => (
          <button key={model} id={`${listId}-${index}`} type="button" role="option" tabIndex={-1} aria-selected={value === model}
            className={`block w-full truncate rounded-md px-3 py-2 text-left font-mono text-xs text-slate-700 hover:bg-slate-50 ${highlighted === index ? 'bg-slate-100' : ''}`}
            onMouseDown={event => event.preventDefault()} onClick={() => select(model)}>{model}</button>
        )) : <p className="px-3 py-2 text-xs text-slate-400">{t('agentConfig.modelPicker.empty')}</p>}
      </div>}
    </div>
  );
}
