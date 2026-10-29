import React from 'react';
import { Skeleton } from '@/ui/skeleton';
import { cn } from '@/utils';

/**
 * 路由切换 / 页面懒加载时的整页骨架屏（shadcn 风格）：
 * 模拟标准列表页结构（工具条 + 表格），避免切换页面时闪白或先展示空占位。
 */
export const PageSkeleton: React.FC<{ rows?: number }> = ({ rows = 7 }) => {
  const headerWidths = ['22%', '16%', '14%', '12%', '10%', '14%'];
  const rowWidths = ['16%', '14%', '12%', '10%', '14%'];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* 顶部工具条（标题 + 操作按钮占位） */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-50 px-6 py-5">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* 表格骨架（表头 + 数据行，第一列圆形头像） */}
      <div className="w-full px-4 sm:px-6">
        <div className="flex h-11 items-center gap-6 border-b border-[#E9EEF4]">
          {headerWidths.map((width, index) => (
            <Skeleton key={index} className="h-3.5" style={{ width }} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex h-[52px] items-center gap-6 border-b border-[#E9EEF4]">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            {rowWidths.map((width, index) => (
              <Skeleton
                key={index}
                className={cn('h-3.5', rowIndex % 2 === 1 && 'opacity-60')}
                style={{ width }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
