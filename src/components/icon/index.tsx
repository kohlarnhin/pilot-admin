import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils";
import { resolveIcon } from "./registry";

export type { IconName } from "./registry";

export interface IconProps {
  /** 图标名称（见 registry 的 lucide 名称）或 lucide 图标组件 */
  icon: string | LucideIcon;
  size?: string | number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/** 统一的线性图标：lucide，默认 1.75 线宽，与侧边栏导航图标一致。 */
export function Icon({ icon, size = "1em", color, strokeWidth = 1.75, className = "", style = {} }: IconProps) {
  const Component = typeof icon === "string" ? resolveIcon(icon) : icon;
  if (!Component) return null;
  return (
    <Component
      aria-hidden="true"
      strokeWidth={strokeWidth}
      className={cn("inline-block shrink-0", className)}
      style={{ ...(color ? { color } : {}), width: size, height: size, ...style }}
    />
  );
}

export default Icon;
