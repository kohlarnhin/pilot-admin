import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, Minus, Plus, XCircle } from "lucide-react";
import { cn } from "@/utils";
import { Spinner } from "./spinner";
import { controlBase, controlFocusWithin } from "./input";

/* ------------------------------------------------------------------------ */
/* Switch                                                                    */
/* ------------------------------------------------------------------------ */

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: "small" | "default";
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  className?: string;
  id?: string;
  title?: string;
  "aria-label"?: string;
}

/** 开关：开启为 slate-900，关闭为 #CBD5E1；small 16px 高用于表格行内。 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { checked: controlled, defaultChecked, onChange, disabled, loading, size = "default", checkedChildren, unCheckedChildren, className, ...rest },
    ref
  ) => {
    const [inner, setInner] = React.useState(Boolean(defaultChecked));
    const checked = controlled ?? inner;
    const small = size === "small";
    const hasText = Boolean(checkedChildren || unCheckedChildren);

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        onClick={(event) => {
          event.stopPropagation();
          if (controlled === undefined) setInner(!checked);
          onChange?.(!checked, event);
        }}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-slate-900" : "bg-slate-300",
          small ? "h-4 min-w-7" : "h-[22px] min-w-[42px]",
          hasText && (small ? "px-1" : "px-1.5"),
          className
        )}
        {...rest}
      >
        {hasText && (
          <span
            className={cn(
              "select-none whitespace-nowrap text-[11px] font-medium leading-none text-white",
              checked ? (small ? "mr-3.5" : "mr-[18px]") : (small ? "ml-3.5" : "ml-[18px]")
            )}
          >
            {checked ? checkedChildren : unCheckedChildren}
          </span>
        )}
        <span
          className={cn(
            "absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.2)] transition-all duration-200",
            small ? "size-3" : "size-[18px]",
            checked
              ? (small ? "left-[calc(100%-14px)]" : "left-[calc(100%-20px)]")
              : (small ? "left-0.5" : "left-0.5")
          )}
        >
          {loading && <Spinner size={small ? 8 : 12} />}
        </span>
      </button>
    );
  }
);
Switch.displayName = "Switch";

/* ------------------------------------------------------------------------ */
/* Checkbox                                                                  */
/* ------------------------------------------------------------------------ */

interface CheckboxGroupContextValue {
  value: Array<string | number>;
  toggle: (value: string | number, checked: boolean) => void;
  disabled?: boolean;
}
const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | null>(null);

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "size"> {
  indeterminate?: boolean;
  value?: string | number;
  children?: React.ReactNode;
  className?: string;
}

/** 复选框：16px、4px 圆角，选中与半选为 slate-900，标记为白色；onChange 透传原生事件（e.target.checked）。 */
const CheckboxBase = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate = false, checked, defaultChecked, onChange, disabled, value, children, className, ...rest }, ref) => {
    const group = React.useContext(CheckboxGroupContext);
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const groupChecked = group && value !== undefined ? group.value.some((item) => String(item) === String(value)) : undefined;
    const isChecked = groupChecked ?? checked;
    const isDisabled = disabled || group?.disabled;

    React.useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <label
        className={cn(
          "group/checkbox inline-flex cursor-pointer select-none items-center gap-2 text-13 text-slate-700",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="relative inline-flex size-4 shrink-0">
          <input
            ref={(node) => {
              innerRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            type="checkbox"
            className="peer absolute inset-0 m-0 cursor-[inherit] opacity-0"
            checked={isChecked}
            defaultChecked={defaultChecked}
            disabled={isDisabled}
            value={value}
            onChange={(event) => {
              if (group && value !== undefined) group.toggle(value, event.target.checked);
              onChange?.(event);
            }}
            {...rest}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none flex size-4 items-center justify-center rounded border bg-white transition-colors duration-150",
              "border-slate-300 group-hover/checkbox:border-slate-400 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400 peer-focus-visible:ring-offset-2",
              (isChecked || indeterminate) && "border-slate-900 bg-slate-900 group-hover/checkbox:border-slate-900"
            )}
          >
            {indeterminate ? (
              <span className="h-0.5 w-2 rounded-full bg-white" />
            ) : isChecked ? (
              <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none">
                <path d="M2.5 6.2 4.9 8.5 9.5 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </span>
        </span>
        {children !== undefined && children !== null && <span className="min-w-0">{children}</span>}
      </label>
    );
  }
);
CheckboxBase.displayName = "Checkbox";

export interface CheckboxGroupProps {
  value?: Array<string | number>;
  onChange?: (value: Array<string | number>) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CheckboxGroup({ value = [], onChange, disabled, className, children }: CheckboxGroupProps) {
  const context = React.useMemo<CheckboxGroupContextValue>(() => ({
    value,
    disabled,
    toggle: (item, checked) => {
      const exists = value.some((current) => String(current) === String(item));
      if (checked && !exists) onChange?.([...value, item]);
      if (!checked && exists) onChange?.(value.filter((current) => String(current) !== String(item)));
    },
  }), [disabled, onChange, value]);
  return (
    <CheckboxGroupContext.Provider value={context}>
      <div className={className}>{children}</div>
    </CheckboxGroupContext.Provider>
  );
}

export const Checkbox = Object.assign(CheckboxBase, { Group: CheckboxGroup });

/* ------------------------------------------------------------------------ */
/* InputNumber                                                               */
/* ------------------------------------------------------------------------ */

export interface InputNumberProps {
  value?: number | null;
  defaultValue?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
}

/** 数字输入：右侧细步进按钮，失焦时按 min / max / precision 规整。 */
export function InputNumber({
  value,
  defaultValue,
  onChange,
  min,
  max,
  step = 1,
  precision,
  placeholder,
  disabled,
  className,
  id,
  ...rest
}: InputNumberProps) {
  const [inner, setInner] = React.useState<number | null>(defaultValue ?? null);
  const current = value !== undefined ? value : inner;
  const [draft, setDraft] = React.useState<string>(current === null || current === undefined ? "" : String(current));

  React.useEffect(() => {
    setDraft(current === null || current === undefined ? "" : String(current));
  }, [current]);

  const normalize = (next: number | null) => {
    if (next === null || Number.isNaN(next)) return null;
    let result = next;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    if (precision !== undefined) result = Number(result.toFixed(precision));
    return result;
  };

  const emit = (next: number | null) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const stepBy = (direction: 1 | -1) => {
    const base = current ?? min ?? 0;
    emit(normalize(base + direction * step));
  };

  const invalid = rest["aria-invalid"];

  return (
    <span
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        controlFocusWithin,
        "group inline-flex h-9 items-center overflow-hidden pl-3",
        "aria-[invalid=true]:border-red-400",
        disabled && "bg-slate-50 text-slate-400",
        className
      )}
    >
      <input
        id={id}
        inputMode="decimal"
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => {
          const text = event.target.value;
          if (!/^-?\d*\.?\d*$/.test(text)) return;
          setDraft(text);
          if (text === "" ) emit(null);
          else if (!Number.isNaN(Number(text)) && text !== "-") emit(Number(text));
        }}
        onBlur={() => {
          const normalized = normalize(draft === "" ? null : Number(draft));
          setDraft(normalized === null ? "" : String(normalized));
          if (normalized !== current) emit(normalized);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            stepBy(1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            stepBy(-1);
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent font-mono text-13 tabular-nums outline-none placeholder:font-sans placeholder:text-slate-400 disabled:cursor-not-allowed"
      />
      {!disabled && (
        <span className="flex h-full shrink-0 flex-col border-l border-line opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button type="button" tabIndex={-1} aria-label="增加" onClick={() => stepBy(1)} className="flex h-1/2 w-7 cursor-pointer items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900">
            <Plus className="size-3" />
          </button>
          <button type="button" tabIndex={-1} aria-label="减少" onClick={() => stepBy(-1)} className="flex h-1/2 w-7 cursor-pointer items-center justify-center border-t border-line text-slate-400 hover:bg-slate-50 hover:text-slate-900">
            <Minus className="size-3" />
          </button>
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Alert                                                                     */
/* ------------------------------------------------------------------------ */

const ALERT_TONE = {
  info: { icon: "text-sky-400", Icon: Info },
  success: { icon: "text-emerald-500", Icon: CheckCircle2 },
  warning: { icon: "text-amber-400", Icon: AlertTriangle },
  error: { icon: "text-red-400", Icon: XCircle },
} as const;

export interface AlertProps {
  type?: keyof typeof ALERT_TONE;
  message?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  showIcon?: boolean;
  action?: React.ReactNode;
  className?: string;
  role?: string;
}

/** 提示条：浅灰底、无边框，语义只体现在小图标颜色上，文字保持柔和。 */
export function Alert({ type = "info", message, title, description, icon, showIcon = true, action, className, role }: AlertProps) {
  const tone = ALERT_TONE[type];
  const heading = title ?? message;
  return (
    <div role={role ?? (type === "error" ? "alert" : "status")} className={cn("flex gap-2 rounded-lg bg-slate-50 px-3 py-2.5", className)}>
      {showIcon && <span className={cn("mt-0.5 flex shrink-0", tone.icon)}>{icon ?? <tone.Icon className="size-4" strokeWidth={1.75} />}</span>}
      <div className="min-w-0 flex-1">
        {heading && <div className={cn("text-13 leading-5", description ? "font-medium text-slate-700" : "text-slate-600")}>{heading}</div>}
        {description && <div className={cn("text-xs leading-5 text-slate-500", heading && "mt-0.5")}>{description}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Progress                                                                  */
/* ------------------------------------------------------------------------ */

export interface ProgressProps {
  percent?: number;
  showInfo?: boolean;
  /** 纯色或 { '0%': from, '100%': to } 渐变 */
  strokeColor?: string | Record<string, string>;
  status?: "normal" | "active" | "success" | "exception";
  /** 轨道高度，默认 6px */
  size?: number | "small" | "default";
  className?: string;
}

/** 线性进度条：圆角细轨道，宽度 300ms 过渡并限制在 0-100%。 */
export function Progress({ percent = 0, showInfo = true, strokeColor, status = "normal", size = "default", className }: ProgressProps) {
  const value = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0));
  const height = typeof size === "number" ? size : size === "small" ? 4 : 6;
  const background = typeof strokeColor === "string"
    ? strokeColor
    : strokeColor
    ? `linear-gradient(90deg, ${Object.entries(strokeColor).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).map(([stop, color]) => `${color} ${stop}`).join(", ")})`
    : status === "exception"
    ? "#EF4444"
    : status === "success"
    ? "#36B37E"
    : undefined;

  return (
    <div className={cn("flex w-full items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
        style={{ height }}
      >
        <div
          className={cn("h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out", status === "active" && "progress-active")}
          style={{ width: `${value}%`, background }}
        />
      </div>
      {showInfo && (
        <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-slate-500">{Math.round(value)}%</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Tag                                                                       */
/* ------------------------------------------------------------------------ */

/**
 * 标签统一为浅色中性样式：白底细边框 + 灰色文字；
 * 语义（成功 / 警告 / 失败等）仅通过 6px 圆点表达，不使用大块底色。
 */
const TAG_DOT = {
  default: "bg-slate-400",
  brand: "bg-brand-500",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  error: "bg-red-500",
  processing: "bg-sky-500",
  indigo: "bg-indigo-500",
} as const;

export type TagColor = keyof typeof TAG_DOT;

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: TagColor;
  icon?: React.ReactNode;
  /** 前置状态圆点；非默认色在未传 icon 时自动显示 */
  dot?: boolean;
}

export function Tag({ color = "default", icon, dot, className, children, ...props }: TagProps) {
  const showDot = dot ?? (color !== "default" && !icon);
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-slate-50/60 px-2 text-xs text-slate-600",
        className
      )}
      {...props}
    >
      {showDot && <span className={cn("size-1.5 shrink-0 rounded-full", TAG_DOT[color])} />}
      {icon}
      {children}
    </span>
  );
}
