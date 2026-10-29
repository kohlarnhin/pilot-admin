import { t, useT } from '@/i18n';
import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { useInfiniteScrollLoader } from "@/hooks/useInfiniteScrollLoader";
import { Checkbox } from "./controls";
import { Skeleton } from "./skeleton";

export type Key = string | number;

export interface ColumnType<T> {
  title?: React.ReactNode;
  dataIndex?: keyof T | string;
  key?: string;
  /** 数字为像素；百分比按比例分配剩余宽度；缺省为弹性列 */
  width?: number | string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right" | boolean;
  ellipsis?: boolean;
  hidden?: boolean;
  className?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export type ColumnsType<T> = ColumnType<T>[];

export interface RowSelection<T> {
  selectedRowKeys: Key[];
  onChange: (keys: Key[], rows: T[]) => void;
  columnWidth?: number;
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

export interface Expandable<T> {
  expandedRowKeys?: Key[];
  onExpandedRowsChange?: (keys: Key[]) => void;
  rowExpandable?: (record: T) => boolean;
  childrenColumnName?: string;
  showExpandColumn?: boolean;
  indentSize?: number;
}

export interface DataTableProps<T> {
  columns: ColumnsType<T>;
  dataSource?: T[];
  rowKey: keyof T | ((record: T) => Key);
  loading?: boolean;
  /** 刷新中：保留现有内容，仅在表头下方显示细进度条 */
  refreshing?: boolean;
  loadingMore?: boolean;
  hasNext?: boolean;
  onLoadMore?: () => void | Promise<void>;
  showHeader?: boolean;
  size?: "small" | "middle";
  rowSelection?: RowSelection<T>;
  expandable?: Expandable<T>;
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLDivElement>;
  rowClassName?: string | ((record: T, index: number) => string);
  locale?: { emptyText?: React.ReactNode | (() => React.ReactNode) };
  scroll?: { x?: number | string; y?: number | string };
  /** 撑满父容器高度（卡片内列表） */
  fill?: boolean;
  /** 强制开启 / 关闭行窗口化；默认在无限加载列表中开启 */
  virtual?: boolean;
  estimatedRowHeight?: number;
  skeletonRows?: number;
  className?: string;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  /** 兼容旧调用，以下属性不再生效 */
  pagination?: false;
  sticky?: boolean;
  tableLayout?: "fixed" | "auto";
}

interface FlatRow<T> {
  record: T;
  key: Key;
  index: number;
  depth: number;
}

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const FIXED_JUSTIFY = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

const parsePercent = (width: unknown) => {
  if (typeof width !== "string") return null;
  const match = width.trim().match(/^(\d+(?:\.\d+)?)%$/);
  return match ? Number(match[1]) : null;
};

const parsePixels = (width: unknown) => {
  if (typeof width === "number" && Number.isFinite(width)) return width;
  if (typeof width !== "string") return null;
  const match = width.trim().match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : null;
};

function buildTemplate<T>(columns: ColumnsType<T>, selectionWidth?: number) {
  const percents = columns.map((column) => parsePercent(column.width)).filter((value): value is number => value !== null);
  // 未设宽度的弹性列与百分比列按同一量级分配，避免某一列吞掉全部剩余宽度
  const autoWeight = percents.length > 0 ? percents.reduce((a, b) => a + b, 0) / percents.length : 10;
  let minimum = selectionWidth ?? 0;

  const tracks = columns.map((column) => {
    const pixels = parsePixels(column.width);
    if (pixels !== null) {
      minimum += pixels;
      return `${pixels}px`;
    }
    const percent = parsePercent(column.width);
    const min = column.minWidth ?? 120;
    minimum += min;
    return `minmax(${min}px, ${percent ?? autoWeight}fr)`;
  });
  if (selectionWidth) tracks.unshift(`${selectionWidth}px`);
  return { template: tracks.join(" "), minimum };
}

/** 首次加载骨架：表头 + 若干数据行，尺寸与真实表格一致，避免替换时跳动。 */
export function TableSkeleton({ rows = 7, showHeader = true }: { rows?: number; showHeader?: boolean }) {
  useT();
  const widths = ["24%", "16%", "14%", "12%", "10%"];
  return (
    <div className="w-full" aria-busy="true" aria-label={t('ui.loading')}>
      {showHeader && (
        <div className="flex h-11 items-center gap-8 border-b border-line bg-white px-6">
          {widths.map((width, index) => (
            <Skeleton key={index} className="h-3" style={{ width: `calc(${width} * 0.55)` }} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex h-[56px] items-center gap-8 border-b border-line-row px-6">
          <div className="flex items-center gap-3" style={{ width: widths[0] }}>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2 opacity-70" />
            </div>
          </div>
          {widths.slice(1).map((width, index) => (
            <Skeleton key={index} className={cn("h-3", row % 2 === 1 && "opacity-70")} style={{ width: `calc(${width} * 0.6)` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 数据表格（Tailwind 实现，替代 antd Table）：
 * - 表头吸顶、正文独立滚动、横向溢出仅在表格内部滚动；
 * - 首列 / 末列 24px 内边距与卡片标题对齐，数据行细分隔线，悬浮浅灰；
 * - 无限加载列表自动开启动态行高窗口化，仅挂载视口附近的行，预取下一页时不插入占位。
 */
export function DataTable<T extends object>({
  columns: rawColumns,
  dataSource = [],
  rowKey,
  loading = false,
  refreshing = false,
  loadingMore = false,
  hasNext = false,
  onLoadMore,
  showHeader = true,
  size = "middle",
  rowSelection,
  expandable,
  onRow,
  rowClassName,
  locale,
  scroll,
  fill = false,
  virtual,
  estimatedRowHeight = 57,
  skeletonRows = 7,
  className,
  onScroll,
}: DataTableProps<T>) {
  useT();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const emptyStateRef = React.useRef<HTMLDivElement>(null);
  const wasRefreshing = React.useRef(false);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const [emptyAnimationFinished, setEmptyAnimationFinished] = React.useState(false);
  const [skeletonReady, setSkeletonReady] = React.useState(false);
  // 固定列的分隔线只在表格真的横向溢出时出现，避免不滚动时多出一条线。
  const [scrollableX, setScrollableX] = React.useState(false);

  const columns = React.useMemo(() => rawColumns.filter((column) => !column.hidden), [rawColumns]);
  const getKey = React.useCallback(
    (record: T): Key => (typeof rowKey === "function" ? rowKey(record) : (record[rowKey] as unknown as Key)),
    [rowKey]
  );

  const rows = React.useMemo<FlatRow<T>[]>(() => {
    const childrenName = expandable?.childrenColumnName ?? "children";
    const expanded = new Set((expandable?.expandedRowKeys ?? []).map(String));
    const result: FlatRow<T>[] = [];
    const walk = (records: T[], depth: number) => {
      records.forEach((record) => {
        const key = getKey(record);
        result.push({ record, key, index: result.length, depth });
        const children = (record as Record<string, unknown>)[childrenName] as T[] | undefined;
        if (expandable && Array.isArray(children) && children.length > 0 && expanded.has(String(key))) {
          walk(children, depth + 1);
        }
      });
    };
    walk(dataSource, 0);
    return result;
  }, [dataSource, expandable, getKey]);

  const selectionWidth = rowSelection ? rowSelection.columnWidth ?? 48 : undefined;
  const { template, minimum } = React.useMemo(() => buildTemplate(columns, selectionWidth), [columns, selectionWidth]);
  const minWidth = Math.max(minimum, typeof scroll?.x === "number" ? scroll.x : 0);

  React.useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const update = () => setScrollableX(scroller.scrollWidth > scroller.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [template, minWidth, rows.length, showHeader, fill, scroll?.y]);

  const hasRecords = rows.length > 0;
  const initialLoading = loading && !hasRecords;
  const showSkeleton = initialLoading && skeletonReady;
  const showEmptyState = fill && !initialLoading && !hasRecords;
  const shouldVirtualize = (virtual ?? Boolean(onLoadMore)) && hasRecords;

  React.useEffect(() => {
    setSkeletonReady(false);
    if (!initialLoading) return;
    const timer = window.setTimeout(() => setSkeletonReady(true), 200);
    return () => window.clearTimeout(timer);
  }, [initialLoading]);

  React.useLayoutEffect(() => {
    if (!showEmptyState) {
      setEmptyAnimationFinished(false);
    } else if (refreshing || wasRefreshing.current || emptyStateRef.current?.getClientRects().length === 0) {
      // 刷新或后台挂载的空状态不补播动画，直接保留稳定的数据区。
      setEmptyAnimationFinished(true);
    }
    wasRefreshing.current = refreshing;
  });

  React.useLayoutEffect(() => {
    const height = headerRef.current?.offsetHeight ?? 0;
    if (!showHeader || height > 0) setHeaderHeight(height);
  });

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10,
    scrollMargin: headerHeight,
    getItemKey: (index) => rows[index]?.key ?? index,
  });

  useInfiniteScrollLoader({
    containerRef: scrollRef,
    sentinelRef,
    itemCount: dataSource.length,
    hasNext: Boolean(onLoadMore) && hasNext,
    initialLoading: loading,
    loadingMore,
    onLoadMore,
  });

  /* ---------------------------- 选择 ---------------------------- */
  const selectedSet = React.useMemo(() => new Set((rowSelection?.selectedRowKeys ?? []).map(String)), [rowSelection?.selectedRowKeys]);
  const selectableRows = React.useMemo(
    () => (rowSelection ? rows.filter((row) => !rowSelection.getCheckboxProps?.(row.record)?.disabled) : []),
    [rowSelection, rows]
  );
  const selectedCount = selectableRows.filter((row) => selectedSet.has(String(row.key))).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;

  const emitSelection = (keys: Key[]) => {
    if (!rowSelection) return;
    const keySet = new Set(keys.map(String));
    rowSelection.onChange(keys, rows.filter((row) => keySet.has(String(row.key))).map((row) => row.record));
  };

  const toggleAll = (checked: boolean) => {
    if (!rowSelection) return;
    const selectableKeys = new Set(selectableRows.map((row) => String(row.key)));
    const kept = rowSelection.selectedRowKeys.filter((key) => !selectableKeys.has(String(key)));
    emitSelection(checked ? [...kept, ...selectableRows.map((row) => row.key)] : kept);
  };

  const toggleRow = (key: Key, checked: boolean) => {
    if (!rowSelection) return;
    const current = rowSelection.selectedRowKeys;
    emitSelection(checked ? [...current, key] : current.filter((item) => String(item) !== String(key)));
  };

  /* ---------------------------- 渲染 ---------------------------- */
  const cellPadding = size === "small" ? "px-4 py-2" : "px-4 py-3";
  const edgePadding = "first:pl-6 last:pr-6";

  const fixedClass = (column: ColumnType<T>) => {
    if (!column.fixed) return "";
    const isRight = column.fixed === "right";
    return cn(
      "sticky z-[1] flex self-stretch items-center bg-inherit",
      isRight ? "right-0" : "left-0",
      scrollableX && (isRight ? "shadow-[-1px_0_0_0_#EDF1F5]" : "shadow-[1px_0_0_0_#EDF1F5]")
    );
  };

  const renderRow = (row: FlatRow<T>, style?: React.CSSProperties, measureRef?: (node: HTMLElement | null) => void, dataIndex?: number) => {
    const rowProps = onRow?.(row.record, row.index) ?? {};
    const { className: rowPropsClass, style: rowStyle, ...restRowProps } = rowProps;
    const extraClass = typeof rowClassName === "function" ? rowClassName(row.record, row.index) : rowClassName;
    const selected = selectedSet.has(String(row.key));
    const checkboxProps = rowSelection?.getCheckboxProps?.(row.record);

    return (
      <div
        key={row.key}
        ref={measureRef}
        data-index={dataIndex}
        data-row-key={row.key}
        role="row"
        aria-selected={rowSelection ? selected : undefined}
        className={cn(
          "grid items-center border-b border-line-row bg-white transition-colors duration-100 hover:bg-slate-50/60",
          rowPropsClass,
          extraClass
        )}
        style={{ gridTemplateColumns: template, ...style, ...rowStyle }}
        {...restRowProps}
      >
        {rowSelection && (
          <div role="cell" data-cell className="flex items-center justify-center py-3" onClick={(event) => event.stopPropagation()}>
            <Checkbox
              checked={selected}
              disabled={checkboxProps?.disabled}
              onChange={(event) => toggleRow(row.key, event.target.checked)}
              aria-label={t('ui.selectRow')}
            />
          </div>
        )}
        {columns.map((column, columnIndex) => {
          const value = column.dataIndex !== undefined ? (row.record as Record<string, unknown>)[column.dataIndex as string] : undefined;
          const content = column.render ? column.render(value, row.record, row.index) : (value as React.ReactNode) ?? null;
          const align = column.align ?? "left";
          return (
            <div
              key={column.key ?? String(column.dataIndex ?? columnIndex)}
              role="cell"
              data-cell
              className={cn(
                "min-w-0 text-13 text-slate-800",
                cellPadding,
                edgePadding,
                rowSelection && columnIndex === 0 && "!pl-1",
                ALIGN_CLASS[align],
                column.fixed && cn(fixedClass(column), FIXED_JUSTIFY[align]),
                column.ellipsis && "truncate",
                column.className
              )}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  const header = showHeader && (
    <div
      ref={headerRef}
      role="row"
      className="sticky top-0 z-[2] grid shrink-0 border-b border-line bg-white"
      style={{ gridTemplateColumns: template }}
    >
      {rowSelection && (
        <div role="columnheader" className="flex items-center justify-center py-3">
          <Checkbox
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            disabled={selectableRows.length === 0}
            onChange={(event) => toggleAll(event.target.checked)}
            aria-label={t('ui.selectAll')}
          />
        </div>
      )}
      {columns.map((column, columnIndex) => {
        const align = column.align ?? "left";
        return (
          <div
            key={column.key ?? String(column.dataIndex ?? columnIndex)}
            role="columnheader"
            className={cn(
              "min-w-0 truncate whitespace-nowrap px-4 py-3 text-xs font-medium leading-5 text-slate-500",
              edgePadding,
              rowSelection && columnIndex === 0 && "!pl-1",
              ALIGN_CLASS[align],
              column.fixed && cn(fixedClass(column), "bg-white", FIXED_JUSTIFY[align])
            )}
          >
            {column.title}
          </div>
        );
      })}
    </div>
  );

  const emptyContent = typeof locale?.emptyText === "function"
    ? locale.emptyText()
    : locale?.emptyText ?? <EmptyState />;

  const virtualItems = shouldVirtualize ? virtualizer.getVirtualItems() : [];

  const scrollStyle: React.CSSProperties = {};
  if (fill || scroll?.y !== undefined) scrollStyle.scrollbarGutter = "stable";
  if (!fill && scroll?.y !== undefined) {
    scrollStyle.maxHeight = typeof scroll.y === "number" ? scroll.y + headerHeight : scroll.y;
  }

  return (
    <div
      ref={scrollRef}
      role="table"
      aria-rowcount={rows.length + (showHeader ? 1 : 0)}
      data-record-count={dataSource.length}
      onScroll={onScroll}
      data-x-scrollable={scrollableX}
      className={cn(
        "relative w-full overscroll-contain",
        fill ? "h-full min-h-0" : "",
        fill || scroll?.y !== undefined ? "overflow-auto" : "overflow-x-auto",
        className
      )}
      style={scrollStyle}
    >
      <div ref={contentRef} style={{ minWidth }} className={cn("relative", fill && "flex min-h-full flex-col")}>
        {header}
        {refreshing && showHeader && (
          <div className="pointer-events-none sticky z-[3] h-0 w-full" style={{ top: headerHeight }}>
            <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
              <div className="table-refresh-bar h-full w-1/3 rounded-full bg-brand-500" />
            </div>
          </div>
        )}
        {initialLoading ? (
          <div role="rowgroup" aria-busy="true" aria-label={t('ui.loading')} className={fill ? "flex-1" : undefined}>
            {showSkeleton && Array.from({ length: skeletonRows }).map((_, index) => (
              <div
                key={index}
                role="row"
                className="grid items-center border-b border-line-row bg-white"
                style={{ gridTemplateColumns: template, minHeight: estimatedRowHeight }}
              >
                {rowSelection && (
                  <div role="cell" data-cell className="flex items-center justify-center py-3">
                    <Skeleton className="size-4" />
                  </div>
                )}
                {columns.map((column, columnIndex) => (
                  <div
                    key={column.key ?? String(column.dataIndex ?? columnIndex)}
                    role="cell"
                    data-cell
                    className={cn(
                      "min-w-0",
                      cellPadding,
                      edgePadding,
                      rowSelection && columnIndex === 0 && "!pl-1",
                      column.fixed && cn(fixedClass(column), FIXED_JUSTIFY[column.align ?? "left"])
                    )}
                  >
                    <Skeleton className={cn("h-3 w-3/5", column.align === "center" && "mx-auto", column.align === "right" && "ml-auto")} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : !hasRecords ? fill ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              ref={emptyStateRef}
              className={cn("flex min-h-0 w-full flex-1 flex-col items-center justify-center", !emptyAnimationFinished && "fade-in")}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) setEmptyAnimationFinished(true);
              }}
            >{emptyContent}</div>
          </div>
        ) : (
          <div className="flex min-h-[200px] flex-col items-center justify-center">{emptyContent}</div>
        ) : (
          <>
          {shouldVirtualize ? (
            <div role="rowgroup" className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
              {virtualItems.map((item) => {
                const row = rows[item.index];
                if (!row) return null;
                return renderRow(
                  row,
                  { position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${item.start - headerHeight}px)` },
                  virtualizer.measureElement,
                  item.index
                );
              })}
            </div>
          ) : (
            <div role="rowgroup">{rows.map((row) => renderRow(row))}</div>
          )}
          {onLoadMore && hasNext && <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />}
          {onLoadMore && loadingMore && <span className="sr-only" role="status">{t('ui.loadingMore')}</span>}
          </>
        )}
      </div>
    </div>
  );
}
