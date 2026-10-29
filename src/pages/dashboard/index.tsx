import { useDataChanged } from '@/hooks/useDataChanged';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import dayjs from 'dayjs';
import { dashboardService } from '@/api/services/dashboardService';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Icon } from '@/components/icon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { Alert } from '@/ui/controls';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { preloadRoute } from '@/routes/routeModules';
import type { DashboardData } from '@/types';

const METRICS = [
  { key: 'totalUsers', label: '用户总数', icon: 'users', unit: '人' },
  { key: 'activeUsers', label: '已启用用户', icon: 'user-check', unit: '人' },
  { key: 'totalRoles', label: '系统角色', icon: 'shield-check', unit: '个' },
  { key: 'totalMenus', label: '功能页面', icon: 'layout-grid', unit: '个' },
] as const;

export const DashboardPage: React.FC = () => {
  const userName = useAuthStore((state) => state.user?.user_name);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useDataChanged(() => setAttempt((value) => value + 1));
  useEffect(() => {
    let active = true;
    setError('');
    dashboardService.getOverview().then((result) => { if (active) setStats(result.data); })
      .catch((cause: Error) => { if (active) setError(cause.message || '加载概览失败'); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <div className="h-full min-h-0 min-w-0 w-full overflow-y-auto overscroll-contain">
      <PageHeader title="概览" description={`${userName || '你好'}，欢迎回来。这里是您的管理工作台。`} />
      {error && <Alert type="error" title={error} action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>重试</Button>} className="mb-5" />}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        {METRICS.map((metric) => !stats ? <Skeleton key={metric.key} className="h-[108px] rounded-2xl" /> : (
          <div key={metric.key} className="rounded-2xl border border-[#E6EAF0] bg-white px-6 py-5 shadow-card">
            <div className="flex items-center justify-between text-13 text-slate-500">{metric.label}<Icon icon={metric.icon} size={18} className="text-slate-400" /></div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-mono text-[28px] font-semibold leading-8 tracking-tight tabular-nums text-slate-900">{stats[metric.key].toLocaleString()}</span>
              <span className="text-xs text-slate-500">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>待办与快捷入口</CardTitle><CardDescription>从常用操作开始今天的工作</CardDescription></div><Icon icon="list-checks" size={18} className="text-slate-400" /></CardHeader>
          <CardContent className="space-y-2 p-4">
            {!stats ? [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-[76px] rounded-xl" />) : stats.todos.map((todo) => (
              <Link key={todo.id} to={todo.route} onPointerEnter={() => void preloadRoute(todo.route)} onFocus={() => void preloadRoute(todo.route)}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-4 transition-colors hover:border-line hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500"><Icon icon={todo.icon} size={18} /></span>
                <span className="min-w-0 flex-1"><span className="block text-13 font-medium text-slate-800">{todo.title}</span><span className="mt-0.5 block text-xs text-slate-500">{todo.description}</span></span>
                <Icon icon="arrow-right" size={16} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>最近动态</CardTitle><CardDescription>用户、权限与系统配置的近期变更</CardDescription></div><Icon icon="clock" size={18} className="text-slate-400" /></CardHeader>
          <CardContent className="divide-y divide-line-soft px-6 py-1">
            {!stats ? [0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="my-5 h-12" />) : stats.activities.length ? stats.activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-4">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400"><Icon icon={activity.icon} size={16} /></span>
                <div className="min-w-0 flex-1"><p className="text-13 text-slate-700"><span className="font-medium text-slate-900">{activity.actor}</span> {activity.action}</p>
                  <time className="mt-1 block font-mono text-[11px] text-slate-500" title={dayjs(activity.time).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(activity.time).format('YYYY-MM-DD HH:mm')}</time>
                </div>
              </div>
            )) : <EmptyState title="暂无动态" minHeight={220} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
