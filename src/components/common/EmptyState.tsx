import { t, useT } from '@/i18n';
import React from 'react';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  /** 可选占位高度 */
  minHeight?: number | string;
  className?: string;
}

/**
 * 空状态占位：水平垂直居中展示，清晰简洁无多余模糊阴影。
 * 供列表页空数据、仪表盘无数据、工作台等场景使用。
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = t('common.empty'),
  description,
  icon = 'inbox',
  action,
  minHeight,
  className,
}) => {
  useT();
  return (
    <div
      className={cn(
        'w-full h-full flex-1 flex flex-col items-center justify-center gap-3 px-6 py-8',
        className
      )}
      style={minHeight ? { minHeight } : undefined}
    >
      {/* 图标容器 */}
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-400 shadow-2xs">
        <Icon icon={icon} size={24} />
      </div>
      <div className="text-sm font-medium text-slate-600 text-center">{title}</div>
      {description && (
        <div className="text-xs text-slate-500 max-w-md text-center leading-relaxed">
          {description}
        </div>
      )}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};
