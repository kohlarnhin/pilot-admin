import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import dayjs from 'dayjs';
import { t, useT } from '@/i18n';
import { exampleProjectService, type ExampleProjectDetail } from '@/api/services/exampleProjectService';
import { ApiRequestError } from '@/api/errors';
import { useDataChanged } from '@/hooks/useDataChanged';
import { Access } from '@/components/common/Access';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { CopyButton } from '@/components/common/CopyButton';
import { Icon } from '@/components/icon';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { Alert, Tag } from '@/ui/controls';
import { Popconfirm } from '@/ui/popover';
import { message } from '@/ui/message';
import { Skeleton } from '@/ui/skeleton';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectHistory } from './ProjectHistory';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  return <ProjectDetail key={id} id={id} />;
}

function ProjectDetail({ id }: { id: string }) {
  const { locale } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const listSearch = typeof location.state?.listSearch === 'string' && location.state.listSearch.startsWith('?') ? location.state.listSearch : '';
  const backPath = `/examples/crud${listSearch}`;
  const [project, setProject] = useState<ExampleProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setError('');
    void exampleProjectService.getProject(id).then((result) => {
      if (!active) return;
      setProject(result.data);
      setNotFound(false);
    }).catch((cause) => {
      if (!active) return;
      if (cause instanceof ApiRequestError && cause.status === 404) {
        setProject(null);
        setNotFound(true);
      } else setError((cause as Error).message || t('exampleProjects.errors.load'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, locale, refreshToken]);
  const refresh = () => setRefreshToken((value) => value + 1);
  useDataChanged(refresh);
  const remove = async () => {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    try {
      await exampleProjectService.deleteProject(id);
      if (mounted.current) {
        message.success(t('exampleProjects.toast.deleted'));
        navigate(backPath);
      }
    } catch (cause) {
      if (mounted.current) message.error((cause as Error).message || t('common.toast.actionFailed'));
    } finally {
      deleteLock.current = false;
      if (mounted.current) setDeleting(false);
    }
  };
  const status = project ? <Tag color={project.status === 'active' ? 'success' : project.status === 'paused' ? 'warning' : undefined} dot={project.status !== 'archived'}>{t(`exampleProjects.status.${project.status}`)}</Tag> : null;
  const metadata = project ? [
    [t('exampleProjects.fields.owner'), project.owner],
    [t('common.columns.status'), status],
    [t('exampleProjects.detail.createdBy'), <span title={project.create_by}>{project.create_by_name}</span>],
    [t('common.columns.created'), <time dateTime={project.create_date}>{dayjs(project.create_date).format('YYYY-MM-DD HH:mm:ss')}</time>],
    [t('exampleProjects.detail.updatedBy'), <span title={project.last_update_by}>{project.last_update_by_name}</span>],
    [t('common.columns.updated'), <time dateTime={project.last_update_date}>{dayjs(project.last_update_date).format('YYYY-MM-DD HH:mm:ss')}</time>],
  ] : [];

  return <div className="flex h-full min-h-0 min-w-0 flex-col">
    <PageHeader title={project?.name || t('exampleProjects.detail.title')} onBack={() => navigate(backPath)} backLabel={t('exampleProjects.detail.back')} meta={status}
      description={project ? <span className="inline-flex items-center gap-1.5"><code className="font-mono text-xs">{project.code}</code><CopyButton text={project.code} /></span> : undefined}
      actions={project ? <>
        <Access permission="example:update"><Button disabled={deleting} onClick={() => setEditing(true)}><Icon icon="pencil" size={16} />{t('common.actions.edit')}</Button></Access>
        <Access permission="example:delete"><Popconfirm title={t('button.exampleDelete')} description={t('exampleProjects.deleteDialog.content', { name: project.name })} okType="danger" okText={t('common.actions.confirmDelete')} onConfirm={remove}><Button variant="danger" loading={deleting}><Icon icon="trash-2" size={16} />{t('common.actions.delete')}</Button></Popconfirm></Access>
      </> : undefined} />
    {error ? <Alert type="error" title={error} action={<Button size="xs" onClick={refresh}>{t('common.actions.retry')}</Button>} className="mb-4 shrink-0" /> : null}
    {loading ? <Card className="min-h-0 flex-1 p-6"><div className="grid shrink-0 grid-cols-3 gap-5">{[0, 1, 2, 3, 4, 5].map((key) => <div key={key} className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-3/4" /></div>)}</div><div className="min-h-0 flex-1 space-y-4 overflow-hidden border-y border-line-soft py-6 my-6"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-2/3" /></div><div className="h-[180px] shrink-0 space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></Card> : notFound ? <Card className="min-h-0 flex-1 items-center justify-center"><EmptyState icon="package" title={t('exampleProjects.detail.notFound')} /><Link to={backPath} className="mb-8 rounded text-13 text-slate-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">{t('exampleProjects.detail.back')}</Link></Card> : project ? <Card className="min-h-0 flex-1">
      <div data-slot="project-detail-column" className="flex min-h-0 flex-1 flex-col overflow-hidden [@media(max-height:640px)]:overflow-y-auto">
        <section className="shrink-0 border-b border-line-soft bg-slate-50/40 px-6 py-5" aria-label={t('exampleProjects.detail.metadata')}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 xl:grid-cols-3">{metadata.map(([label, value], index) => <div key={index} className="min-w-0"><dt className="mb-1 text-xs text-slate-400">{label}</dt><dd className="break-words text-13 leading-5 text-slate-700">{value}</dd></div>)}</dl>
        </section>
        <section className="flex min-h-[96px] flex-[0_1_auto] flex-col px-6 py-4 [@media(max-height:640px)]:min-h-[220px] [@media(max-height:640px)]:flex-none">
          <h2 id="project-description-title" className="shrink-0 text-13 font-medium text-slate-900">{t('exampleProjects.fields.description')}</h2>
          <div data-slot="project-description-scroll" role="region" aria-labelledby="project-description-title" tabIndex={0} className="mt-3 min-h-0 flex-auto overflow-y-auto overscroll-contain whitespace-pre-wrap break-words pr-3 text-13 leading-6 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 [@media(max-height:640px)]:flex-1">{project.description || t('exampleProjects.detail.noDescription')}</div>
        </section>
        <ProjectHistory id={id} refreshToken={refreshToken} />
      </div>
    </Card> : <Card className="min-h-0 flex-1"><EmptyState icon="package" title={t('exampleProjects.errors.load')} /></Card>}
    {editing && project ? <ProjectFormModal project={project} onClose={() => setEditing(false)} onSaved={refresh} /> : null}
  </div>;
}
