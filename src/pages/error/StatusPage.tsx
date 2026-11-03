import type React from 'react';
import { Result } from '@/components/common/Result';

interface StatusPageProps {
  code: string;
  icon: string;
  title: string;
  description: React.ReactNode;
  actions: React.ReactNode;
  fullScreen?: boolean;
  children?: React.ReactNode;
}

export const StatusPage: React.FC<StatusPageProps> = ({
  code, icon, title, description, actions, fullScreen = false, children,
}) => (
  <div className={`flex w-full flex-col items-center overflow-y-auto p-6 text-center ${fullScreen ? 'min-h-svh bg-white' : 'h-full min-h-[60vh]'}`}>
    <Result status={code === '403' ? '403' : code === '404' ? '404' : '500'} code={code} icon={icon}
      title={title} description={description} extra={actions} headingLevel={1} className="my-auto">{children}</Result>
  </div>
);
