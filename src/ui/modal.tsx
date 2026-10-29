import { t, useT } from '@/i18n';
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/utils";
import { Icon } from "@/components/icon";
import { Button, type ButtonProps } from "./button";

type ActionButtonProps = ButtonProps & { danger?: boolean };

export interface ModalProps {
  open?: boolean;
  "aria-modal"?: React.AriaAttributes["aria-modal"];
  title?: React.ReactNode;
  /** 无可见标题时的无障碍名称（默认「对话框」） */
  ariaLabel?: string;
  /** 标题左侧图标（Iconify 名称或节点），统一渲染在 32px 白底细边框图标槽内 */
  icon?: string | React.ReactNode;
  /** 标题下方的一行说明 */
  description?: React.ReactNode;
  onOk?: (event: React.MouseEvent<HTMLButtonElement>) => unknown;
  onCancel?: () => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: "primary" | "danger" | "default";
  confirmLoading?: boolean;
  okButtonProps?: ActionButtonProps;
  cancelButtonProps?: ButtonProps;
  /** null 隐藏底栏；传入节点则替换默认按钮 */
  footer?: React.ReactNode | null;
  width?: number | string;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  /** 兼容旧调用：内容在关闭时始终卸载 */
  destroyOnHidden?: boolean;
  centered?: boolean;
  className?: string;
  bodyClassName?: string;
  styles?: { body?: React.CSSProperties; content?: React.CSSProperties };
  afterClose?: () => void;
  zIndex?: number;
  children?: React.ReactNode;
}

const isFromToaster = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest("[data-sonner-toaster]"));

export function ModalIcon({ icon, tone = "brand" }: { icon: string | React.ReactNode; tone?: "brand" | "danger" }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        tone === "danger" ? "border border-line bg-white text-red-500 shadow-2xs" : "border border-line bg-white text-slate-600 shadow-2xs"
      )}
    >
      {typeof icon === "string" ? <Icon icon={icon} size={18} /> : icon}
    </span>
  );
}

/**
 * 标准弹窗：白底 16px 圆角、细边框与浮层阴影；标题栏、底栏固定，内容区独立滚动。
 * 高度受视口约束，长表单时保存/取消按钮始终可见。
 */
export function Modal({
  open = false,
  "aria-modal": ariaModal,
  title,
  ariaLabel,
  icon,
  description,
  onOk,
  onCancel,
  okText = t('ui.ok'),
  cancelText = t('ui.cancel'),
  okType = "primary",
  confirmLoading = false,
  okButtonProps,
  cancelButtonProps,
  footer,
  width = 520,
  closable = true,
  maskClosable = true,
  keyboard = true,
  className,
  bodyClassName,
  styles,
  afterClose,
  zIndex,
  children,
}: ModalProps) {
  useT();
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    if (wasOpen.current && !open && afterClose) {
      const timer = window.setTimeout(afterClose, 140);
      wasOpen.current = open;
      return () => window.clearTimeout(timer);
    }
    wasOpen.current = open;
  }, [open, afterClose]);

  const { danger, className: okClassName, loading: okLoading, ...restOk } = okButtonProps ?? {};
  const isDanger = danger || okType === "danger";
  const hasHeader = Boolean(title || icon);

  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  const pendingToken = React.useRef(0);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 关闭后立即释放 pending，避免下次打开沿用上一次的异步状态。
  React.useEffect(() => {
    if (open) return;
    pendingToken.current += 1;
    pendingRef.current = false;
    setPending(false);
  }, [open]);

  const busy = pending || confirmLoading || Boolean(okLoading);
  // 关闭只由弹窗自身跟踪的异步操作阻断；confirmLoading 等外部状态交给页面决定是否允许关闭。
  const closeBlocked = pending;

  const handleOk = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (busy || pendingRef.current) return;
    const result = onOk?.(event);
    if (!result || typeof (result as PromiseLike<unknown>).then !== "function") return;

    const token = ++pendingToken.current;
    pendingRef.current = true;
    setPending(true);
    const done = () => {
      if (token !== pendingToken.current) return;
      pendingRef.current = false;
      if (mountedRef.current) setPending(false);
    };
    // 页面通常自行处理错误；这里只结束 pending，避免产生未处理的 rejection。
    Promise.resolve(result).then(done, done);
  };

  const handleCancel = () => {
    if (closeBlocked || pendingRef.current) return;
    onCancel?.();
  };

  const defaultFooter = (
    <>
      <Button variant="outline" {...cancelButtonProps} disabled={closeBlocked || cancelButtonProps?.disabled} onClick={handleCancel}>
        {cancelText}
      </Button>
      <Button
        variant={isDanger ? "destructive" : "outline"}
        loading={busy}
        className={okClassName}
        {...restOk}
        onClick={handleOk}
      >
        {okText}
      </Button>
    </>
  );
  const footerNode = footer === undefined ? defaultFooter : footer;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[1000] bg-slate-900/40 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out"
          style={zIndex ? { zIndex } : undefined}
        />
        <DialogPrimitive.Content
          aria-modal={ariaModal}
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            // 优先聚焦内容区第一个可输入控件，避免关闭按钮获得焦点出现描边
            event.preventDefault();
            const content = event.currentTarget as HTMLElement;
            const field = content.querySelector<HTMLElement>(
              '[data-slot="modal-body"] input:not([disabled]):not([type="hidden"]), [data-slot="modal-body"] textarea:not([disabled])'
            );
            (field ?? content).focus({ preventScroll: true });
          }}
          onEscapeKeyDown={(event) => {
            if (closeBlocked || !keyboard) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (closeBlocked || !maskClosable || isFromToaster(event.target)) event.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-[1000] flex max-h-[calc(100vh-48px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-overlay outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
            className
          )}
          style={{ maxWidth: width, ...(zIndex ? { zIndex } : null), ...styles?.content }}
        >
          {hasHeader ? (
            <div className="flex shrink-0 items-start gap-3 border-b border-line-soft px-6 py-4">
              {icon && <ModalIcon icon={icon} tone={isDanger ? "danger" : "brand"} />}
              <div className="min-w-0 flex-1 self-center">
                <DialogPrimitive.Title className="truncate text-[15px] font-semibold leading-6 text-slate-900">
                  {title}
                </DialogPrimitive.Title>
                {description && <div className="mt-0.5 text-xs leading-5 text-slate-500">{description}</div>}
              </div>
              {closable && (
                <DialogPrimitive.Close asChild>
                  <Button variant="subtle" size="icon-sm" aria-label={t('ui.close')} className="-mr-2 shrink-0 text-slate-400">
                    <X className="size-4" />
                  </Button>
                </DialogPrimitive.Close>
              )}
            </div>
          ) : (
            <>
              <DialogPrimitive.Title className="sr-only">{ariaLabel ?? t('ui.dialog')}</DialogPrimitive.Title>
              {closable && (
                <DialogPrimitive.Close asChild>
                  <Button variant="subtle" size="icon-sm" aria-label={t('ui.close')} className="absolute right-3 top-3 z-10 text-slate-400">
                    <X className="size-4" />
                  </Button>
                </DialogPrimitive.Close>
              )}
            </>
          )}
          <div
            data-slot="modal-body"
            className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-5 text-13 text-slate-700", bodyClassName)}
            style={styles?.body}
          >
            {children}
          </div>
          {footerNode !== null && footerNode !== false && (
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line-soft px-6 py-3.5">
              {footerNode}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ------------------------------------------------------------------------ */
/* 命令式确认框：Modal.confirm / success / error / info / warning              */
/* ------------------------------------------------------------------------ */

type ConfirmKind = "confirm" | "success" | "error" | "info" | "warning";

export interface ConfirmConfig {
  title?: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: "primary" | "danger" | "default";
  okButtonProps?: ActionButtonProps;
  cancelButtonProps?: ButtonProps;
  onOk?: () => unknown;
  onCancel?: () => unknown;
  width?: number;
  centered?: boolean;
  maskClosable?: boolean;
  closable?: boolean;
  className?: string;
}

interface ConfirmEntry extends ConfirmConfig {
  id: number;
  kind: ConfirmKind;
  open: boolean;
  failureText: string;
}

let entries: ConfirmEntry[] = [];
let seed = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => entries;

function openConfirm(kind: ConfirmKind, config: ConfirmConfig) {
  const id = ++seed;
  entries = [...entries, {
    ...config,
    id,
    kind,
    open: true,
    okText: config.okText ?? (kind === 'confirm' ? t('ui.ok') : t('ui.gotIt')),
    cancelText: config.cancelText ?? t('ui.cancel'),
    failureText: t('ui.actionFailed'),
  }];
  emit();
  const close = () => {
    entries = entries.map((entry) => (entry.id === id ? { ...entry, open: false } : entry));
    emit();
    window.setTimeout(() => {
      entries = entries.filter((entry) => entry.id !== id);
      emit();
    }, 200);
  };
  return {
    destroy: close,
    update: (next: Partial<ConfirmConfig>) => {
      entries = entries.map((entry) => (entry.id === id ? { ...entry, ...next } : entry));
      emit();
    },
  };
}

const KIND_ICON: Record<ConfirmKind, React.ReactNode> = {
  confirm: <AlertTriangle className="size-[18px]" />,
  warning: <AlertTriangle className="size-[18px]" />,
  success: <CheckCircle2 className="size-[18px]" />,
  error: <XCircle className="size-[18px]" />,
  info: <Info className="size-[18px]" />,
};

const KIND_TONE: Record<ConfirmKind, string> = {
  confirm: "bg-slate-100 text-slate-600",
  warning: "bg-amber-50 text-amber-500",
  success: "bg-emerald-50 text-emerald-500",
  error: "border border-line bg-white text-red-500 shadow-2xs",
  info: "bg-sky-50 text-sky-500",
};

function ConfirmDialog({ entry, close }: { entry: ConfirmEntry; close: () => void }) {
  const [pending, setPending] = React.useState(false);
  const pendingRef = React.useRef(false);
  const [error, setError] = React.useState('');
  const isDanger = entry.okType === "danger" || entry.okButtonProps?.danger;
  const { danger: _danger, ...restOk } = entry.okButtonProps ?? {};
  const isConfirm = entry.kind === "confirm";

  const run = async (handler?: () => unknown) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setError('');
    try {
      const result = handler?.();
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setPending(true);
        await result;
      }
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : entry.failureText);
      setPending(false);
    } finally {
      pendingRef.current = false;
    }
  };

  return (
    <DialogPrimitive.Root
      open={entry.open}
      onOpenChange={(next) => {
        if (!next && !pending) void run(entry.onCancel);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1010] bg-slate-900/40 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onInteractOutside={(event) => {
            if (!entry.maskClosable || pending) event.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-[1010] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-white p-6 shadow-overlay outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
            entry.className
          )}
          style={{ maxWidth: entry.width ?? 420 }}
        >
          <div className="flex gap-3.5">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", isDanger ? "border border-line bg-white text-red-500 shadow-2xs" : KIND_TONE[entry.kind])}>
              {entry.icon ?? KIND_ICON[entry.kind]}
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              <DialogPrimitive.Title className="text-[15px] font-semibold leading-6 text-slate-900">
                {entry.title}
              </DialogPrimitive.Title>
              {entry.content && (
                <div className="mt-1.5 text-13 leading-[22px] text-slate-600">{entry.content}</div>
              )}
              {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            {isConfirm && (
              <Button variant="outline" disabled={pending} onClick={() => void run(entry.onCancel)} {...entry.cancelButtonProps}>
                {entry.cancelText}
              </Button>
            )}
            <Button
              variant={isDanger ? "destructive" : "outline"}
              loading={pending}
              {...restOk}
              onClick={() => void run(entry.onOk)}
            >
              {entry.okText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** 挂载在应用根部，承载所有命令式确认框。 */
export function ModalHost() {
  const list = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return (
    <>
      {list.map((entry) => (
        <ConfirmDialog
          key={entry.id}
          entry={entry}
          close={() => {
            entries = entries.map((item) => (item.id === entry.id ? { ...item, open: false } : item));
            emit();
            window.setTimeout(() => {
              entries = entries.filter((item) => item.id !== entry.id);
              emit();
            }, 200);
          }}
        />
      ))}
    </>
  );
}

Modal.confirm = (config: ConfirmConfig) => openConfirm("confirm", config);
Modal.success = (config: ConfirmConfig) => openConfirm("success", config);
Modal.error = (config: ConfirmConfig) => openConfirm("error", config);
Modal.info = (config: ConfirmConfig) => openConfirm("info", config);
Modal.warning = (config: ConfirmConfig) => openConfirm("warning", config);

/* ------------------------------------------------------------------------ */
/* 抽屉                                                                      */
/* ------------------------------------------------------------------------ */

export interface DrawerProps {
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  closable?: boolean;
  mask?: boolean;
  maskClosable?: boolean;
  /** floating：上下右留 16px 的悬浮卡片；flush：贴边 */
  variant?: "floating" | "flush";
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  onOpenAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  children?: React.ReactNode;
}

/** 右侧抽屉：标题栏固定，内容区独立滚动。 */
export function Drawer({
  open = false,
  onClose,
  title,
  extra,
  footer,
  width = 560,
  closable = true,
  mask = true,
  maskClosable = true,
  variant = "flush",
  className,
  headerClassName,
  bodyClassName,
  onOpenAutoFocus,
  onEscapeKeyDown,
  children,
}: DrawerProps) {
  useT();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose?.()} modal={mask}>
      <DialogPrimitive.Portal>
        {mask && (
          <DialogPrimitive.Overlay className="fixed inset-0 z-[1000] bg-slate-900/30 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        )}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={onOpenAutoFocus}
          onEscapeKeyDown={onEscapeKeyDown}
          onInteractOutside={(event) => {
            if (!maskClosable || !mask || isFromToaster(event.target)) event.preventDefault();
          }}
          className={cn(
            "fixed z-[1000] flex max-w-[calc(100vw-32px)] flex-col overflow-hidden bg-white outline-none data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out",
            variant === "floating"
              ? "bottom-4 right-4 top-4 rounded-2xl border border-line shadow-overlay"
              : "bottom-0 right-0 top-0 border-l border-line shadow-overlay",
            className
          )}
          style={{ width }}
        >
          {(title || closable || extra) && (
            <div className={cn("flex h-14 shrink-0 items-center gap-3 border-b border-line-soft px-5", headerClassName)}>
              <DialogPrimitive.Title asChild>
                <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900">{title}</div>
              </DialogPrimitive.Title>
              {extra}
              {closable && (
                <DialogPrimitive.Close asChild>
                  <Button variant="subtle" size="icon-sm" aria-label={t('ui.close')} className="-mr-1.5 text-slate-400">
                    <X className="size-4" />
                  </Button>
                </DialogPrimitive.Close>
              )}
            </div>
          )}
          <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto", bodyClassName)}>{children}</div>
          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line-soft px-5 py-3.5">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
