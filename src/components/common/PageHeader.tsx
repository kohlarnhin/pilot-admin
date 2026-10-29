import { t, useT } from '@/i18n';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Tooltip } from '@/ui/tooltip';
import { cn } from '@/utils';

export interface PageCrumb {
  label: React.ReactNode;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** 标题右侧的计数 / 状态 */
  meta?: React.ReactNode;
  /** 右侧主操作（每页仅一个主按钮） */
  actions?: React.ReactNode;
  /** 标题前的上级路径（工作台等多级页面），与标题同行展示 */
  crumbs?: PageCrumb[];
  /** 返回上一级 */
  onBack?: () => void;
  backLabel?: string;
  className?: string;
  /** 兼容旧调用 */
  icon?: string;
  extra?: React.ReactNode;
}

/**
 * 页面标题区：位于内容卡片之外、无底色。
 * 20px 标题 + 13px 说明；右侧放置本页主操作。
 * 多级页面把上级路径与标题放在同一行（「资源管理 / 资源详情」）：上级为浅灰可点击，当前页为深色，
 * 左侧配返回按钮；标题区高度与普通页面一致，下方内容卡片的起始位置保持统一。
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  meta,
  actions,
  crumbs,
  onBack,
  backLabel = t('common.actions.back'),
  className,
  extra,
}) => {
  useT();
  return (
  <div className={cn('mb-5 flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-3">
        {onBack && (
          <Tooltip title={backLabel}>
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-slate-500 shadow-2xs transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <ArrowLeft className="size-[15px]" />
            </button>
          </Tooltip>
        )}
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="flex min-w-0 items-center text-xl font-semibold leading-7 tracking-tight text-slate-900">
            {crumbs?.map((crumb, index) => (
              <React.Fragment key={index}>
                {crumb.onClick ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="max-w-[240px] shrink-0 cursor-pointer truncate font-medium text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:text-slate-700"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="max-w-[240px] shrink-0 truncate font-medium text-slate-400">{crumb.label}</span>
                )}
                <span aria-hidden="true" className="mx-2 shrink-0 font-normal text-slate-300">/</span>
              </React.Fragment>
            ))}
            <span className="truncate" title={typeof title === 'string' ? title : undefined}>{title}</span>
          </h1>
          {meta !== undefined && meta !== null && (
            <span className="shrink-0 text-13 tabular-nums text-slate-400">{meta}</span>
          )}
        </div>
      </div>
      {description && <p title={typeof description === 'string' ? description : undefined} className={cn('mt-1 truncate text-13 leading-5 text-slate-500', onBack && 'pl-10')}>{description}</p>}
    </div>
    {(actions || extra) && (
      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
        {extra}
        {actions}
      </div>
    )}
  </div>
  );
};
