import type { LucideIcon } from 'lucide-react';
import { FileText, Folder } from 'lucide-react';
import { resolveIcon } from './registry';

/** 菜单图标只由 icon 字段定义，未配置时回退文件夹或文件。 */
export const getMenuIcon = (icon?: string, hasChildren = false): LucideIcon =>
  resolveIcon(icon) ?? (hasChildren ? Folder : FileText);
