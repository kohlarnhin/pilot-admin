import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/utils";

import { resolvePlacement, type Placement } from "./placement";

export type { Placement } from "./placement";

export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLElement>, "title" | "children"> {
  title?: React.ReactNode;
  placement?: Placement;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 单位：秒，与历史调用保持一致 */
  mouseEnterDelay?: number;
  className?: string;
  /** 浅色气泡（展示较多结构化内容时使用） */
  variant?: "dark" | "light";
  ref?: React.Ref<HTMLElement>;
}

/**
 * 深色紧凑提示气泡。title 为空时直接渲染子节点；
 * 子节点为纯文本或禁用按钮时自动包裹 span，保证悬浮事件可达。
 */
export function Tooltip({
  title,
  placement = "top",
  children,
  open,
  onOpenChange,
  mouseEnterDelay,
  className,
  variant = "dark",
  ref,
  ...triggerProps
}: TooltipProps) {
  const child = React.isValidElement(children) && !(children.props as { disabled?: boolean }).disabled
    ? children
    : <span className="inline-flex">{children}</span>;

  // 外层触发器（Popconfirm / Popover 等 asChild）注入的事件与 ref 需透传到真实子节点
  if (title === undefined || title === null || title === false || title === "") {
    return (
      <Slot ref={ref} {...triggerProps}>
        {child}
      </Slot>
    );
  }
  const { side, align } = resolvePlacement(placement);

  return (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      delayDuration={mouseEnterDelay !== undefined ? mouseEnterDelay * 1000 : undefined}
    >
      <TooltipPrimitive.Trigger asChild ref={ref as React.Ref<HTMLButtonElement>} {...triggerProps}>
        {child}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-[1100] max-w-xs animate-pop-in break-words rounded-md px-2.5 py-1.5 text-xs leading-[18px]",
            variant === "dark"
              ? "bg-slate-900/95 text-white shadow-pop"
              : "border border-line bg-white text-slate-700 shadow-pop",
            className
          )}
        >
          {title}
          <TooltipPrimitive.Arrow
            width={10}
            height={5}
            className={variant === "dark" ? "fill-slate-900/95" : "fill-white"}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
