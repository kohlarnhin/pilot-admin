import { formatNumber, t, useT } from '@/i18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, type ButtonProps } from '@/ui/button';
import { Input, SearchInput } from '@/ui/input';
import { Select } from '@/ui/select';
import { Alert, Checkbox, InputNumber, Progress, Switch, Tag, type TagColor } from '@/ui/controls';
import { Badge, CodeTag, type BadgeProps } from '@/ui/badge';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { Card, CardBar, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardToolbar, ListToolbar } from '@/ui/card';
import { Tabs, SectionBar } from '@/ui/tabs';
import { Tooltip } from '@/ui/tooltip';
import { Popconfirm, Popover } from '@/ui/popover';
import { Dropdown } from '@/ui/dropdown';
import { Drawer, Modal } from '@/ui/modal';
import { Form } from '@/ui/form';
import { message } from '@/ui/message';
import { Skeleton } from '@/ui/skeleton';
import { Spin, Spinner } from '@/ui/spinner';
import { FileDropZone } from '@/ui/file-drop-zone';
import { DataTable, TableSkeleton, type Key } from '@/ui/data-table';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Separator } from '@/ui/separator';
import { WorkbenchCrumbs } from '@/ui/breadcrumb';
import { RowAction, RowActions } from '@/ui/row-action';
import { RadioGroup, Segmented } from '@/ui/radio';
import { DatePicker } from '@/ui/date-picker';
import { Descriptions } from '@/ui/descriptions';
import { Timeline } from '@/ui/timeline';
import { Steps, type StepItem } from '@/components/common/Steps';
import dayjs from 'dayjs';
import { CalendarDays, LayoutGrid, List } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { CopyButton } from '@/components/common/CopyButton';
import { FixedTable } from '@/components/common/FixedTable';
import { Kbd } from '@/components/common/Kbd';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';

function Example({ id, title, description, children, wide = false }: { id: string; title: string; description: string; children: React.ReactNode; wide?: boolean }) {
  return <Card id={id} className={wide ? 'col-span-2' : ''}>
    <CardHeader className="shrink-0"><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div></CardHeader>
    <CardContent className="min-w-0 space-y-5">{children}</CardContent>
  </Card>;
}

const DEMO_ROWS = [
  { id: 'DEMO-001', name: 'gallery.demoRows.projectName', owner: 'gallery.demoRows.projectOwner', status: 'completed', statusLabel: 'common.status.completed' },
  { id: 'DEMO-002', name: 'gallery.demoRows.reviewName', owner: 'gallery.demoRows.reviewOwner', status: 'active', statusLabel: 'gallery.demoRows.inProgress' },
  { id: 'DEMO-003', name: 'gallery.demoRows.releaseName', owner: 'gallery.demoRows.releaseOwner', status: 'pending', statusLabel: 'gallery.demoRows.notStarted' },
] as const;

const SECTIONS = [
  ['gallery-buttons', 'gallery.buttons.title'], ['gallery-inputs', 'gallery.inputs.title'], ['gallery-selects', 'gallery.selection.title'],
  ['gallery-radio', 'gallery.radio.title'], ['gallery-date', 'gallery.date.title'], ['gallery-badges', 'gallery.badges.title'], ['gallery-alerts', 'gallery.feedback.title'], ['gallery-tabs', 'gallery.overlays.title'],
  ['gallery-overlays', 'gallery.dialogs.title'], ['gallery-form', 'gallery.form.title'], ['gallery-files', 'gallery.files.title'],
  ['gallery-loading', 'gallery.loading.title'], ['gallery-cards', 'gallery.cards.title'],
  ['gallery-steps', 'gallery.steps.title'], ['gallery-descriptions', 'gallery.descriptions.title'], ['gallery-table', 'gallery.tables.title'],
  ['gallery-page-skeleton', 'gallery.skeletons.title'],
] as const;
type SectionId = typeof SECTIONS[number][0];
const SPY_OFFSET = 24;

/** 悬浮目录：随滚动高亮当前分区，点击在滚动容器内定位；窄屏收为右下角按钮。 */
function GalleryToc({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const [active, setActive] = useState<SectionId>(SECTIONS[0][0]);
  const [open, setOpen] = useState(false);
  const pinned = useRef<SectionId | null>(null);
  // 点击跳转期间暂停滚动跟随，滚动停稳后再计算，避免高亮扫过途经分区。
  const jumping = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const compactRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!compactRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const update = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) { setActive(SECTIONS[SECTIONS.length - 1][0]); return; }
    // 双列网格里同一行的卡片顶部相同：默认取该行第一张，点击过同行的另一张时保留点击项。
    let current: SectionId = SECTIONS[0][0];
    let currentTop = -Infinity;
    for (const [id] of SECTIONS) {
      const element = document.getElementById(id);
      if (element && element.offsetTop - container.scrollTop <= SPY_OFFSET && element.offsetTop > currentTop) {
        current = id;
        currentTop = element.offsetTop;
      }
    }
    const pinnedElement = pinned.current ? document.getElementById(pinned.current) : null;
    if (pinned.current && pinnedElement?.offsetTop === currentTop) current = pinned.current;
    else pinned.current = null;
    setActive(current);
  }, [scrollRef]);
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let frame = 0;
    const onScroll = () => {
      if (jumping.current) {
        window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => { jumping.current = false; update(); }, 120);
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(settleTimer.current); container.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [scrollRef, update]);
  const jump = (id: SectionId) => {
    const container = scrollRef.current;
    const element = document.getElementById(id);
    if (!container || !element) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollTo({ top: Math.max(0, element.offsetTop - 4), behavior: reduce ? 'auto' : 'smooth' });
    pinned.current = id;
    jumping.current = true;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => { jumping.current = false; update(); }, 150);
    setActive(id);
    setOpen(false);
  };
  const list = (compact: boolean) => <ol className="space-y-0.5">
    {SECTIONS.map(([id, title]) => <li key={id}>
      <button type="button" aria-current={active === id ? 'location' : undefined} onClick={() => jump(id)}
        className={cn('relative block w-full truncate rounded-md py-1.5 pl-3 pr-2 text-left text-13 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          active === id ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
          !compact && active === id && 'before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-500')}>{t(title)}</button>
    </li>)}
  </ol>;
  return <>
    <nav aria-label={t('gallery.toc.title')} data-slot="gallery-toc" className="hidden w-48 shrink-0 xl:block">
      <div className="rounded-xl border border-line bg-white p-2 shadow-sm">
        <p className="px-3 pb-1.5 pt-1 text-xs font-medium text-slate-400">{t('gallery.toc.title')}</p>
        {list(false)}
      </div>
    </nav>
    <div ref={compactRef} className="fixed bottom-6 right-6 z-30 xl:hidden" data-slot="gallery-toc-compact">
      {open ? <nav aria-label={t('gallery.toc.title')} className="absolute bottom-12 right-0 max-h-[min(70vh,480px)] w-56 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-lg">{list(true)}</nav> : null}
      <Button size="icon" aria-label={t('gallery.toc.open')} aria-expanded={open} onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }} className="rounded-full bg-white shadow-md"><Icon icon={open ? 'x' : 'list-tree'} size={18} /></Button>
    </div>
  </>;
}

export const ComponentsPage: React.FC = () => {
  useT();
  const demoRows = DEMO_ROWS.map((row) => ({ ...row, name: t(row.name), owner: t(row.owner), statusLabel: t(row.statusLabel) }));
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [select, setSelect] = useState<string>('one');
  const [multi, setMulti] = useState<string[]>(['one']);
  const [checked, setChecked] = useState(true);
  const [switchOn, setSwitchOn] = useState(true);
  const [number, setNumber] = useState<number | null>(3);
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState(false);
  const [asyncModal, setAsyncModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [keys, setKeys] = useState<Key[]>([]);
  const [tableState, setTableState] = useState<'data' | 'loading' | 'empty'>('data');
  const [form] = Form.useForm();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');
  const [notice, setNotice] = useState<'inbox' | 'email' | 'none'>('inbox');
  const [view, setView] = useState<'list' | 'board' | 'calendar'>('list');
  const [date, setDate] = useState<string | null>(null);
  const [due, setDue] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const options = [{ value: 'one', label: t('gallery.options.first') }, { value: 'two', label: t('gallery.options.second') }, { value: 'three', label: t('gallery.options.disabled'), disabled: true }];
  const variants: NonNullable<ButtonProps['variant']>[] = ['outline', 'primary', 'secondary', 'ghost', 'subtle', 'link', 'danger', 'destructive'];

  return <div className="flex h-full min-h-0 min-w-0 flex-col">
    <PageHeader title={t('menu.components')} description={t('gallery.description')} actions={<span className="text-xs text-slate-500">{t('gallery.searchShortcut')}<Kbd className="border-slate-200 bg-slate-50 text-slate-500">⌘ / Ctrl K</Kbd></span>} />
    <div className="flex min-h-0 min-w-0 flex-1 gap-5">
    <div ref={scrollRef} data-slot="gallery-scroll" className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1">
      <div className="grid grid-cols-2 items-start gap-5 pb-1">
        <Example id="gallery-buttons" title={t('gallery.buttons.title')} description={t('gallery.buttons.description')} wide>
          <div className="flex flex-wrap items-center gap-3">{variants.map((variant) => <Button key={variant} variant={variant}>{variant}</Button>)}</div>
          <div className="flex flex-wrap items-center gap-3"><Button size="xs">{t('gallery.buttons.small')}</Button><Button size="sm">{t('gallery.buttons.toolbar')}</Button><Button>{t('gallery.buttons.standard')}</Button><Button size="lg">{t('gallery.buttons.large')}</Button><Button size="icon" aria-label={t('gallery.buttons.add')}><Icon icon="plus" size={18} /></Button><Button disabled>{t('gallery.buttons.disabled')}</Button><Button loading>{t('gallery.buttons.saving')}</Button><Button pressed>{t('gallery.buttons.selected')}</Button>
            <RowActions><RowAction icon="pencil" label={t('gallery.buttons.editLabel')} onClick={() => message.info(t('gallery.buttons.editToast'))} /><RowAction icon="trash-2" label={t('gallery.buttons.deleteLabel')} tone="danger" onClick={() => message.warning(t('gallery.buttons.deleteToast'))} /><RowAction icon="lock" label={t('gallery.buttons.unavailableLabel')} disabled disabledReason={t('gallery.buttons.unavailableHint')} /></RowActions>
          </div>
        </Example>
        <Example id="gallery-inputs" title={t('gallery.inputs.title')} description={t('gallery.inputs.description')}>
          <Input value={text} onChange={(event) => setText(event.target.value)} placeholder={t('gallery.inputs.textPlaceholder')} allowClear aria-label={t('gallery.inputs.textLabel')} />
          <Input.Password placeholder={t('gallery.inputs.passwordPlaceholder')} aria-label={t('gallery.inputs.passwordLabel')} />
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onPressEnter={() => message.info(t('gallery.inputs.searchToast', { query: search || t('gallery.inputs.searchAll') }))} placeholder={t('gallery.inputs.searchLabel')} aria-label={t('gallery.inputs.searchLabel')} />
          <div className="grid grid-cols-2 gap-3"><Input disabled placeholder={t('gallery.inputs.disabledPlaceholder')} aria-label={t('gallery.inputs.disabledLabel')} /><Input value={t('gallery.inputs.readOnlyValue')} readOnly aria-label={t('gallery.inputs.readOnlyLabel')} /></div>
          <Input status="error" aria-invalid aria-label={t('gallery.inputs.errorLabel')} placeholder={t('gallery.inputs.errorPlaceholder')} />
          <Input.TextArea rows={2} placeholder={t('gallery.inputs.multilinePlaceholder')} aria-label={t('gallery.inputs.multilineLabel')} />
        </Example>
        <Example id="gallery-selects" title={t('gallery.selection.title')} description={t('gallery.selection.description')}>
          <div className="grid grid-cols-2 gap-3"><Select aria-label={t('gallery.selection.searchLabel')} value={select} onChange={setSelect} options={options} showSearch /><Select aria-label={t('gallery.selection.disabledLabel')} disabled placeholder={t('gallery.selection.disabledLabel')} options={options} /></div>
          <Select aria-label={t('gallery.selection.multiPlaceholder')} mode="multiple" value={multi} onChange={setMulti} options={options} placeholder={t('gallery.selection.multiPlaceholder')} />
          <Select aria-label={t('gallery.selection.loadingPlaceholder')} loading placeholder={t('gallery.selection.loadingPlaceholder')} options={[]} />
          <div className="flex flex-wrap gap-4"><Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)}>{t('gallery.selection.checkedLabel')}</Checkbox><Checkbox indeterminate checked={false}>{t('gallery.selection.partialLabel')}</Checkbox><Checkbox disabled checked>{t('gallery.selection.disabledCheckbox')}</Checkbox></div>
          <Checkbox.Group value={multi} onChange={(values) => setMulti(values.map(String))} className="flex gap-4"><Checkbox value="one">{t('gallery.selection.firstGroup')}</Checkbox><Checkbox value="two">{t('gallery.selection.secondGroup')}</Checkbox></Checkbox.Group>
          <div className="flex flex-wrap items-center gap-5"><Switch aria-label={t('gallery.selection.switchLabel')} checked={switchOn} onChange={setSwitchOn} /><Switch aria-label={t('gallery.selection.offLabel')} /><Switch aria-label={t('gallery.selection.disabledSwitch')} checked disabled /><Switch aria-label={t('gallery.selection.loadingSwitch')} checked loading /><InputNumber aria-label={t('gallery.selection.numberLabel')} id="gallery-number" min={0} max={10} value={number} onChange={setNumber} className="w-28" /></div>
        </Example>
        <Example id="gallery-radio" title={t('gallery.radio.title')} description={t('gallery.radio.description')}>
          <RadioGroup aria-label={t('gallery.radio.planLabel')} value={plan} onChange={setPlan} options={[{ value: 'basic', label: t('gallery.radio.planBasic') }, { value: 'pro', label: t('gallery.radio.planPro') }, { value: 'enterprise', label: t('gallery.radio.planEnterprise'), disabled: true }]} />
          <RadioGroup aria-label={t('gallery.radio.noticeLabel')} direction="vertical" value={notice} onChange={setNotice} options={[{ value: 'inbox', label: t('gallery.radio.noticeInbox'), description: t('gallery.radio.noticeInboxHint') }, { value: 'email', label: t('gallery.radio.noticeEmail'), description: t('gallery.radio.noticeEmailHint') }, { value: 'none', label: t('gallery.radio.noticeNone'), description: t('gallery.radio.noticeNoneHint') }]} />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented aria-label={t('gallery.radio.viewLabel')} value={view} onChange={setView} options={[{ value: 'list', label: t('gallery.radio.viewList'), icon: <List size={14} aria-hidden="true" /> }, { value: 'board', label: t('gallery.radio.viewBoard'), icon: <LayoutGrid size={14} aria-hidden="true" /> }, { value: 'calendar', label: t('gallery.radio.viewCalendar'), icon: <CalendarDays size={14} aria-hidden="true" /> }]} />
            <span className="text-xs text-slate-500">{t('gallery.radio.currentView', { view: t(view === 'list' ? 'gallery.radio.viewList' : view === 'board' ? 'gallery.radio.viewBoard' : 'gallery.radio.viewCalendar') })}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Segmented aria-label={t('gallery.radio.rangeLabel')} size="small" block defaultValue="week" options={[{ value: 'day', label: t('gallery.radio.rangeDay') }, { value: 'week', label: t('gallery.radio.rangeWeek') }, { value: 'month', label: t('gallery.radio.rangeMonth') }]} />
            <Segmented aria-label={t('gallery.radio.disabledLabel')} size="small" block disabled defaultValue="day" options={[{ value: 'day', label: t('gallery.radio.rangeDay') }, { value: 'week', label: t('gallery.radio.rangeWeek') }]} />
          </div>
        </Example>
        <Example id="gallery-date" title={t('gallery.date.title')} description={t('gallery.date.description')}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div className="min-w-0 space-y-1.5"><p className="text-xs text-slate-500">{t('gallery.date.basicLabel')}</p><DatePicker aria-label={t('gallery.date.basicLabel')} value={date} onChange={setDate} /></div>
            <div className="min-w-0 space-y-1.5"><p className="text-xs text-slate-500">{t('gallery.date.rangedLabel')}</p><DatePicker aria-label={t('gallery.date.rangedLabel')} aria-describedby="gallery-date-ranged-hint" value={due} onChange={setDue} min={dayjs().format('YYYY-MM-DD')} max={dayjs().add(30, 'day').format('YYYY-MM-DD')} /></div>
            <div className="min-w-0 space-y-1.5"><p className="text-xs text-slate-500">{t('gallery.date.disabledLabel')}</p><DatePicker aria-label={t('gallery.date.disabledLabel')} disabled defaultValue="2026-11-20" /></div>
            <div className="min-w-0 space-y-1.5"><p className="text-xs text-slate-500">{t('gallery.date.errorLabel')}</p><DatePicker aria-label={t('gallery.date.errorLabel')} status="error" aria-describedby="gallery-date-error-hint" /><p id="gallery-date-error-hint" className="text-xs text-red-600">{t('gallery.date.errorHint')}</p></div>
          </div>
          <p id="gallery-date-ranged-hint" className="text-xs text-slate-500">{t('gallery.date.rangedHint')}</p>
          <p role="status" className="text-xs text-slate-600">{date ? t('gallery.date.selected', { date }) : t('gallery.date.none')}</p>
        </Example>
        <Example id="gallery-badges" title={t('gallery.badges.title')} description={t('gallery.badges.description')}>
          <div className="flex flex-wrap gap-2">{(['default', 'secondary', 'outline', 'info', 'warning', 'success', 'error', 'destructive'] as NonNullable<BadgeProps['variant']>[]).map((variant) => <Badge key={variant} variant={variant}>{variant}</Badge>)}<Badge shape="circle">{t('gallery.badges.round')}</Badge></div>
          <div className="flex flex-wrap gap-2">{(['default', 'success', 'warning', 'error', 'processing', 'indigo'] as TagColor[]).map((color) => <Tag dot color={color} key={color}>{color}</Tag>)}</div>
          <div className="flex items-center gap-4"><Avatar><AvatarFallback>{t('gallery.badges.avatarFallback')}</AvatarFallback></Avatar><Avatar className="size-10"><AvatarFallback>PL</AvatarFallback></Avatar><CodeTag>RESOURCE-001</CodeTag><CopyButton text="RESOURCE-001" tip={t('gallery.badges.copyLabel')} /></div>
          <Progress aria-label={t('gallery.badges.activeProgress')} percent={68} status="active" /><Progress aria-label={t('gallery.badges.completedProgress')} percent={100} strokeColor="#10B981CC" /><Progress aria-label={t('gallery.badges.failedProgress')} percent={32} status="exception" />
        </Example>
        <Example id="gallery-alerts" title={t('gallery.feedback.title')} description={t('gallery.feedback.description')}>
          <div className="space-y-2"><Alert type="info" title={t('gallery.feedback.info')} description={t('gallery.feedback.infoDescription')} /><Alert type="success" title={t('gallery.feedback.success')} /><Alert type="warning" title={t('gallery.feedback.warning')} /><Alert type="error" title={t('gallery.feedback.error')} /></div>
          <div className="flex flex-wrap gap-2">{(['info', 'success', 'warning', 'error'] as const).map((kind) => <Button key={kind} size="sm" onClick={() => message[kind](t('gallery.feedback.toastMessage', { kind: kind }))}>{kind} {t('gallery.feedback.toastSuffix')}</Button>)}<Button size="sm" onClick={() => { const id = message.loading(t('gallery.feedback.processing')); window.setTimeout(() => { message.destroy(id); message.success(t('gallery.feedback.completed')); }, 1000); }}>{t('gallery.feedback.loadingAction')}</Button></div>
        </Example>
        <Example id="gallery-tabs" title={t('gallery.overlays.title')} description={t('gallery.overlays.description')}>
          <Tabs items={[{ key: 'overview', label: t('menu.dashboard') }, { key: 'details', label: t('gallery.tabs.details'), count: 3 }, { key: 'history', label: t('gallery.tabs.history') }]} value={tab} onChange={setTab} />
          <SectionBar description={tab === 'overview' ? t('gallery.tabs.overviewContent') : tab === 'details' ? t('gallery.tabs.detailsContent') : t('gallery.tabs.historyContent')} actions={<Button size="xs" onClick={() => message.info(t('gallery.overlays.sectionAction'))}>{t('gallery.overlays.sectionAction')}</Button>} />
          <div className="flex flex-wrap gap-3"><Tooltip title={t('gallery.overlays.tooltipContent')}><Button size="sm">{t('gallery.overlays.tooltipLabel')}</Button></Tooltip><Popover trigger="click" title={t('gallery.overlays.popoverTitle')} content={<p className="text-xs leading-5">{t('gallery.overlays.popoverContent')}</p>}><Button size="sm">{t('gallery.overlays.openPopover')}</Button></Popover>
            <Dropdown menu={{ items: [{ key: 'edit', label: t('common.actions.edit'), onClick: () => message.info(t('gallery.overlays.editToast')) }, { key: 'disabled', label: t('gallery.buttons.unavailableLabel'), disabled: true }, { key: 'divider', type: 'divider' }, { key: 'delete', label: t('common.actions.delete'), danger: true, onClick: () => message.warning(t('gallery.overlays.deleteToast')) }] }}><Button size="sm">{t('gallery.overlays.dropdown')}<Icon icon="chevron-down" size={14} /></Button></Dropdown>
            <Popconfirm title={t('gallery.overlays.confirmTitle')} description={t('gallery.overlays.confirmContent')} onConfirm={() => message.success(t('gallery.overlays.confirmed'))}><Button size="sm">{t('gallery.overlays.confirmLabel')}</Button></Popconfirm>
          </div>
          <Tooltip title={t('gallery.overlays.ellipsisText')}><span tabIndex={0} className="block w-44 truncate text-13 text-slate-600" title={t('gallery.overlays.ellipsisText')}>{t('gallery.overlays.ellipsisText')}</span></Tooltip>
        </Example>
        <Example id="gallery-overlays" title={t('gallery.dialogs.title')} description={t('gallery.dialogs.description')}>
          <div className="flex flex-wrap gap-3"><Button onClick={() => setModal(true)}>{t('gallery.dialogs.open')}</Button><Button onClick={() => setAsyncModal(true)}>{t('gallery.dialogs.openAsync')}</Button><Button onClick={() => setDrawer(true)}>{t('gallery.dialogs.openDrawer')}</Button><Button onClick={() => Modal.confirm({ title: t('gallery.dialogs.confirmTitle'), content: t('gallery.dialogs.confirmContent'), onOk: () => message.success(t('gallery.dialogs.confirmToast')) })}>{t('gallery.dialogs.openConfirm')}</Button></div>
          <div className="flex flex-wrap gap-2">{(['info', 'success', 'warning', 'error'] as const).map((kind) => <Button size="sm" key={kind} onClick={() => Modal[kind]({ title: t('gallery.dialogs.toastMessage', { kind: kind }), content: t('gallery.dialogs.toastDescription') })}>{kind} {t('gallery.dialogs.typeSuffix')}</Button>)}</div>
          <p className="text-xs leading-6 text-slate-500">{t('gallery.dialogs.typeContent')}</p>
        </Example>
        <Example id="gallery-form" title={t('gallery.form.title')} description={t('gallery.form.description')}>
          <Form form={form} onFinish={() => { message.success(t('gallery.form.success')); form.resetFields(); }}>
            <Form.Item name="name" label={t('gallery.form.name')} rules={[{ required: true, message: t('common.validation.nameRequired') }]}><Input placeholder={t('common.validation.nameRequired')} /></Form.Item>
            <Form.Item name="email" label={t('common.fields.email')} rules={[{ required: true, message: t('gallery.form.emailRequired') }, { type: 'email', message: t('gallery.form.emailInvalid') }]}><Input placeholder="name@example.com" /></Form.Item>
            <Form.Item name="agreement" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error(t('gallery.form.confirmRequired'))) }]}><Checkbox>{t('gallery.form.confirmLabel')}</Checkbox></Form.Item>
            <div className="flex gap-3"><Button type="submit">{t('gallery.form.submit')}</Button><Button variant="ghost" onClick={() => form.resetFields()}>{t('gallery.form.reset')}</Button></div>
          </Form>
        </Example>
        <Example id="gallery-files" title={t('gallery.files.title')} description={t('gallery.files.description')}>
          <FileDropZone accept=".json,.txt" onFiles={setFiles} hint={t('gallery.files.hint')} />
          {files.length > 0 && <p role="status" className="text-xs text-slate-600">{t('gallery.files.selectedLabel')}{files.map((file) => file.name).join(t('common.format.listSeparator'))}</p>}
          <FileDropZone disabled onFiles={() => undefined} title={t('gallery.files.disabled')} className="py-3" />
        </Example>
        <Example id="gallery-loading" title={t('gallery.loading.title')} description={t('gallery.loading.description')}>
          <div className="flex gap-3"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" /></div><Spinner size={20} /></div>
          <Spin spinning tip={t('gallery.loading.active')} className="h-20"><div className="h-20 rounded-lg bg-slate-50" /></Spin>
          <EmptyState title={t('gallery.loading.emptyTitle')} description={t('gallery.loading.emptyDescription')} minHeight={180} action={<Button size="sm" onClick={() => message.info(t('gallery.loading.createToast'))}>{t('gallery.loading.create')}</Button>} />
        </Example>
        <Example id="gallery-cards" title={t('gallery.cards.title')} description={t('gallery.cards.description')}>
          <WorkbenchCrumbs onBack={() => message.info(t('gallery.cards.back'))} items={[{ label: t('menu.examples'), title: t('menu.examples'), onClick: () => message.info(t('gallery.cards.openExamples')) }, { label: t('menu.components'), title: t('menu.components') }]} />
          <Separator />
          <Card><CardToolbar title={t('gallery.cards.exampleTitle')} count={3} description={t('gallery.cards.exampleDescription')} actions={<Button size="sm">{t('common.columns.actions')}</Button>} /><CardBar actions={<Button size="xs">{t('gallery.cards.more')}</Button>}>{t('gallery.cards.compactTitle')}</CardBar><ListToolbar extra={t('gallery.cards.recordCount')}><span className="text-xs text-slate-500">{t('gallery.cards.filterTitle')}</span></ListToolbar><CardContent className="py-4 text-xs text-slate-600">{t('gallery.cards.content')}</CardContent><CardFooter className="text-xs text-slate-500">{t('gallery.cards.footer')}</CardFooter></Card>
        </Example>
        <Example id="gallery-steps" title={t('gallery.steps.title')} description={t('gallery.steps.description')}>
          <Steps label={t('gallery.steps.label')} onChange={(index) => { if (index < step) setStep(index); }}
            items={(['fill', 'review', 'submit'] as const).map((key, index): StepItem => ({ id: key, title: t(`gallery.steps.${key}`), status: index < step ? 'done' : index === step ? 'current' : 'upcoming', statusLabel: t(index < step ? 'gallery.steps.done' : index === step ? 'gallery.steps.current' : 'gallery.steps.upcoming'), disabled: index > step }))} />
          <div className="flex gap-2">
            <Button size="sm" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>{t('gallery.steps.prev')}</Button>
            {step < 3 ? <Button size="sm" variant="primary" onClick={() => setStep((value) => value + 1)}>{t('gallery.steps.next')}</Button> : <Button size="sm" onClick={() => setStep(0)}>{t('gallery.steps.restart')}</Button>}
          </div>
          <Separator />
          <Timeline aria-label={t('gallery.steps.timelineLabel')} items={[
            { key: 'e4', title: t('gallery.steps.eventProcessing'), time: '11-26 14:20', dateTime: '2026-11-26T14:20', description: t('gallery.steps.eventProcessingHint'), tone: 'processing' },
            { key: 'e3', title: t('gallery.steps.eventWarning'), time: '11-25 18:05', dateTime: '2026-11-25T18:05', description: t('gallery.steps.eventWarningHint'), tone: 'warning' },
            { key: 'e2', title: t('gallery.steps.eventSuccess'), time: '11-25 09:40', dateTime: '2026-11-25T09:40', tone: 'success' },
            { key: 'e1', title: t('gallery.steps.eventCreated'), time: '11-24 16:12', dateTime: '2026-11-24T16:12' },
          ]} />
        </Example>
        <Example id="gallery-descriptions" title={t('gallery.descriptions.title')} description={t('gallery.descriptions.description')}>
          <Descriptions aria-label={t('gallery.descriptions.basicLabel')} items={[
            { key: 'code', label: t('gallery.descriptions.code'), children: <CodeTag>APV-202611-018</CodeTag> },
            { key: 'status', label: t('common.columns.status'), children: <Tag dot color="processing">{t('gallery.descriptions.statusValue')}</Tag> },
            { key: 'applicant', label: t('gallery.descriptions.applicant'), children: t('gallery.descriptions.applicantValue') },
            { key: 'department', label: t('gallery.descriptions.department'), children: t('gallery.descriptions.departmentValue') },
            { key: 'amount', label: t('gallery.descriptions.amount'), children: <span className="tabular-nums">{formatNumber(12600, { style: 'currency', currency: 'CNY' })}</span> },
            { key: 'created', label: t('gallery.descriptions.createdAt'), children: <span className="tabular-nums">2026-11-20 10:30</span> },
          ]} />
          <Descriptions bordered aria-label={t('gallery.descriptions.borderedLabel')} items={[
            { key: 'applicant', label: t('gallery.descriptions.applicant'), children: t('gallery.descriptions.applicantValue') },
            { key: 'department', label: t('gallery.descriptions.department'), children: t('gallery.descriptions.departmentValue') },
            { key: 'amount', label: t('gallery.descriptions.amount'), children: <span className="tabular-nums">{formatNumber(12600, { style: 'currency', currency: 'CNY' })}</span> },
            { key: 'created', label: t('gallery.descriptions.createdAt'), children: <span className="tabular-nums">2026-11-20</span> },
            { key: 'remark', label: t('gallery.descriptions.remark'), children: t('gallery.descriptions.remarkValue'), full: true },
          ]} />
        </Example>
        <Example id="gallery-table" title={t('gallery.tables.title')} description={t('gallery.tables.description')} wide>
          <div className="flex gap-2"><Button size="sm" pressed={tableState === 'data'} onClick={() => setTableState('data')}>{t('gallery.tables.dataTab')}</Button><Button size="sm" pressed={tableState === 'loading'} onClick={() => setTableState('loading')}>{t('common.status.loading')}</Button><Button size="sm" pressed={tableState === 'empty'} onClick={() => setTableState('empty')}>{t('gallery.tables.emptyTab')}</Button></div>
          <div className="h-[260px] overflow-hidden rounded-xl border border-line">
            <FixedTable rowKey="id" loading={tableState === 'loading'} dataSource={tableState === 'empty' ? [] : tableState === 'loading' ? [] : demoRows} rowSelection={{ selectedRowKeys: keys, onChange: setKeys }}
              columns={[{ title: t('gallery.tables.name'), dataIndex: 'name', width: '35%' }, { title: t('gallery.tables.code'), dataIndex: 'id', width: '30%', render: (value) => <CodeTag>{value}</CodeTag> }, { title: t('gallery.tables.owner'), dataIndex: 'owner', width: '20%' }, { title: t('common.columns.status'), dataIndex: 'status', width: '20%', render: (value, record) => <Tag dot color={value === 'completed' ? 'success' : value === 'active' ? 'processing' : 'default'}>{record.statusLabel}</Tag> }, { title: t('common.columns.actions'), width: 88, render: () => <RowAction icon="pencil" label={t('gallery.tables.editToast')} onClick={() => message.info(t('gallery.tables.editLabel'))} /> }]} />
          </div>
          <DataTable rowKey="id" dataSource={demoRows.slice(0, 1)} columns={[{ title: t('gallery.tables.standalone'), dataIndex: 'name' }, { title: t('gallery.tables.owner'), dataIndex: 'owner' }]} />
          <Table><TableCaption>{t('gallery.tables.native')}</TableCaption><TableHeader><TableRow><TableHead>{t('gallery.tables.name')}</TableHead><TableHead>{t('gallery.tables.code')}</TableHead></TableRow></TableHeader><TableBody>{demoRows.slice(0, 2).map((row) => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell><CodeTag>{row.id}</CodeTag></TableCell></TableRow>)}</TableBody><TableFooter><TableRow><TableCell colSpan={2}>{t('gallery.tables.recordCount')}</TableCell></TableRow></TableFooter></Table>
        </Example>
        <Example id="gallery-page-skeleton" title={t('gallery.skeletons.title')} description={t('gallery.skeletons.description')} wide>
          <div className="h-[230px] overflow-hidden rounded-xl border border-line"><PageSkeleton rows={2} /></div>
          <div className="h-[160px] overflow-hidden rounded-xl border border-line"><TableSkeleton rows={2} /></div>
        </Example>
      </div>
    </div>
    <GalleryToc scrollRef={scrollRef} />
    </div>
    <Modal open={modal} onCancel={() => setModal(false)} onOk={() => { setModal(false); message.success(t('common.toast.saved')); }} title={t('gallery.dialogs.standardTitle')} icon="layout-grid" description={t('gallery.dialogs.standardDescription')} okText={t('common.actions.save')}>
      <p className="text-13 leading-6 text-slate-600">{t('gallery.dialogs.standardContent')}</p>
    </Modal>
    <Modal open={asyncModal} onCancel={() => setAsyncModal(false)} onOk={async () => { await new Promise<void>((resolve) => window.setTimeout(resolve, 1000)); setAsyncModal(false); message.success(t('gallery.dialogs.asyncToast')); }} title={t('gallery.dialogs.asyncTitle')} icon="save" okText={t('common.actions.save')}>
      <p className="text-13 leading-6 text-slate-600">{t('gallery.dialogs.asyncDescription')}</p>
    </Modal>
    <Drawer open={drawer} onClose={() => setDrawer(false)} title={t('gallery.drawer.title')} footer={<Button onClick={() => setDrawer(false)}>{t('common.actions.close')}</Button>}>
      <div className="space-y-5">{Array.from({ length: 18 }, (_, index) => <div key={index}><h3 className="text-13 font-medium text-slate-900">{t('gallery.drawer.sectionLabel')}{index + 1}</h3><p className="mt-2 text-13 leading-6 text-slate-500">{t('gallery.drawer.content')}</p></div>)}</div>
    </Drawer>
  </div>;
};
