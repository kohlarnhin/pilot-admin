import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button-variants";
import { cn } from "@/utils";
import { Spinner } from "./spinner";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  /** 切换型按钮的按下状态（筛选开关等），按下时呈中性灰色选中态 */
  pressed?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, pressed, disabled, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          buttonVariants({ variant, size }),
          pressed && "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-100",
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-pressed={pressed}
        {...props}
      >
        {loading && <Spinner size={size === "xs" || size === "icon-xs" ? 12 : 14} className="text-current" />}
        {loading && (size === "icon" || size === "icon-sm" || size === "icon-xs") ? null : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
