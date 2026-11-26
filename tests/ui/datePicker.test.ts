import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { buildMonthGrid, DATE_FORMAT, parseDateValue } from '@/ui/date-utils';

describe('parseDateValue', () => {
  it('accepts strict YYYY-MM-DD only', () => {
    expect(parseDateValue('2026-11-26')?.format(DATE_FORMAT)).toBe('2026-11-26');
    expect(parseDateValue('2026-02-30')).toBeNull();
    expect(parseDateValue('2026-1-5')).toBeNull();
    expect(parseDateValue('')).toBeNull();
    expect(parseDateValue(null)).toBeNull();
  });
});

describe('buildMonthGrid', () => {
  it('starts on Monday for weekStart 1 and covers six weeks', () => {
    const grid = buildMonthGrid(dayjs('2026-11-01'), 1);
    expect(grid).toHaveLength(42);
    expect(grid[0].format(DATE_FORMAT)).toBe('2026-10-26');
    expect(grid[0].day()).toBe(1);
    expect(grid.some((day) => day.format(DATE_FORMAT) === '2026-11-30')).toBe(true);
  });

  it('starts on Sunday for weekStart 0', () => {
    const grid = buildMonthGrid(dayjs('2026-11-15'), 0);
    expect(grid[0].format(DATE_FORMAT)).toBe('2026-11-01');
    expect(grid[0].day()).toBe(0);
  });
});
