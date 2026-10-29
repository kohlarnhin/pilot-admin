import * as React from "react";
import { cn } from "@/utils";
import { Icon } from "@/components/icon";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

export interface RowActionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Iconify 图标名，统一 16px 线性图标 */
  icon: string;
  /** 悬浮提示与无障碍名称 */
  label: string;
  /** 禁用时的原因说明（替代 label 作为提示） */
  disabledReason?: string;
  tone?: "default" | "danger" | "brand";
  loading?: boolean;
  size?: "sm" | "md";
}

/**
 * 表格行内图标操作：32px 方形透明按钮，静止灰色；
 * 悬浮时中性操作浅灰底、危险操作淡红底。
 */
export const RowAction = React.forwardRef<HTMLButtonElement, RowActionProps>(
  ({ icon, label, disabledReason, tone = "default", loading, size = "md", className, disabled, ...props }, ref) => (
    <Tooltip title={disabled && disabledReason ? disabledReason : label}>
      <Button
        ref={ref}
        variant={tone === "danger" ? "danger" : tone === "brand" ? "ghost" : "subtle"}
        size={size === "sm" ? "icon-xs" : "icon-sm"}
        aria-label={label}
        disabled={disabled}
        loading={loading}
        className={cn("text-slate-500", className)}
        {...props}
      >
        <Icon icon={icon} size={size === "sm" ? 15 : 17} />
      </Button>
    </Tooltip>
  )
);
RowAction.displayName = "RowAction";

/** 行内操作组：按钮间距 2px，居中对齐 */
export function RowActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("inline-flex items-center justify-center gap-0.5", className)}>{children}</div>;
}
