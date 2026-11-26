import * as React from "react";
import { cn } from "@/utils";

export type TimelineTone = "default" | "success" | "warning" | "danger" | "processing";

export interface TimelineItem {
  key: string;
  title: React.ReactNode;
  time?: React.ReactNode;
  /** 机器可读时间，写入 <time dateTime>。 */
  dateTime?: string;
  description?: React.ReactNode;
  tone?: TimelineTone;
}

const DOT: Record<TimelineTone, string> = {
  default: "border-slate-300 bg-white",
  success: "border-emerald-500 bg-emerald-500",
  warning: "border-amber-500 bg-amber-500",
  danger: "border-red-500 bg-red-500",
  processing: "border-brand-500 bg-white ring-[3px] ring-brand-500/15",
};

/** 时间线：有序列表，圆点颜色只作辅助，状态需写在标题或说明里。 */
export function Timeline({ items, className, ...aria }: { items: TimelineItem[]; className?: string; "aria-label"?: string }) {
  return (
    <ol {...aria} className={className}>
      {items.map((item, index) => (
        <li key={item.key} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[5px] top-4 w-px bg-line" />}
          <span aria-hidden="true" className={cn("relative mt-1 size-[11px] shrink-0 rounded-full border-2", DOT[item.tone ?? "default"])} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-13 font-medium text-slate-800">{item.title}</p>
              {item.time && <time dateTime={item.dateTime} className="text-xs tabular-nums text-slate-500">{item.time}</time>}
            </div>
            {item.description && <div className="mt-1 text-xs leading-5 text-slate-500">{item.description}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
