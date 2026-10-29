import { t, useT } from '@/i18n';
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils";
import { Button, type ButtonProps } from "./button";
import { resolvePlacement, type Placement } from "./tooltip";

export const PopoverRoot = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const popoverSurface =
  "z-[1050] rounded-xl border border-line bg-white text-slate-700 shadow-pop outline-none animate-pop-in";

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, sideOffset = 6, collisionPadding = 8, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(popoverSurface, "p-3", className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

export interface PopoverProps {
  content: React.ReactNode;
  title?: React.ReactNode;
  placement?: Placement;
  trigger?: "click" | "hover";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 单位：秒 */
  mouseEnterDelay?: number;
  className?: string;
  children: React.ReactNode;
}

/** 浅色浮层卡片，支持点击与悬浮两种触发方式。 */
export function Popover({
  content,
  title,
  placement = "top",
  trigger = "hover",
  open: controlledOpen,
  onOpenChange,
  mouseEnterDelay = 0.15,
  className,
  children,
}: PopoverProps) {
  const [innerOpen, setInnerOpen] = React.useState(false);
  const open = controlledOpen ?? innerOpen;
  const timer = React.useRef<number | undefined>(undefined);
  const setOpen = React.useCallback((next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange]);
  const { side, align } = resolvePlacement(placement);

  const hoverHandlers = trigger === "hover"
    ? {
        onPointerEnter: () => {
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setOpen(true), mouseEnterDelay * 1000);
        },
        onPointerLeave: () => {
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setOpen(false), 120);
        },
      }
    : {};

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild {...hoverHandlers}>
        {React.isValidElement(children) ? children : <span className="inline-flex">{children}</span>}
      </PopoverPrimitive.Trigger>
      <PopoverContent
        side={side}
        align={align}
        className={className}
        onOpenAutoFocus={trigger === "hover" ? (event) => event.preventDefault() : undefined}
        {...hoverHandlers}
      >
        {title && <div className="mb-2 text-13 font-medium text-slate-900">{title}</div>}
        {content}
      </PopoverContent>
    </PopoverPrimitive.Root>
  );
}

export interface PopconfirmProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  onConfirm?: (event?: React.MouseEvent) => unknown;
  onCancel?: (event?: React.MouseEvent) => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: "primary" | "danger" | "default";
  okButtonProps?: ButtonProps & { danger?: boolean };
  cancelButtonProps?: ButtonProps;
  disabled?: boolean;
  placement?: Placement;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** 气泡确认框：确认回调返回 Promise 时自动展示加载态并在完成后关闭。 */
export function Popconfirm({
  title,
  description,
  onConfirm,
  onCancel,
  okText = t('common.actions.confirm'),
  cancelText = t('common.actions.cancel'),
  okType,
  okButtonProps,
  cancelButtonProps,
  disabled,
  placement = "top",
  icon,
  className,
  children,
}: PopconfirmProps) {
  useT();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const { side, align } = resolvePlacement(placement);
  const { danger, className: okClassName, loading: okLoading, ...restOk } = okButtonProps ?? {};
  const isDanger = danger || okType === "danger";

  const handleConfirm = async (event: React.MouseEvent) => {
    try {
      const result = onConfirm?.(event);
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setPending(true);
        await result;
      }
      setOpen(false);
    } catch {
      // 失败时保持气泡打开，由调用方提示错误
    } finally {
      setPending(false);
    }
  };

  const trigger = React.isValidElement(children) ? children : <span className="inline-flex">{children}</span>;
  if (disabled) return trigger;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <PopoverPrimitive.Trigger asChild onClick={(event) => event.stopPropagation()}>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn("w-[280px] p-4", className)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex gap-2.5">
          <span className={cn("mt-px flex shrink-0", isDanger ? "text-red-500" : "text-slate-500")}>
            {icon ?? <AlertCircle className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-13 font-medium text-slate-900">{title}</div>
            {description && <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>}
          </div>
        </div>
        <div className="mt-3.5 flex justify-end gap-2">
          <Button
            size="xs"
            variant="outline"
            {...cancelButtonProps}
            onClick={(event) => {
              setOpen(false);
              onCancel?.(event);
            }}
          >
            {cancelText}
          </Button>
          <Button
            size="xs"
            variant={isDanger ? "destructive" : "primary"}
            loading={pending || Boolean(okLoading)}
            className={okClassName}
            {...restOk}
            onClick={handleConfirm}
          >
            {okText}
          </Button>
        </div>
      </PopoverContent>
    </PopoverPrimitive.Root>
  );
}
