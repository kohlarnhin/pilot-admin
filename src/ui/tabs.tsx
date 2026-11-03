import * as React from "react";
import { cn } from "@/utils";
import { getRovingTabProps } from './roving-tabs';

export interface TabItem<K extends string = string> {
  key: K;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps<K extends string> {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}

/**
 * 下划线标签页：选中项为深色文字 + 2px 品牌色下划线，悬浮仅加深文字。
 */
export function Tabs<K extends string>({ items, value, onChange, className }: TabsProps<K>) {
  return (
    <div role="tablist" className={cn("flex shrink-0 items-end gap-6 border-b border-line", className)}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            {...getRovingTabProps(active, () => onChange(item.key))}
            onClick={() => onChange(item.key)}
            className={cn(
              "relative -mb-px flex h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 text-13 transition-colors duration-150 focus-visible:outline-none focus-visible:text-slate-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus",
              active ? "border-brand-500 font-medium text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            {item.icon && <span className={cn("flex shrink-0", active ? "text-slate-700" : "text-slate-400")}>{item.icon}</span>}
            {item.label}
            {item.count !== undefined && (
              <span className={cn("text-xs tabular-nums", active ? "text-slate-500" : "text-slate-500")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** 标签页内的分区说明：左侧一句说明，右侧操作。 */
export function SectionBar({ description, actions }: { description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex min-h-9 shrink-0 items-center justify-between gap-4">
      <p className="min-w-0 truncate text-13 text-slate-500">{description}</p>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  );
}
