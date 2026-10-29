import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/utils";
import { resolvePlacement, type Placement } from "./tooltip";

export interface DropdownMenuItem {
  key: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  type?: "divider" | "item";
  onClick?: (info: { key: string }) => void;
}

export interface DropdownProps {
  menu?: {
    items: Array<DropdownMenuItem | null | false | undefined>;
    onClick?: (info: { key: string }) => void;
  };
  /** 完全自定义浮层内容（替代 menu） */
  popupRender?: (menuNode: React.ReactNode) => React.ReactNode;
  placement?: Placement;
  trigger?: Array<"click" | "hover">;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const menuItemClass =
  "flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-13 text-slate-700 outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-slate-500";

/** 下拉菜单：圆角浅色面板、36px 菜单项、危险项红色悬浮。 */
export function Dropdown({
  menu,
  popupRender,
  placement = "bottomLeft",
  open,
  onOpenChange,
  disabled,
  className,
  children,
}: DropdownProps) {
  const { side, align } = resolvePlacement(placement);
  const items = (menu?.items ?? []).filter(Boolean) as DropdownMenuItem[];
  const openRef = React.useRef(open ?? false);
  React.useLayoutEffect(() => {
    if (open !== undefined) openRef.current = open;
  }, [open]);

  const menuNode = items.map((item) =>
    item.type === "divider" ? (
      <DropdownPrimitive.Separator key={item.key} className="-mx-1.5 my-1.5 h-px bg-line-soft" />
    ) : (
      <DropdownPrimitive.Item
        key={item.key}
        disabled={item.disabled}
        onSelect={() => {
          item.onClick?.({ key: item.key });
          menu?.onClick?.({ key: item.key });
        }}
        className={cn(
          menuItemClass,
          item.danger && "text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-600 [&_svg]:text-red-500"
        )}
      >
        {item.icon}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </DropdownPrimitive.Item>
    )
  );

  return (
    <DropdownPrimitive.Root open={open} onOpenChange={(next) => {
      openRef.current = next;
      onOpenChange?.(next);
    }} modal={false}>
      <DropdownPrimitive.Trigger asChild disabled={disabled}>
        {React.isValidElement(children) ? children : <span className="inline-flex">{children}</span>}
      </DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          onCloseAutoFocus={(event) => {
            // 快速重开或 StrictMode 重放时，旧浮层的延迟清理不能移走当前菜单焦点。
            if (openRef.current) event.preventDefault();
          }}
          className={cn(
            "z-[1050] min-w-[168px] animate-pop-in rounded-xl border border-line bg-white p-1.5 shadow-pop outline-none",
            className
          )}
        >
          {popupRender ? popupRender(menuNode) : menuNode}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

export const DropdownItem = DropdownPrimitive.Item;
export const DropdownSeparator = DropdownPrimitive.Separator;
