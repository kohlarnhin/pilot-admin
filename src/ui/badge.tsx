import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";

const badgeVariants = cva(
  "inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border px-2 text-xs leading-5 transition-colors [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-line bg-slate-50/60 text-slate-600",
        secondary: "border-line-soft bg-slate-50/60 text-slate-500",
        outline: "border-line bg-white text-slate-600",
        destructive: "border-transparent bg-[#FF5630] text-white",
        info: "border-line bg-slate-50/60 text-slate-600 before:size-1.5 before:shrink-0 before:rounded-full before:bg-sky-500",
        warning: "border-line bg-slate-50/60 text-slate-600 before:size-1.5 before:shrink-0 before:rounded-full before:bg-amber-400",
        success: "border-line bg-slate-50/60 text-slate-600 before:size-1.5 before:shrink-0 before:rounded-full before:bg-emerald-500",
        error: "border-line bg-slate-50/60 text-slate-600 before:size-1.5 before:shrink-0 before:rounded-full before:bg-red-500",
      },
      shape: {
        square: "rounded-md",
        circle: "rounded-full px-2.5",
        dot: "size-2 rounded-full border-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "square",
    },
  }
);

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

export { Badge, CodeTag, badgeVariants };
