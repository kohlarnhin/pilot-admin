import * as React from "react";
import { cn } from "@/utils";

export interface DescriptionItem {
  key: string;
  label: React.ReactNode;
  children: React.ReactNode;
  /** 占满整行，适合备注等长文本。 */
  full?: boolean;
}

export interface DescriptionsProps {
  items: DescriptionItem[];
  column?: 1 | 2 | 3;
  bordered?: boolean;
  className?: string;
  "aria-label"?: string;
}

const GRID = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" } as const;

/** 描述列表：语义化 <dl>；默认标签在上、值在下，bordered 为标签在左的表格样式。窄屏自动收为单列。 */
export function Descriptions({ items, column = 2, bordered = false, className, ...aria }: DescriptionsProps) {
  if (bordered) {
    return (
      <dl {...aria} className={cn("grid gap-px overflow-hidden rounded-lg border border-line bg-line", GRID[column], className)}>
        {items.map((item) => (
          <div key={item.key} className={cn("flex min-w-0 bg-white", item.full && "col-span-full")}>
            <dt className="w-28 shrink-0 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">{item.label}</dt>
            <dd className="min-w-0 flex-1 break-words px-3 py-2.5 text-13 leading-5 text-slate-800">{item.children}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl {...aria} className={cn("grid gap-x-6 gap-y-4", GRID[column], className)}>
      {items.map((item) => (
        <div key={item.key} className={cn("min-w-0", item.full && "col-span-full")}>
          <dt className="text-xs text-slate-500">{item.label}</dt>
          <dd className="mt-1 break-words text-13 leading-5 text-slate-800">{item.children}</dd>
        </div>
      ))}
    </dl>
  );
}
