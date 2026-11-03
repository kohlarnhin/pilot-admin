import { Icon } from '@/components/icon';
import { cn } from '@/utils';

export interface StepItem {
  id: string;
  title: string;
  status: 'done' | 'current' | 'upcoming' | 'error';
  statusLabel: string;
  current?: boolean;
  disabled?: boolean;
}

/** 有序步骤保留原生 Tab/Enter/Space；宿主负责验证与可达步骤。 */
export function Steps({ items, onChange, label }: { items: StepItem[]; onChange: (index: number) => void; label: string }) {
  return <nav aria-label={label}>
    <ol className="flex flex-wrap gap-x-4 gap-y-3">
      {items.map((item, index) => <li key={item.id} className="min-w-0 flex-1 basis-32">
        <button type="button" onClick={() => !item.disabled && onChange(index)} aria-disabled={item.disabled || undefined}
          aria-current={item.current || item.status === 'current' ? 'step' : undefined}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-focus aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent">
          <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
            item.status === 'current' ? 'border-brand-500 bg-brand-50 text-brand-700' : item.status === 'error' ? 'border-red-300 text-red-600' : 'border-line bg-white text-slate-600')}>
            {item.status === 'done' ? <Icon icon="check" size={16} /> : item.status === 'error' ? <Icon icon="circle-alert" size={16} /> : index + 1}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-13 font-medium text-slate-800" title={item.title}>{item.title}</span>
            <span className="block text-xs text-slate-500">{item.statusLabel}</span>
          </span>
        </button>
      </li>)}
    </ol>
  </nav>;
}
