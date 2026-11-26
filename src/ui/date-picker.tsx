import { getLocale, t, useT } from '@/i18n';
import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/utils";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover";
import { controlBase, controlFocus } from "./input";
import { buildMonthGrid, DATE_FORMAT, parseDateValue } from "./date-utils";


export interface DatePickerProps {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  /** 可选的最早日期（含），YYYY-MM-DD。 */
  min?: string;
  /** 可选的最晚日期（含），YYYY-MM-DD。 */
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  allowClear?: boolean;
  status?: "error";
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/** 日期选择：触发器为按钮，浮层内日历支持方向键、Home / End、PageUp / PageDown（Shift 跨年）与 Esc。 */
export function DatePicker({
  value,
  defaultValue = null,
  onChange,
  min,
  max,
  disabled,
  placeholder,
  allowClear = true,
  status,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  useT();
  const locale = getLocale();
  const weekStart = locale === "zh-CN" ? 1 : 0;
  const titleId = React.useId();
  const [inner, setInner] = React.useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const selected = parseDateValue(current);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);
  const today = dayjs().startOf("day");
  const [open, setOpen] = React.useState(false);
  const [focusDate, setFocusDate] = React.useState<Dayjs>(() => selected ?? today);
  const gridRef = React.useRef<HTMLTableElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const shouldFocus = React.useRef(false);

  const outOfRange = (date: Dayjs) => Boolean((minDate && date.isBefore(minDate, "day")) || (maxDate && date.isAfter(maxDate, "day")));
  const clamp = (date: Dayjs) => (minDate && date.isBefore(minDate, "day") ? minDate : maxDate && date.isAfter(maxDate, "day") ? maxDate : date);
  const commit = (next: string | null) => {
    if (value === undefined) setInner(next);
    if (next !== current) onChange?.(next);
  };
  const moveFocus = (date: Dayjs) => {
    shouldFocus.current = true;
    setFocusDate(clamp(date));
  };

  React.useEffect(() => {
    if (!open || !shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate.format(DATE_FORMAT)}"]`)?.focus();
  }, [focusDate, open]);

  const onOpenChange = (next: boolean) => {
    if (next) moveFocus(selected ?? today);
    setOpen(next);
  };
  const pick = (date: Dayjs) => {
    if (outOfRange(date)) return;
    commit(date.format(DATE_FORMAT));
    setOpen(false);
  };

  const onDayKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, date: Dayjs) => {
    const unit = event.shiftKey ? "year" : "month";
    const offset = (date.day() - weekStart + 7) % 7;
    const next = {
      ArrowLeft: date.subtract(1, "day"),
      ArrowRight: date.add(1, "day"),
      ArrowUp: date.subtract(1, "week"),
      ArrowDown: date.add(1, "week"),
      Home: date.subtract(offset, "day"),
      End: date.add(6 - offset, "day"),
      PageUp: date.subtract(1, unit),
      PageDown: date.add(1, unit),
    }[event.key];
    if (!next) return;
    event.preventDefault();
    moveFocus(next);
  };

  const month = focusDate.startOf("month");
  const days = buildMonthGrid(month, weekStart);
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: locale === "zh-CN" ? "narrow" : "short" });
  const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const monthTitle = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(month.toDate());
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
  const prevDisabled = Boolean(minDate && !month.isAfter(minDate, "month"));
  const nextDisabled = Boolean(maxDate && !month.isBefore(maxDate, "month"));
  const invalid = status === "error" || ariaInvalid;
  const showClear = allowClear && Boolean(selected) && !disabled;
  const label = [ariaLabel, selected ? fullDate.format(selected.toDate()) : placeholder ?? t("ui.datePlaceholder")].filter(Boolean).join(", ");

  return (
    <PopoverRoot open={open} onOpenChange={onOpenChange}>
      <div className={cn("relative w-full", className)}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            id={id}
            type="button"
            disabled={disabled}
            aria-label={label}
            aria-describedby={ariaDescribedBy}
            aria-invalid={invalid || undefined}
            className={cn(controlBase, controlFocus, "flex h-9 items-center px-3 pr-9 text-left tabular-nums", invalid && "border-red-400", !selected && "text-slate-500")}
          >
            <span className="truncate">{selected ? selected.format(DATE_FORMAT) : placeholder ?? t("ui.datePlaceholder")}</span>
          </button>
        </PopoverTrigger>
        {showClear ? (
          <button
            type="button"
            aria-label={t("common.actions.clear")}
            onClick={() => { commit(null); triggerRef.current?.focus(); }}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-focus"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : (
          <CalendarDays aria-hidden="true" size={16} className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400", disabled && "opacity-60")} />
        )}
      </div>
      <PopoverContent
        align="start"
        role="dialog"
        aria-label={t("ui.chooseDate")}
        className="w-[260px] p-3"
        onOpenAutoFocus={(event) => {
          // 打开时把焦点交给日历里当前可聚焦的日期，而不是浮层的第一个按钮。
          event.preventDefault();
          shouldFocus.current = false;
          gridRef.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus();
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label={t("ui.prevMonth")} disabled={prevDisabled} onClick={() => setFocusDate(clamp(focusDate.subtract(1, "month")))}
            className="flex size-7 items-center justify-center rounded-md text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span id={titleId} aria-live="polite" className="text-13 font-medium text-slate-900">{monthTitle}</span>
          <button type="button" aria-label={t("ui.nextMonth")} disabled={nextDisabled} onClick={() => setFocusDate(clamp(focusDate.add(1, "month")))}
            className="flex size-7 items-center justify-center rounded-md text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <table ref={gridRef} role="grid" aria-labelledby={titleId} className="w-full border-collapse">
          <thead>
            <tr>
              {days.slice(0, 7).map((day) => (
                <th key={day.day()} scope="col" abbr={weekdayLong.format(day.toDate())} className="h-7 text-center text-xs font-normal text-slate-500">
                  {weekdayFormat.format(day.toDate())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, row) => (
              <tr key={row}>
                {days.slice(row * 7, row * 7 + 7).map((day) => {
                  const key = day.format(DATE_FORMAT);
                  const isSelected = Boolean(selected?.isSame(day, "day"));
                  const isToday = day.isSame(today, "day");
                  const outside = !day.isSame(month, "month");
                  const blocked = outOfRange(day);
                  return (
                    <td key={key} role="gridcell" aria-selected={isSelected} className="p-0 text-center">
                      <button
                        type="button"
                        data-date={key}
                        tabIndex={day.isSame(focusDate, "day") ? 0 : -1}
                        disabled={blocked}
                        aria-label={fullDate.format(day.toDate())}
                        aria-current={isToday ? "date" : undefined}
                        onClick={() => pick(day)}
                        onKeyDown={(event) => onDayKeyDown(event, day)}
                        className={cn(
                          "relative mx-auto flex size-8 items-center justify-center rounded-md text-13 tabular-nums outline-none transition-colors duration-100 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-focus",
                          outside ? "text-slate-400" : "text-slate-700",
                          !isSelected && !blocked && "hover:bg-slate-100",
                          isToday && !isSelected && "font-semibold text-brand-700 after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-brand-500",
                          isSelected && "bg-slate-900 font-medium text-white",
                          blocked && "cursor-not-allowed text-slate-300 line-through"
                        )}
                      >
                        {day.date()}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex justify-end border-t border-line pt-2">
          <button type="button" disabled={outOfRange(today)} onClick={() => pick(today)}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40">
            {t("ui.today")}
          </button>
        </div>
      </PopoverContent>
    </PopoverRoot>
  );
}
