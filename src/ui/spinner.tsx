import * as React from "react";
import { cn } from "@/utils";

interface SpinnerProps {
  size?: number;
  className?: string;
}

/** 细线环形加载指示器，颜色跟随 currentColor。 */
export function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0 animate-spin text-slate-900", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const SPIN_SIZE = { small: 14, default: 20, large: 28 } as const;

interface SpinProps {
  size?: keyof typeof SPIN_SIZE;
  spinning?: boolean;
  tip?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * 区域加载：无 children 时仅渲染指示器；包裹内容时在内容上方叠加半透明遮罩，保留原有内容不闪烁。
 */
export function Spin({ size = "default", spinning = true, tip, className, children }: SpinProps) {
  const indicator = (
    <span className={cn("inline-flex flex-col items-center justify-center gap-2", !children && className)} role="status" aria-live="polite">
      <Spinner size={SPIN_SIZE[size]} />
      {tip && <span className="text-xs text-slate-500">{tip}</span>}
    </span>
  );

  if (!children) return spinning ? indicator : null;

  return (
    <div className={cn("relative", className)} aria-busy={spinning || undefined}>
      {children}
      {spinning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
          {indicator}
        </div>
      )}
    </div>
  );
}
