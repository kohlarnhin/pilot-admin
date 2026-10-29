import { t, useT } from '@/i18n';
import * as React from "react";
import { Eye, EyeOff, Search, X } from "lucide-react";
import { cn } from "@/utils";

/**
 * 输入框规范：36px 高、8px 圆角、13px 字号、#E2E8F0 细边框；
 * 悬浮边框略加深，聚焦 slate-400 描边 + 3px 中性光晕；校验失败（aria-invalid）红色描边。
 */
export const controlBase =
  "w-full rounded-lg border border-line bg-white text-13 text-slate-800 shadow-2xs outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:hover:border-line";
export const controlFocus =
  "focus:border-slate-400 focus:ring-[3px] focus:ring-slate-900/10";
export const controlFocusWithin =
  "focus-within:border-slate-400 focus-within:ring-[3px] focus-within:ring-slate-900/10";
export const controlInvalid =
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-400/20";

const SIZE_CLASS = {
  small: "h-8 text-xs",
  middle: "h-9",
  large: "h-10 text-sm",
} as const;

type ControlSize = keyof typeof SIZE_CLASS;

/** 用原生 setter 触发 React onChange，保证"清空"等程序化修改与键盘输入走同一条事件链路。 */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.MutableRefObject<T>).current = value;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  size?: ControlSize;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
  /** 外层容器样式（存在前后缀时生效） */
  wrapperClassName?: string;
  status?: "error" | "warning";
  variant?: "outlined" | "borderless";
  /** 在右侧显示已输入字数（配合 maxLength） */
  showCount?: boolean;
}

const InputBase = React.forwardRef<HTMLInputElement, InputProps>(
  (allProps, ref) => {
    useT();
    const {
      className,
      wrapperClassName,
      size = "middle",
      prefix,
      suffix,
      allowClear,
      onPressEnter,
      onKeyDown,
      status,
      variant = "outlined",
      showCount,
      type = "text",
      disabled,
      value: rawValue,
      ...props
    } = allProps;
    // 只要调用方传了 value 键即视为受控（Form 注入的 undefined 也按空串处理），避免受控/非受控切换告警
    const value = "value" in allProps ? (rawValue ?? "") : undefined;
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      assignRef(ref, node);
    };
    const invalid = status === "error" || props["aria-invalid"] === true || props["aria-invalid"] === "true";
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.key === "Enter" && !event.nativeEvent.isComposing) onPressEnter?.(event);
    };
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const showClear = allowClear && !disabled && hasValue;
    const borderless = variant === "borderless";

    if (!prefix && !suffix && !allowClear && !showCount) {
      return (
        <input
          ref={setRefs}
          type={type}
          disabled={disabled}
          value={value}
          aria-invalid={invalid || undefined}
          className={cn(
            controlBase,
            controlFocus,
            controlInvalid,
            SIZE_CLASS[size],
            "px-3",
            borderless && "border-transparent shadow-none hover:border-transparent focus:ring-0",
            className
          )}
          onKeyDown={handleKeyDown}
          {...props}
        />
      );
    }

    return (
      <span
        data-slot="input-wrapper"
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          controlBase,
          controlFocusWithin,
          "inline-flex items-center gap-2 px-3",
          "aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus-within:border-red-400 aria-[invalid=true]:focus-within:ring-red-400/20",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-400 hover:border-line",
          SIZE_CLASS[size],
          borderless && "border-transparent shadow-none hover:border-transparent focus-within:ring-0",
          className,
          wrapperClassName
        )}
        onMouseDown={(event) => {
          if (event.target !== innerRef.current) {
            event.preventDefault();
            innerRef.current?.focus();
          }
        }}
      >
        {prefix && <span className="flex shrink-0 items-center text-slate-400">{prefix}</span>}
        <input
          ref={setRefs}
          type={type}
          disabled={disabled}
          value={value}
          aria-invalid={invalid || undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-inherit outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          onKeyDown={handleKeyDown}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={t('ui.clear')}
            className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-300/80 text-white transition-colors hover:bg-slate-400"
            onClick={() => {
              if (innerRef.current) {
                setNativeValue(innerRef.current, "");
                innerRef.current.focus();
              }
            }}
          >
            <X className="size-2.5" strokeWidth={3} />
          </button>
        )}
        {showCount && (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
            {String(value ?? "").length}
            {props.maxLength ? ` / ${props.maxLength}` : ""}
          </span>
        )}
        {suffix && <span className="flex shrink-0 items-center text-slate-400">{suffix}</span>}
      </span>
    );
  }
);
InputBase.displayName = "Input";

const Password = React.forwardRef<HTMLInputElement, Omit<InputProps, "type" | "suffix">>((props, ref) => {
  useT();
  const [visible, setVisible] = React.useState(false);
  return (
    <InputBase
      ref={ref}
      {...props}
      type={visible ? "text" : "password"}
      suffix={
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? t('ui.hidePassword') : t('ui.showPassword')}
          className="flex cursor-pointer items-center text-slate-400 transition-colors hover:text-slate-600"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-[15px]" /> : <Eye className="size-[15px]" />}
        </button>
      }
    />
  );
});
Password.displayName = "Input.Password";

/** 列表工具栏搜索框：固定放大镜前缀与清空按钮。 */
const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "prefix">>(
  ({ allowClear = true, className, ...props }, ref) => (
    <InputBase
      ref={ref}
      allowClear={allowClear}
      prefix={<Search className="size-[15px]" strokeWidth={2} />}
      className={cn("w-56", className)}
      {...props}
    />
  )
);
SearchInput.displayName = "SearchInput";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  showCount?: boolean;
  status?: "error" | "warning";
  size?: ControlSize;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (allProps, ref) => {
    const { className, autoSize, showCount, status, size: _size, rows = 3, value: rawValue, maxLength, onChange, style, ...props } = allProps;
    const value = "value" in allProps ? (rawValue ?? "") : undefined;
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const setRefs = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      assignRef(ref, node);
    };
    const invalid = status === "error" || props["aria-invalid"] === true || props["aria-invalid"] === "true";

    const resize = React.useCallback(() => {
      const element = innerRef.current;
      if (!element || !autoSize) return;
      const { minRows, maxRows } = typeof autoSize === "object" ? autoSize : { minRows: undefined, maxRows: undefined };
      const computed = window.getComputedStyle(element);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      const chrome =
        parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom) +
        parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
      element.style.height = "auto";
      let next = element.scrollHeight + parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
      if (minRows) next = Math.max(next, minRows * lineHeight + chrome);
      if (maxRows) next = Math.min(next, maxRows * lineHeight + chrome);
      element.style.height = `${next}px`;
      element.style.overflowY = maxRows && element.scrollHeight + chrome > maxRows * lineHeight + chrome ? "auto" : "hidden";
    }, [autoSize]);

    React.useLayoutEffect(() => {
      resize();
    }, [resize, value]);

    const length = typeof value === "string" ? value.length : 0;

    const textarea = (
      <textarea
        ref={setRefs}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={invalid || undefined}
        onChange={(event) => {
          onChange?.(event);
          resize();
        }}
        style={style}
        className={cn(
          controlBase,
          controlFocus,
          controlInvalid,
          "block min-h-[36px] resize-y px-3 py-2 leading-5",
          autoSize && "resize-none",
          className
        )}
        {...props}
      />
    );

    if (!showCount) return textarea;
    return (
      <div className="relative">
        {textarea}
        <span className="pointer-events-none mt-1 block text-right font-mono text-[11px] text-slate-400">
          {length}
          {maxLength ? ` / ${maxLength}` : ""}
        </span>
      </div>
    );
  }
);
TextArea.displayName = "Input.TextArea";

type InputComponent = typeof InputBase & {
  Password: typeof Password;
  TextArea: typeof TextArea;
  Search: typeof SearchInput;
};

const Input = InputBase as InputComponent;
Input.Password = Password;
Input.TextArea = TextArea;
Input.Search = SearchInput;

export { Input, TextArea, Password, SearchInput };
