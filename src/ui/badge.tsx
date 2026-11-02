import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { badgeVariants } from "./badge-variants";
import { cn } from "@/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, shape }), className)} {...props} />;
}

/** 等宽编码标签：资源编码、版本号等标识符。文本被截断时可用原生 title 查看完整值。 */
function CodeTag({ className, title, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  const fullText = title ?? (typeof children === "string" && children ? children : undefined);
  return (
    <span
      title={fullText}
      className={cn(
        "inline-flex h-[22px] max-w-full items-center truncate rounded-md border border-line-soft bg-slate-50 px-1.5 font-mono text-xs text-slate-600",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, CodeTag };
