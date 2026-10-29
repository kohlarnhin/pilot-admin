import * as React from "react";
import { cn } from "@/utils";
import { Icon } from "@/components/icon";
import { Spinner } from "./spinner";

export interface FileDropZoneProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onFiles: (files: File[]) => void;
  title?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: string;
  className?: string;
  /** 自定义内部内容（替代默认图标 + 标题 + 提示） */
  children?: React.ReactNode;
}

/**
 * 统一的文件拖拽 / 点击选择区域：浅灰底虚线框，拖入或悬浮时加深中性边框。
 * 仅在本地读取文件，不发起任何上传请求。
 */
export function FileDropZone({
  accept,
  multiple = false,
  disabled = false,
  loading = false,
  onFiles,
  title = "点击或拖拽文件到此处",
  hint,
  icon = "upload",
  className,
  children,
}: FileDropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const inactive = disabled || loading;

  const accepts = React.useCallback((file: File) => {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    return accept.split(",").map((item) => item.trim().toLowerCase()).some((rule) =>
      rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? file.type.startsWith(rule.slice(0, -1)) : file.type === rule
    );
  }, [accept]);

  const deliver = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list).filter(accepts);
    if (files.length === 0) return;
    onFiles(multiple ? files : files.slice(0, Math.max(1, files.length)));
  };

  return (
    <div
      role="button"
      tabIndex={inactive ? -1 : 0}
      aria-disabled={inactive || undefined}
      onClick={() => !inactive && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (!inactive && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!inactive) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!inactive) deliver(event.dataTransfer.files);
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-8 py-8 text-center outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-slate-300",
        dragging
          ? "border-slate-400 bg-slate-50"
          : "border-slate-300/80 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50",
        inactive && "cursor-not-allowed opacity-60 hover:border-slate-300/80 hover:bg-slate-50/60",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          // 若文件个数不符合预期，交由调用方处理（例如单文件场景给出提示）
          const list = event.target.files;
          if (list && list.length > 0) onFiles(Array.from(list));
          event.target.value = "";
        }}
      />
      {children ?? (
        <>
          <span className="mb-3.5 flex size-12 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-2xs transition-transform duration-200 group-hover:-translate-y-0.5">
            {loading ? <Spinner size={22} /> : <Icon icon={icon} size={26} />}
          </span>
          <div className="text-13 font-medium text-slate-700">{title}</div>
          {hint && <div className="mt-1.5 text-xs text-slate-400">{hint}</div>}
        </>
      )}
    </div>
  );
}
