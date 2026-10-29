import { usePermission } from '@/hooks/usePermission';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, ChevronsUpDown, KeyRound, LogOut, SquareTerminal } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { appConfig } from '@/config/app';
import { Dropdown } from '@/ui/dropdown';
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
  const user = useAuthStore((state) => state.user);
  const canUseAgent = usePermission('agent:use');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
    message.info('已退出登录');
  };

  const displayName = user?.user_name || '当前用户';
  const accountLine = user?.login_name ? `@${user.login_name}` : user?.email || '';
  const fallbackChar = user?.user_name ? user.user_name.slice(0, 1) : '平';

  const avatar = (
    <Avatar className="size-8 shrink-0">
      {user?.avatar ? (
        <img className="size-full rounded-full object-cover" src={user.avatar} alt="" />
      ) : (
        <AvatarFallback className="text-13">{fallbackChar}</AvatarFallback>
      )}
    </Avatar>
  );

  const trigger = (
    <button
      type="button"
      aria-label="账号菜单"
      className={cn(
        'flex w-full cursor-pointer select-none items-center gap-2.5 rounded-lg text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300',
        collapsed ? 'justify-center p-1.5' : 'px-2 py-1.5',
        open ? 'bg-slate-100' : 'hover:bg-slate-50'
      )}
    >
      {avatar}
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-13 font-medium leading-5 text-slate-900" title={displayName}>{displayName}</span>
            {accountLine && <span className="block truncate text-xs leading-4 text-slate-400" title={accountLine}>{accountLine}</span>}
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
            appConfig.helpUrl ? { key: 'help', label: '使用手册', icon: <BookOpen />, onClick: () => window.open(appConfig.helpUrl, '_blank', 'noopener,noreferrer') } : null,
            canUseAgent ? { key: 'agent-preferences', label: 'Agent 模式偏好', icon: <SquareTerminal />, onClick: () => setPreferencesOpen(true) } : null,
            { key: 'password', label: '修改密码', icon: <KeyRound />, onClick: () => setPasswordModalOpen(true) },
            { key: 'logout', label: '退出登录', icon: <LogOut />, danger: true, onClick: handleLogout },
          ],
        }}
        popupRender={(menu) => (
          <>
            <div className="mb-1 border-b border-line-soft px-2.5 pb-2.5 pt-1.5">
              <div className="truncate text-13 font-medium text-slate-900">{displayName}</div>
              {user?.email && <div className="truncate text-xs text-slate-400">{user.email}</div>}
            </div>
            {menu}
          </>
        )}
      >
        {collapsed ? <Tooltip title={displayName} placement="right"><span className="block">{trigger}</span></Tooltip> : trigger}
      </Dropdown>

      {preferencesOpen && canUseAgent ? <AgentPreferencesDialog onClose={() => setPreferencesOpen(false)} /> : null}
      <PasswordChangeModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} onPasswordChanged={handleLogout} />
    </>
  );
};
