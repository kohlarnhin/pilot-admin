import React, { useState } from 'react';
import { Icon } from '@/components/icon';
import { copyToClipboard, cn } from '@/utils';
import { message } from '@/ui/message';
import { Tooltip } from '@/ui/tooltip';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: number;
  tip?: string;
  /** 敏感值复制成功后不在提示中回显内容 */
  secret?: boolean;
}

/** 复制按钮：静止为浅灰图标，复制成功后切换为绿色对勾约 1.8 秒。 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className,
  size = 13,
  tip = '复制',
  secret = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      message.success(secret ? '已复制' : `已复制：${text}`);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      message.error('复制失败，请手动选择复制');
    }
  };

  return (
    <Tooltip title={copied ? '已复制' : tip}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={tip}
        className={cn(
          'inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded p-0.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300',
          copied ? 'text-emerald-500 !opacity-100' : 'text-slate-400 hover:text-slate-700',
          className
        )}
      >
        <Icon icon={copied ? 'circle-check' : 'copy'} size={size} />
      </button>
    </Tooltip>
  );
};
