import * as React from "react";
import { toast } from "sonner";

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

export { Toaster } from "./toaster";
