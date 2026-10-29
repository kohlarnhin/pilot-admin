import { GlobalSearchTrigger } from '@/components/search/GlobalSearch';
import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { useAssistantStore } from '@/store/assistantStore';
import { getAssistantShortcut } from '@/components/assistant/assistantUtils';
import { Kbd } from '@/components/common/Kbd';
import { appConfig } from '@/config/app';
import { Tooltip } from '@/ui/tooltip';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Logo } from '@/components/logo';
import { getMenuIcon } from '@/components/icon/menuIcons';
import { cn } from '@/utils';
import { NavVertical, NavMini, type NavProps, type NavItemDataProps } from '@/components/nav';
import { BookOpen, ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react';
import { AccountMenu } from './AccountMenu';
import { getFirstAccessibleRoute } from '../../api/services/menuService';
import type { Menu } from '../../types';
import { preloadRoute } from '../../routes/routeModules';

const convertChildren = (children?: Menu[]): NavItemDataProps[] => {
  if (!children || children.length === 0) return [];
  return children
    .filter((child) => child.visible !== 0 && child.status !== 0)
    .sort((a, b) => (a.sort_no || 0) - (b.sort_no || 0))
    .map((child) => ({
      title: child.menu_name,
      path: child.route_path || '',
      icon: getMenuIcon(child.route_path, child.icon),
      children: convertChildren(child.children),
    }));
};

/**
 * Convert backend RBAC Menu tree into Slash-style Nav Data (Groups & Items)
 * 严格按照后端返回的角色已授权菜单动态构建，不硬编码默认菜单
 */
const convertMenusToNavData = (menus: Menu[]): NavProps['data'] => {
  const validMenus = (menus || [])
    .filter((m) => m.visible !== 0 && m.status !== 0)
    .sort((a, b) => (a.sort_no || 0) - (b.sort_no || 0));

  const navGroups: NavProps['data'] = [];

  for (const menu of validMenus) {
    const hasChildren = menu.children && menu.children.length > 0;
    if (hasChildren) {
      const childItems = convertChildren(menu.children);
      if (childItems.length > 0) {
        navGroups.push({
          name: menu.menu_name,
          items: childItems,
        });
      }
    } else if (menu.route_path) {
      navGroups.push({
        name: undefined,
        items: [
          {
            title: menu.menu_name,
            path: menu.route_path,
            icon: getMenuIcon(menu.route_path, menu.icon),
          },
        ],
      });
    }
  }

  return navGroups;
};

export const Sidebar: React.FC = () => {
  const assistant = useAssistantStore();
  const canUseAgent = useAuthStore((state) => state.permissions.includes('agent:use'));
  const shortcut = getAssistantShortcut();
  const menus = useAuthStore((state) => state.menus);
  const siteName = useAppStore((state) => state.siteName);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const navData = useMemo(() => convertMenusToNavData(menus), [menus]);
  const homePath = useMemo(() => getFirstAccessibleRoute(menus), [menus]);
  const homeHref = homePath === '/403' ? '/' : homePath;

  return (
    <nav
      data-slot="pilot-admin-layout-nav"
      className={cn(
        'scrollbar-hover-zone fixed inset-y-0 left-0 z-30 flex h-full select-none flex-col border-r border-line bg-white transition-[width] duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[var(--layout-nav-width-mini)]' : 'w-[var(--layout-nav-width)]'
      )}
    >
      {/* 品牌区 */}
      <div
        className={cn(
          'relative flex h-16 shrink-0 items-center px-5 transition-all duration-300',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <Link
          to={homeHref}
          onPointerEnter={() => void preloadRoute(homeHref)}
          onFocus={() => void preloadRoute(homeHref)}
          className={cn('flex cursor-pointer items-center overflow-hidden', sidebarCollapsed ? 'gap-0' : 'gap-3')}
        >
          <Logo size={32} disableLink className="shrink-0" />
          <div
            className={cn(
              'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
              sidebarCollapsed
                ? 'pointer-events-none max-w-0 -translate-x-3 opacity-0'
                : 'max-w-[160px] translate-x-0 opacity-100'
            )}
          >
            <span className="block text-[15px] font-semibold leading-tight tracking-tight text-slate-900" title={siteName}>{siteName}</span>
            <span className="mt-0.5 block text-[11px] text-slate-400">{appConfig.zhName} · 通用管理端</span>
          </div>
        </Link>

        {/* 折叠按钮：骑在侧边栏右边线上 */}
        <Tooltip title={sidebarCollapsed ? '展开菜单' : '折叠菜单'} placement="right">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? '展开菜单' : '折叠菜单'}
            aria-expanded={!sidebarCollapsed}
            className="absolute right-0 z-10 flex size-6 translate-x-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-slate-400 shadow-xs transition-[color,transform,border-color] duration-200 hover:scale-110 hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            {sidebarCollapsed ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
          </button>
        </Tooltip>
      </div>

      <div className="shrink-0 pb-3"><GlobalSearchTrigger collapsed={sidebarCollapsed} /></div>

      {/* 菜单列表 */}
      <div className="scrollbar-hover min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-1">
        <div key={sidebarCollapsed ? 'mini' : 'vertical'} className="-mx-3 animate-overlay-in bg-white px-3">
          {navData.length > 0 ? (
            sidebarCollapsed ? <NavMini data={navData} /> : <NavVertical data={navData} />
          ) : !sidebarCollapsed ? (
            <div className="mx-2 mt-3 rounded-lg border border-line px-3 py-4 text-center text-xs text-slate-400">
              暂无可访问菜单
            </div>
          ) : null}
        </div>
      </div>

      {/* 固定底部入口与当前账号 */}
      <div className="shrink-0 border-t border-line-soft p-3">
        <div data-slot="sidebar-assistant-entry">{canUseAgent ? <Tooltip title={sidebarCollapsed ? `AI 助手 · ${shortcut.label}` : undefined} placement="right"><button type="button" aria-label="AI 助手" aria-controls="ai-assistant-panel" aria-expanded={assistant.panelOpen} aria-keyshortcuts={shortcut.ariaKeyShortcuts} onClick={(event) => assistant.togglePanel(event.currentTarget)} className={cn('group mb-2 flex h-10 w-full items-center rounded-lg text-13 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300', sidebarCollapsed ? 'justify-center' : 'gap-3 px-3', assistant.panelOpen && 'bg-slate-100')}>
          <span className="relative flex size-[22px] shrink-0 items-center justify-center"><Sparkles size={18} className="text-slate-500" />{assistant.streaming ? <span role="status" aria-label="助手正在生成" className="absolute -right-0.5 -top-0.5 size-1.5 animate-pulse rounded-full bg-brand-500 motion-reduce:animate-none" /> : null}</span>{!sidebarCollapsed ? <><span className="flex-1 text-left">AI 助手</span><Kbd className="!border-slate-200 !bg-white !text-slate-400">{shortcut.label}</Kbd></> : null}
        </button></Tooltip> : null}</div>
        {appConfig.helpUrl && (
        <div key={sidebarCollapsed ? 'mini-help' : 'vertical-help'} className="mb-2 animate-overlay-in">
          <Tooltip title={sidebarCollapsed ? '使用手册' : undefined} placement="right" mouseEnterDelay={0.2}>
            <Link
              to={appConfig.helpUrl}
              target="_blank" rel="noreferrer"
              aria-label="使用手册"
              className={cn(
                'group flex h-10 items-center rounded-lg text-13 text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300',
                sidebarCollapsed ? 'justify-center rounded-xl px-1' : 'gap-3 px-3'
              )}
            >
              <span className="inline-flex size-[22px] shrink-0 items-center justify-center text-slate-400 transition-colors duration-200 group-hover:text-slate-600">
                <BookOpen size={sidebarCollapsed ? 20 : 18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              {!sidebarCollapsed && <span>使用手册</span>}
            </Link>
          </Tooltip>
        </div>
        )}
        <AccountMenu collapsed={sidebarCollapsed} />
      </div>
    </nav>
  );
};
