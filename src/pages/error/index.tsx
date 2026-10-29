import { t, tNode, useT } from '@/i18n';
import React from 'react';
import { Button } from '@/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { StatusPage } from './StatusPage';

const HomeButton: React.FC = () => {
  useT();
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate('/')}>
      <ArrowLeft className="size-4" />
      {t('common.actions.home')}
    </Button>
  );
};

export const Page403: React.FC = () => {
  useT();
  const { roles } = useAuthStore();
  const currentRoleCode = roles[0] || '';

  return (
    <StatusPage
      code="403"
      icon="shield-check"
      title={t('errors.forbiddenTitle')}
      actions={<HomeButton />}
      description={tNode('errors.forbiddenDescription', {
        role: currentRoleCode ? <strong className="font-medium text-slate-700">{currentRoleCode}</strong> : '',
      })}
    />
  );
};

export const Page404: React.FC = () => {
  useT();
  return (
    <StatusPage
      code="404"
      icon="map-pin"
      title={t('errors.notFoundTitle')}
      description={t('errors.notFoundDescription')}
      actions={<HomeButton />}
    />
  );
};
