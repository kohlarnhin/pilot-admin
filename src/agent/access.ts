import type { Menu, UserPreferences } from '@/types';
import { getFirstAccessiblePage } from '@/routes/access';

export function canAccessAgent(_menus: Menu[], permissions: string[]): boolean {
  return permissions.includes('agent:use');
}

/** 管理后台入口忽略独立的 Agent 菜单，避免“返回”又跳回 Agent。 */
export function getConsoleRoute(menus: Menu[], permissions: string[]): string {
  return getFirstAccessiblePage(menus, permissions, { exclude: ['/agent'] });
}

export function getLoginLandingRoute(menus: Menu[], permissions: string[], preferences: UserPreferences): string {
  if (canAccessAgent(menus, permissions) && preferences.agent_mode_entry === 'agent') return '/agent';
  return getConsoleRoute(menus, permissions);
}

/** 仅接受本站 Agent 路由，导航状态不能把“返回对话”变成任意外部跳转。 */
export function agentReturnPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return /^\/agent(?:\?session=[\w%-]+)?$/.test(value) ? value : undefined;
}
