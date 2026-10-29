import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/utils";
import { Spinner } from "./spinner";
import { controlBase, controlFocusWithin } from "./input";

export type SelectValue = string | number;

export interface SelectOption {
  label: React.ReactNode;
  value: SelectValue;
  disabled?: boolean;
  title?: string;
}

/** 分组选项：{ label, options: [...] } */
export interface SelectOptionGroup {
  label: React.ReactNode;
  options: SelectOption[];
}

type OptionInput = SelectOption | SelectOptionGroup;
type RenderableOption = SelectOption & { data: SelectOption };

const isGroup = (option: OptionInput): option is SelectOptionGroup =>
  Array.isArray((option as SelectOptionGroup).options);

export interface SelectProps<V = any> {
  value?: V;
  defaultValue?: V;
  onChange?: (value: V, option?: SelectOption | SelectOption[]) => void;
  options?: ReadonlyArray<OptionInput>;
  mode?: "multiple";
  placeholder?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  allowClear?: boolean;
  onClear?: () => void;
  showSearch?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
  filterOption?: boolean | ((input: string, option?: SelectOption) => boolean);
  optionFilterProp?: string;
  notFoundContent?: React.ReactNode;
  optionRender?: (option: RenderableOption) => React.ReactNode;
  labelRender?: (option: SelectOption) => React.ReactNode;
  popupRender?: (menu: React.ReactNode) => React.ReactNode;
  popupClassName?: string;
  popupMatchSelectWidth?: boolean | number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBlur?: React.FocusEventHandler;
  onFocus?: React.FocusEventHandler;
  onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  size?: "small" | "middle" | "large";
  status?: "error" | "warning";
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  children?: React.ReactNode;
}

const sameValue = (left: unknown, right: unknown) =>
  left === right || (left !== undefined && left !== null && right !== undefined && right !== null && String(left) === String(right));

const textOf = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return "";
};

/** 兼容 <Select.Option value=..>label</Select.Option> 写法 */
function Option(_props: { value: SelectValue; disabled?: boolean; children?: React.ReactNode }) {
  return null;
}

const SIZE_CLASS = {
  small: "min-h-8 text-xs",
  middle: "min-h-9",
  large: "min-h-10 text-sm",
} as const;

function SelectInner<V = any>(props: SelectProps<V>) {
  const {
    value: controlledValue,
    defaultValue,
    onChange,
    options: optionsProp,
    mode,
    placeholder,
    disabled,
    loading,
    allowClear,
    onClear,
    showSearch: showSearchProp,
    searchValue,
    onSearch,
    filterOption = true,
    optionFilterProp = "label",
    notFoundContent = "暂无匹配选项",
    optionRender,
    labelRender,
    popupRender,
    popupClassName,
    popupMatchSelectWidth = true,
    open: controlledOpen,
    onOpenChange,
    onBlur,
    onFocus,
    onInputKeyDown,
    size = "middle",
    status,
    className,
    style,
    id,
    children,
  } = props;
  const multiple = mode === "multiple";
  const showSearch = showSearchProp ?? multiple;
  const invalid = status === "error" || props["aria-invalid"] === true;

  const groupOf = React.useRef(new Map<SelectOption, React.ReactNode>());
  const options = React.useMemo<SelectOption[]>(() => {
    groupOf.current = new Map();
    if (optionsProp) {
      return optionsProp.flatMap((item) => {
        if (!isGroup(item)) return [item];
        item.options.forEach((option) => groupOf.current.set(option, item.label));
        return item.options;
      });
    }
    return React.Children.toArray(children)
      .filter(React.isValidElement)
      .map((child) => {
        const childProps = child.props as { value: SelectValue; disabled?: boolean; children?: React.ReactNode };
        return { value: childProps.value, label: childProps.children, disabled: childProps.disabled };
      });
  }, [optionsProp, children]);

  const [innerValue, setInnerValue] = React.useState<V | undefined>(defaultValue);
  const isControlled = "value" in props;
  const value = isControlled ? controlledValue : innerValue;
  const selectedValues: unknown[] = multiple
    ? (Array.isArray(value) ? value : [])
    : value === undefined || value === null || (value as unknown) === "" ? [] : [value];

  const [innerOpen, setInnerOpen] = React.useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (next: boolean) => {
    if (disabled && next) return;
    setInnerOpen(next);
    onOpenChange?.(next);
    if (!next && searchValue === undefined) setInnerSearch("");
  };

  const [innerSearch, setInnerSearch] = React.useState("");
  const search = searchValue ?? innerSearch;
  const updateSearch = (next: string) => {
    if (searchValue === undefined) setInnerSearch(next);
    onSearch?.(next);
  };

  const filtered = React.useMemo(() => {
    if (!showSearch || !search || filterOption === false) return options;
    if (typeof filterOption === "function") return options.filter((option) => filterOption(search, option));
    const keyword = search.trim().toLowerCase();
    return options.filter((option) => {
      const source = (option as unknown as Record<string, unknown>)[optionFilterProp] ?? option.label;
      return textOf(source as React.ReactNode).toLowerCase().includes(keyword)
        || String(option.value).toLowerCase().includes(keyword);
    });
  }, [filterOption, optionFilterProp, options, search, showSearch]);

  const [activeIndex, setActiveIndex] = React.useState(-1);
  React.useEffect(() => {
    if (!open) return;
    const selectedIndex = filtered.findIndex((option) => selectedValues.some((item) => sameValue(item, option.value)));
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : filtered.findIndex((option) => !option.disabled));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, search, filtered.length]);

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const findOption = (item: unknown) => options.find((option) => sameValue(option.value, item));

  const commit = (next: unknown) => {
    if (!isControlled) setInnerValue(next as V);
    if (multiple) {
      const list = (next as unknown[]).map((item) => findOption(item)).filter(Boolean) as SelectOption[];
      onChange?.(next as V, list);
    } else {
      onChange?.(next as V, findOption(next));
    }
  };

  const selectOption = (option: SelectOption) => {
    if (option.disabled) return;
    if (multiple) {
      const exists = selectedValues.some((item) => sameValue(item, option.value));
      commit(exists ? selectedValues.filter((item) => !sameValue(item, option.value)) : [...selectedValues, option.value]);
      if (search) updateSearch("");
      inputRef.current?.focus();
    } else {
      commit(option.value);
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const clear = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    commit(multiple ? [] : undefined);
    updateSearch("");
    onClear?.();
  };

  const moveActive = (step: 1 | -1) => {
    if (filtered.length === 0) return;
    let next = activeIndex;
    for (let i = 0; i < filtered.length; i += 1) {
      next = (next + step + filtered.length) % filtered.length;
      if (!filtered[next].disabled) break;
    }
    setActiveIndex(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target instanceof HTMLInputElement) onInputKeyDown?.(event as React.KeyboardEvent<HTMLInputElement>);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        else moveActive(event.key === "ArrowDown" ? 1 : -1);
        break;
      case "Enter":
        event.preventDefault();
        if (!open) setOpen(true);
        else if (filtered[activeIndex]) selectOption(filtered[activeIndex]);
        break;
      case " ":
        if (!showSearch) {
          event.preventDefault();
          setOpen(!open);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        break;
      case "Tab":
        if (open) setOpen(false);
        break;
      case "Backspace":
        if (multiple && !search && selectedValues.length > 0) {
          commit(selectedValues.slice(0, -1));
        }
        break;
    }
  };

  const hasValue = selectedValues.length > 0;
  const singleOption = !multiple && hasValue ? findOption(selectedValues[0]) : undefined;
  const singleLabel = !multiple && hasValue
    ? (singleOption ? (labelRender ? labelRender(singleOption) : singleOption.label) : String(selectedValues[0]))
    : null;
  const showClear = allowClear && hasValue && !disabled;

  const menu = (
    <div ref={listRef} role="listbox" aria-multiselectable={multiple || undefined} className="max-h-64 overflow-y-auto overscroll-contain p-1">
      {filtered.length === 0 ? (
        <div className="px-3 py-6 text-center text-xs text-slate-400">{loading ? "加载中…" : notFoundContent}</div>
      ) : (
        filtered.map((option, index) => {
          const selected = selectedValues.some((item) => sameValue(item, option.value));
          const group = groupOf.current.get(option);
          const showGroup = group !== undefined && (index === 0 || groupOf.current.get(filtered[index - 1]) !== group);
          return (
            <React.Fragment key={String(option.value)}>
            {showGroup && (
              <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium text-slate-400 first:pt-1.5">{group}</div>
            )}
            <div
              role="option"
              aria-selected={selected}
              aria-disabled={option.disabled || undefined}
              data-index={index}
              title={option.title ?? (typeof option.label === "string" ? option.label : undefined)}
              onPointerMove={() => activeIndex !== index && !option.disabled && setActiveIndex(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
              className={cn(
                "flex min-h-8 cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-13 text-slate-700",
                index === activeIndex && "bg-slate-100",
                selected && "font-medium text-slate-900",
                selected && index !== activeIndex && "bg-slate-50",
                option.disabled && "cursor-not-allowed opacity-45"
              )}
            >
              <span className="min-w-0 flex-1 truncate">{optionRender ? optionRender({ ...option, data: option }) : option.label}</span>
              {selected && <Check className="size-3.5 shrink-0 text-slate-700" strokeWidth={2.5} />}
            </div>
            </React.Fragment>
          );
        })
      )}
    </div>
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div
          ref={triggerRef}
          id={showSearch ? undefined : id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={invalid || undefined}
          aria-describedby={props["aria-describedby"]}
          aria-required={props["aria-required"] || undefined}
          aria-disabled={disabled || undefined}
          tabIndex={showSearch || disabled ? -1 : 0}
          style={style}
          onClick={() => {
            if (disabled) return;
            if (showSearch) {
              inputRef.current?.focus();
              setOpen(multiple ? true : !open);
            } else {
              setOpen(!open);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onFocus={onFocus}
          className={cn(
            controlBase,
            controlFocusWithin,
            "group relative flex w-full cursor-pointer items-center gap-1.5 py-1 pl-3 pr-2.5 text-left",
            SIZE_CLASS[size],
            open && "border-slate-400 ring-[3px] ring-slate-900/10",
            invalid && "border-red-400 focus-within:border-red-400 focus-within:ring-red-400/20",
            disabled && "cursor-not-allowed bg-slate-50 text-slate-400 hover:border-line",
            className
          )}
        >
          <div className={cn("relative flex min-w-0 flex-1 items-center", multiple && "flex-wrap gap-1")}>
            {multiple &&
              selectedValues.map((item) => {
                const option = findOption(item);
                return (
                  <span
                    key={String(item)}
                    className="inline-flex h-6 max-w-full items-center gap-1 rounded-md border border-line bg-slate-50 pl-2 pr-1 text-xs text-slate-700"
                  >
                    <span className="truncate">{option ? (labelRender ? labelRender(option) : option.label) : String(item)}</span>
                    {!disabled && (
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="移除"
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.stopPropagation();
                          commit(selectedValues.filter((current) => !sameValue(current, item)));
                        }}
                        className="flex size-4 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </span>
                );
              })}

            {!multiple && !search && (
              <span
                className={cn(
                  "pointer-events-none min-w-0 truncate",
                  showSearch && "absolute inset-x-0 top-1/2 -translate-y-1/2",
                  !hasValue && "text-slate-400",
                  hasValue && open && showSearch && "text-slate-400"
                )}
              >
                {hasValue ? singleLabel : placeholder}
              </span>
            )}
            {multiple && !hasValue && !search && (
              <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 truncate text-slate-400">{placeholder}</span>
            )}

            {showSearch && (
              <input
                ref={inputRef}
                id={id}
                value={search}
                disabled={disabled}
                autoComplete="off"
                aria-autocomplete="list"
                onChange={(event) => {
                  updateSearch(event.target.value);
                  if (!open) setOpen(true);
                }}
                onKeyDown={handleKeyDown}
                className={cn(
                  "relative h-6 min-w-[4px] bg-transparent text-inherit outline-none disabled:cursor-not-allowed",
                  multiple ? "w-auto flex-1 basis-8" : "w-full"
                )}
              />
            )}
          </div>

          <span className="relative flex size-4 shrink-0 items-center justify-center text-slate-400">
            {loading ? (
              <Spinner size={14} className="text-slate-400" />
            ) : (
              <>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    open && "rotate-180",
                    showClear && "group-hover:opacity-0"
                  )}
                />
                {showClear && (
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label="清空"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={clear}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-slate-300/80 text-white opacity-0 transition-opacity hover:bg-slate-400 group-hover:opacity-100"
                  >
                    <X className="size-2.5" strokeWidth={3} />
                  </button>
                )}
              </>
            )}
          </span>
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (triggerRef.current?.contains(event.target as Node)) event.preventDefault();
          }}
          className={cn(
            "z-[1060] animate-pop-in overflow-hidden rounded-lg border border-line bg-white shadow-pop outline-none",
            popupClassName
          )}
          style={{
            width:
              popupMatchSelectWidth === true
                ? "var(--radix-popover-trigger-width)"
                : typeof popupMatchSelectWidth === "number"
                ? popupMatchSelectWidth
                : undefined,
            minWidth: popupMatchSelectWidth === false ? "var(--radix-popover-trigger-width)" : undefined,
          }}
        >
          {popupRender ? popupRender(menu) : menu}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

type SelectComponent = (<V = any>(props: SelectProps<V>) => React.ReactElement) & { Option: typeof Option };

const Select = SelectInner as SelectComponent;
Select.Option = Option;

export { Select };
