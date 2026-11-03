import { LocaleSubmenu } from '@/components/common/LocaleSwitcher';
import { t, useT } from '@/i18n';
import { usePermission } from '@/hooks/usePermission';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, ChevronsUpDown, KeyRound, LogOut, SquareTerminal, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { appConfig } from '@/config/app';
import { Dropdown, DropdownItem, menuItemClass } from '@/ui/dropdown';
import { message } from '@/ui/message';
import { Tooltip } from '@/ui/tooltip';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { cn } from '@/utils';
import { AgentPreferencesDialog } from '@/agent/AgentPreferencesDialog';
import { PasswordChangeModal } from './PasswordChangeModal';

/**
 * 侧边栏底部的当前账号：头像 + 姓名 + 账号，点击展开「修改密码 / 退出登录」。
 * 折叠模式下仅显示头像。
 */
export const AccountMenu: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  useT();
  const user = useAuthStore((state) => state.user);
  const canUseAgent = usePermission('agent:use');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
    message.info(t('layout.signedOut'));
  };

  const displayName = user?.user_name || t('layout.currentUser');
  const accountLine = user?.login_name ? `@${user.login_name}` : user?.email || '';
  const fallbackChar = user?.user_name ? user.user_name.slice(0, 1) : t('layout.avatarFallback');

  const avatar = (
    <Avatar aria-hidden="true" className="size-8 shrink-0">
      {user?.avatar ? (
        <img className="size-full rounded-full object-cover" src={user.avatar} alt="" />
      ) : (
        <AvatarFallback className="text-13">{fallbackChar}</AvatarFallback>
      )}
    </Avatar>
  );

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      data-slot="account-menu-trigger"
      aria-label={collapsed ? `${t('layout.accountMenu')}: ${displayName}` : undefined}
      aria-description={t('layout.accountMenu')}
      className={cn(
        'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-lg text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        collapsed ? 'justify-center p-1.5' : 'px-2 py-1.5',
        open ? 'bg-slate-100' : 'hover:bg-slate-50'
      )}
    >
      {avatar}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-13 font-medium leading-5 text-slate-900" title={displayName}>{displayName}</span>
            {accountLine && <span className={cn("block truncate text-xs leading-4 text-slate-500", open && "text-slate-600")} title={accountLine}>{accountLine}</span>}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
        </>
      )}
    </button>
  );

  return (
    <>
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        placement={collapsed ? 'rightBottom' : 'top'}
        className="w-60"
        menu={{
          items: [
            appConfig.helpUrl ? { key: 'help', label: t('layout.help'), icon: <BookOpen />, onClick: () => window.open(appConfig.helpUrl, '_blank', 'noopener,noreferrer') } : null,
            canUseAgent ? { key: 'agent-preferences', label: t('agentEntry.preferences'), icon: <SquareTerminal />, onClick: () => setPreferencesOpen(true) } : null,
            { key: 'password', label: t('auth.changePassword'), icon: <KeyRound />, onClick: () => setPasswordModalOpen(true) },
            { key: 'logout', label: t('layout.logout'), icon: <LogOut />, danger: true, onClick: handleLogout },
          ],
        }}
        popupRender={(menu) => (
          <>
            <div className="mb-1 border-b border-line-soft px-2.5 pb-2.5 pt-1.5">
              <div className="truncate text-13 font-medium text-slate-900">{displayName}</div>
              {user?.email && <div className="truncate text-xs text-slate-500">{user.email}</div>}
            </div>
            <DropdownItem className={menuItemClass} onSelect={() => { setOpen(false); navigate('/profile'); }}>
              <User /><span className="min-w-0 flex-1 truncate">{t('profile.title')}</span>
            </DropdownItem>
            <LocaleSubmenu />
            {menu}
          </>
        )}
      >
        {collapsed ? <Tooltip title={displayName} placement="right">{trigger}</Tooltip> : trigger}
      </Dropdown>

      {preferencesOpen && canUseAgent ? <AgentPreferencesDialog returnFocusRef={triggerRef} onClose={() => setPreferencesOpen(false)} /> : null}
      <PasswordChangeModal returnFocusRef={triggerRef} open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} onPasswordChanged={handleLogout} />
    </>
  );
};
