import React from 'react';
import { Button } from '@/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { StatusPage } from './StatusPage';

const HomeButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate('/')}>
      <ArrowLeft className="size-4" />
      返回首页
    </Button>
  );
};

export const Page403: React.FC = () => {
  const { roles } = useAuthStore();
  const currentRoleCode = roles[0] || '';

  return (
    <StatusPage
      code="403"
      icon="shield-check"
      title="暂无此模块访问权限"
      actions={<HomeButton />}
      description={
        <>
          当前角色 {currentRoleCode && <strong className="font-medium text-slate-700">{currentRoleCode}</strong>}{' '}
          未被授予此菜单或功能模块的权限，如需访问请联系管理员。
        </>
      }
    />
  );
};

export const Page404: React.FC = () => (
  <StatusPage
    code="404"
    icon="map-pin"
    title="页面不存在"
    description="您访问的页面路径不存在或已迁移。"
    actions={<HomeButton />}
  />
);
