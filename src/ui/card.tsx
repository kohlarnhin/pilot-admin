import * as React from "react";
import { cn } from "@/utils";
import { Icon } from "@/components/icon";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white text-slate-800 shadow-card",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-center justify-between gap-4 border-b border-line-soft px-6 py-4", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-[15px] font-semibold leading-6 text-slate-900", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("mt-0.5 text-xs leading-5 text-slate-500", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center border-t border-line-soft px-6 py-4", className)}
      {...props}
    />
  );
}

interface CardToolbarProps {
  icon?: string;
  title: React.ReactNode;
  /** 标题右侧计数 / 状态徽标 */
  count?: React.ReactNode;
  description?: React.ReactNode;
  /** 标题左侧的前置内容（返回按钮、面包屑等） */
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * 列表卡片标题栏：24px 图标 + 15px 标题 + 计数徽标 + 12px 说明；右侧搜索 / 筛选 / 操作间距 10px。
 * 所有管理页共用，保证各页面标题区高度、字号与对齐完全一致。
 */
function CardToolbar({ icon, title, count, description, leading, actions, className }: CardToolbarProps) {
  return (
    <div
      data-slot="card-toolbar"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line-soft px-6 py-4",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        {icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-brand-500 shadow-2xs">
            <Icon icon={icon} size={22} />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold leading-6 text-slate-900" title={typeof title === 'string' ? title : undefined}>{title}</h2>
            {count !== undefined && count !== null && (
              <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-line-soft bg-slate-50/60 px-1.5 text-xs tabular-nums text-slate-500">
                {count}
              </span>
            )}
          </div>
          {description && <p className="mt-0.5 truncate text-xs leading-5 text-slate-500" title={typeof description === 'string' ? description : undefined}>{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** 工作台紧凑标题栏：左侧面包屑 / 标题，右侧筛选与操作。 */
function CardBar({ children, actions, className }: { children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="card-bar"
      className={cn(
        "flex min-h-[61px] shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line-soft px-6 py-3",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">{children}</div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/**
 * 列表筛选条：卡片顶部一行，左侧搜索与筛选，右侧结果数或辅助操作。
 */
function ListToolbar({ children, extra, className }: { children?: React.ReactNode; extra?: React.ReactNode; className?: string }) {
  return (
    <div
      data-slot="list-toolbar"
      className={cn("flex min-h-[60px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line-soft px-6 py-3", className)}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">{children}</div>
      {extra && <div className="flex shrink-0 items-center gap-3 text-13 text-slate-500">{extra}</div>}
    </div>
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardToolbar, CardBar, ListToolbar };
