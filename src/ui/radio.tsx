import * as React from "react";
import { cn } from "@/utils";

export interface RadioOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

interface GroupAria {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export interface RadioGroupProps<T extends string> extends GroupAria {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  options: Array<RadioOption<T>>;
  name?: string;
  disabled?: boolean;
  direction?: "horizontal" | "vertical";
  className?: string;
  id?: string;
}

/** 单选组：原生 radio 保留方向键切换与表单语义；选中为 slate-900 实心圆点。 */
export function RadioGroup<T extends string>({
  value,
  defaultValue,
  onChange,
  options,
  name,
  disabled,
  direction = "horizontal",
  className,
  id,
  ...aria
}: RadioGroupProps<T>) {
  const autoName = React.useId();
  const [inner, setInner] = React.useState<T | undefined>(defaultValue);
  const current = value !== undefined ? value : inner;
  return (
    <div
      role="radiogroup"
      id={id}
      aria-disabled={disabled || undefined}
      {...aria}
      className={cn("flex", direction === "vertical" ? "flex-col gap-3" : "flex-wrap gap-x-5 gap-y-2", className)}
    >
      {options.map((option) => {
        const off = disabled || option.disabled;
        const checked = current === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "group/radio inline-flex cursor-pointer select-none items-start gap-2 text-13 text-slate-700",
              off && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="relative mt-px inline-flex size-4 shrink-0">
              <input
                type="radio"
                name={name ?? autoName}
                value={option.value}
                checked={checked}
                disabled={off}
                onChange={() => {
                  if (value === undefined) setInner(option.value);
                  onChange?.(option.value);
                }}
                className="peer absolute inset-0 m-0 cursor-[inherit] opacity-0"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none flex size-4 items-center justify-center rounded-full border bg-white transition-colors duration-150 motion-reduce:transition-none",
                  "border-slate-300 group-hover/radio:border-slate-400 peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2",
                  checked && "border-slate-900 group-hover/radio:border-slate-900"
                )}
              >
                {checked && <span className="size-2 rounded-full bg-slate-900" />}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block leading-[18px]">{option.label}</span>
              {option.description && <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export interface SegmentedOption<T extends string = string> extends RadioOption<T> {
  icon?: React.ReactNode;
}

export interface SegmentedProps<T extends string> extends GroupAria {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  options: Array<SegmentedOption<T>>;
  size?: "small" | "default";
  block?: boolean;
  disabled?: boolean;
  className?: string;
}

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** 分段控件：单选语义 + 漫游焦点，方向键切换即生效（与原生 radio 一致），Home / End 跳到首尾。 */
export function Segmented<T extends string>({
  value,
  defaultValue,
  onChange,
  options,
  size = "default",
  block = false,
  disabled,
  className,
  ...aria
}: SegmentedProps<T>) {
  const [inner, setInner] = React.useState<T | undefined>(defaultValue ?? options.find((option) => !option.disabled)?.value);
  const current = value !== undefined ? value : inner;
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.flatMap((option, index) => (!disabled && !option.disabled ? [index] : []));
  const activeIndex = options.findIndex((option) => option.value === current);
  const tabbable = enabled.includes(activeIndex) ? activeIndex : enabled[0];

  const select = (index: number) => {
    const next = options[index].value;
    if (value === undefined) setInner(next);
    if (next !== current) onChange?.(next);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key in STEP) {
      const position = enabled.indexOf(index);
      next = enabled[(position + STEP[event.key] + enabled.length) % enabled.length];
    } else if (event.key === "Home") next = enabled[0];
    else if (event.key === "End") next = enabled[enabled.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    refs.current[next]?.focus();
    select(next);
  };

  return (
    <div
      role="radiogroup"
      aria-disabled={disabled || undefined}
      {...aria}
      className={cn("rounded-lg bg-slate-100 p-0.5", block ? "flex w-full" : "inline-flex", className)}
    >
      {options.map((option, index) => {
        const checked = option.value === current;
        return (
          <button
            key={option.value}
            ref={(node) => { refs.current[index] = node; }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled || option.disabled}
            tabIndex={index === tabbable ? 0 : -1}
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 font-medium text-slate-500 outline-none transition-[color,background-color,box-shadow] duration-150 motion-reduce:transition-none",
              "hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-slate-500",
              size === "small" ? "h-7 text-xs" : "h-8 text-13",
              block && "min-w-0 flex-1",
              checked && "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.12)] hover:text-slate-900"
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
