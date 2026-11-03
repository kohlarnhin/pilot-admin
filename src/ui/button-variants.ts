import { cva } from "class-variance-authority";

/**
 * 按钮规范：
 * - default / outline / secondary：细边框深色字，悬浮中性灰底与描边（新建、保存、取消、搜索等常规操作）。
 * - primary：显式强调的 slate-900 实心深色，仅用于页面唯一主操作。
 * - destructive：实心红色危险操作；danger：幽灵态危险操作（行内删除）。
 * - ghost：透明底灰色图标，悬浮中性灰底；subtle：透明底中性灰悬浮（行内编辑等中性操作）。
 */
export const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium select-none cursor-pointer transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-line bg-white text-slate-800 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-slate-800",
        outline:
          "border border-line bg-white text-slate-800 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-slate-800",
        secondary:
          "border border-line bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900",
        primary:
          "border border-transparent bg-slate-900 text-white shadow-xs hover:bg-slate-800 disabled:hover:bg-slate-900",
        destructive:
          "border border-transparent bg-red-600 text-white shadow-xs hover:bg-red-700 disabled:hover:bg-red-600",
        danger:
          "border border-transparent bg-transparent text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:hover:bg-transparent disabled:hover:text-slate-500",
        ghost:
          "border border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:hover:bg-transparent disabled:hover:text-slate-500",
        subtle:
          "border border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:hover:bg-transparent disabled:hover:text-slate-500",
        link:
          "h-auto border-0 px-0 text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline",
      },
      size: {
        default: "h-9 rounded-lg px-4 text-13",
        sm: "h-9 rounded-lg px-3 text-xs",
        xs: "h-7 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-lg px-6 text-sm",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8 rounded-lg",
        "icon-xs": "size-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
);

