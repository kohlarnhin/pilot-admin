import { t, useT } from '@/i18n';
import * as React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";
import { Tooltip } from "./tooltip";

export interface Crumb {
  label: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

interface WorkbenchCrumbsProps {
  onBack?: () => void;
  backLabel?: string;
  items: Crumb[];
  /** 末级后方的计数 / 状态 */
  extra?: React.ReactNode;
  className?: string;
}

/**
 * 工作台面包屑：32px 细边框返回按钮 + 可点击的上级路径 + 加粗的当前位置。
 */
export function WorkbenchCrumbs({ onBack, backLabel = t('common.actions.back'), items, extra, className }: WorkbenchCrumbsProps) {
  useT();
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {onBack && (
        <Tooltip title={backLabel}>
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-slate-500 shadow-2xs transition-colors duration-150 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <ArrowLeft className="size-4" />
          </button>
        </Tooltip>
      )}
      <nav aria-label={t('ui.breadcrumbLocation')} className="flex min-w-0 items-center gap-1.5 text-13">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-slate-300" />}
              {last || !item.onClick ? (
                <span
                  className={cn("truncate", last ? "font-semibold text-slate-900" : "text-slate-500")}
                  title={item.title}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  title={item.title}
                  className="max-w-[180px] cursor-pointer truncate font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {item.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      {extra}
    </div>
  );
}
