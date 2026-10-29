import * as React from "react";
import { toast, Toaster as SonnerToaster } from "sonner";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Spinner } from "./spinner";

type MessageContent = React.ReactNode | { content: React.ReactNode; key?: string; duration?: number };

const normalize = (input: MessageContent, duration?: number) => {
  if (input && typeof input === "object" && !React.isValidElement(input) && "content" in input) {
    return {
      content: input.content,
      options: { id: input.key, duration: input.duration !== undefined ? input.duration * 1000 : undefined },
    };
  }
  return { content: input as React.ReactNode, options: { duration: duration !== undefined ? duration * 1000 : undefined } };
};

const make = (kind: "success" | "error" | "warning" | "info" | "loading") =>
  (input: MessageContent, duration?: number) => {
    const { content, options } = normalize(input, duration);
    return toast[kind](content, options);
  };

/**
 * 全局轻提示（替代 antd message），统一走 sonner：
 * message.success('已保存') / message.error({ content, key })
 */
export const message = {
  success: make("success"),
  error: make("error"),
  warning: make("warning"),
  info: make("info"),
  loading: make("loading"),
  destroy: (key?: string | number) => toast.dismiss(key),
};

/** 应用根部挂载的提示容器：白底细边框卡片，左侧语义色图标。 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      gap={8}
      offset={20}
      visibleToasts={4}
      icons={{
        success: <CheckCircle2 className="size-4 text-emerald-500" />,
        error: <XCircle className="size-4 text-red-500" />,
        warning: <AlertTriangle className="size-4 text-amber-500" />,
        info: <Info className="size-4 text-sky-500" />,
        loading: <Spinner size={16} />,
      }}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "!min-h-0 !gap-2.5 !rounded-xl !border !border-line !bg-white !px-4 !py-2.5 !font-sans !shadow-pop",
          title: "!text-13 !font-medium !leading-5 !text-slate-800",
          description: "!text-xs !text-slate-500",
          icon: "!m-0 !size-4 !shrink-0",
        },
      }}
    />
  );
}
