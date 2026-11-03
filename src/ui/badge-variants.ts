import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border px-2 text-xs leading-5 transition-colors [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-line bg-slate-50/60 text-slate-600",
        secondary: "border-line-soft bg-slate-50/60 text-slate-500",
        outline: "border-line bg-white text-slate-600",
        destructive: "border-transparent bg-red-600 text-white",
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

