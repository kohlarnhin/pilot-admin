import dayjs, { type Dayjs } from "dayjs";

export const DATE_FORMAT = "YYYY-MM-DD";

/** 只接受严格的 YYYY-MM-DD，避免 dayjs 宽松解析把非法日期滚到下个月。 */
export function parseDateValue(value?: string | null): Dayjs | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format(DATE_FORMAT) === value ? parsed.startOf("day") : null;
}

/** 生成 6×7 的日历网格；中文以周一开头，英文以周日开头。 */
export function buildMonthGrid(month: Dayjs, weekStart: 0 | 1): Dayjs[] {
  const first = month.startOf("month");
  const start = first.subtract((first.day() - weekStart + 7) % 7, "day");
  return Array.from({ length: 42 }, (_, index) => start.add(index, "day"));
}
