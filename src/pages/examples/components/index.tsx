import React, { useState } from 'react';
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
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { CopyButton } from '@/components/common/CopyButton';
import { FixedTable } from '@/components/common/FixedTable';
import { Kbd } from '@/components/common/Kbd';
import { Icon } from '@/components/icon';

function Example({ id, title, description, children, wide = false }: { id: string; title: string; description: string; children: React.ReactNode; wide?: boolean }) {
  return <Card id={id} className={wide ? 'col-span-2' : ''}>
    <CardHeader className="shrink-0"><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div></CardHeader>
    <CardContent className="min-w-0 space-y-5">{children}</CardContent>
  </Card>;
}

const DEMO_ROWS = [
  { id: 'DEMO-001', name: '项目说明', owner: '林知行', status: '已完成' },
  { id: 'DEMO-002', name: '界面验收', owner: '陈思远', status: '进行中' },
  { id: 'DEMO-003', name: '上线检查', owner: '许清和', status: '待开始' },
];

export const ComponentsPage: React.FC = () => {
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
  const options = [{ value: 'one', label: '选项一' }, { value: 'two', label: '选项二' }, { value: 'three', label: '已停用选项', disabled: true }];
  const variants: NonNullable<ButtonProps['variant']>[] = ['outline', 'primary', 'secondary', 'ghost', 'subtle', 'link', 'danger', 'destructive'];

  return <div className="flex h-full min-h-0 min-w-0 flex-col">
    <PageHeader title="组件示例" description="通用组件、状态与交互的可操作参考" actions={<span className="text-xs text-slate-500">全局搜索 <Kbd className="border-slate-200 bg-slate-50 text-slate-500">⌘ / Ctrl K</Kbd></span>} />
    <div data-slot="gallery-scroll" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-1">
      <div className="grid grid-cols-2 items-start gap-5 pb-1">
        <Example id="gallery-buttons" title="按钮与行内操作" description="36px 控件 · 中性交互 · 明确的危险操作" wide>
          <div className="flex flex-wrap items-center gap-3">{variants.map((variant) => <Button key={variant} variant={variant}>{variant}</Button>)}</div>
          <div className="flex flex-wrap items-center gap-3"><Button size="xs">小型 28</Button><Button size="sm">工具栏 36</Button><Button>标准 36</Button><Button size="lg">大型 40</Button><Button size="icon" aria-label="添加示例"><Icon icon="plus" size={18} /></Button><Button disabled>禁用按钮</Button><Button loading>正在保存</Button><Button pressed>已选中</Button>
            <RowActions><RowAction icon="pencil" label="编辑示例" onClick={() => message.info('编辑操作')} /><RowAction icon="trash-2" label="删除示例" tone="danger" onClick={() => message.warning('删除操作')} /><RowAction icon="lock" label="不可用操作" disabled disabledReason="此操作暂不可用" /></RowActions>
          </div>
        </Example>
        <Example id="gallery-inputs" title="输入框" description="普通、密码、搜索、只读与错误状态">
          <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="输入内容，可清空" allowClear aria-label="普通输入示例" />
          <Input.Password placeholder="密码输入" aria-label="密码输入示例" />
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onPressEnter={() => message.info(`搜索：${search || '全部'}`)} placeholder="搜索示例" aria-label="搜索示例" />
          <div className="grid grid-cols-2 gap-3"><Input disabled placeholder="禁用状态" aria-label="禁用输入示例" /><Input value="只读内容" readOnly aria-label="只读输入示例" /></div>
          <Input status="error" aria-invalid aria-label="错误输入示例" placeholder="错误状态" />
          <Input.TextArea rows={2} placeholder="多行文本" aria-label="多行文本示例" />
        </Example>
        <Example id="gallery-selects" title="选择与开关" description="单选、多选、复选框和数字输入">
          <div className="grid grid-cols-2 gap-3"><Select value={select} onChange={setSelect} options={options} showSearch /><Select disabled placeholder="禁用选择" options={options} /></div>
          <Select mode="multiple" value={multi} onChange={setMulti} options={options} placeholder="选择多个选项" />
          <Select loading placeholder="正在加载选项" options={[]} />
          <div className="flex flex-wrap gap-4"><Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)}>已选 / 未选</Checkbox><Checkbox indeterminate checked={false}>半选</Checkbox><Checkbox disabled checked>禁用</Checkbox></div>
          <Checkbox.Group value={multi} onChange={(values) => setMulti(values.map(String))} className="flex gap-4"><Checkbox value="one">分组选项一</Checkbox><Checkbox value="two">分组选项二</Checkbox></Checkbox.Group>
          <div className="flex flex-wrap items-center gap-5"><Switch aria-label="示例开关" checked={switchOn} onChange={setSwitchOn} /><Switch aria-label="关闭的开关" /><Switch aria-label="禁用开关" checked disabled /><Switch aria-label="加载开关" checked loading /><InputNumber id="gallery-number" min={0} max={10} value={number} onChange={setNumber} className="w-28" /></div>
        </Example>
        <Example id="gallery-badges" title="标签、头像与进度" description="颜色承载状态含义，正文保持中性">
          <div className="flex flex-wrap gap-2">{(['default', 'secondary', 'outline', 'info', 'warning', 'success', 'error', 'destructive'] as NonNullable<BadgeProps['variant']>[]).map((variant) => <Badge key={variant} variant={variant}>{variant}</Badge>)}<Badge shape="circle">圆形标签</Badge></div>
          <div className="flex flex-wrap gap-2">{(['default', 'success', 'warning', 'error', 'processing', 'indigo'] as TagColor[]).map((color) => <Tag dot color={color} key={color}>{color}</Tag>)}</div>
          <div className="flex items-center gap-4"><Avatar><AvatarFallback>林</AvatarFallback></Avatar><Avatar className="size-10"><AvatarFallback>PL</AvatarFallback></Avatar><CodeTag>RESOURCE-001</CodeTag><CopyButton text="RESOURCE-001" tip="复制资源编码" /></div>
          <Progress percent={68} status="active" /><Progress percent={100} strokeColor="#10B981CC" /><Progress percent={32} status="exception" />
        </Example>
        <Example id="gallery-alerts" title="提示与轻反馈" description="信息、成功、警告、错误与加载反馈">
          <div className="space-y-2"><Alert type="info" title="信息提示" description="这是一个带有说明文字的信息提示。" /><Alert type="success" title="操作已成功完成" /><Alert type="warning" title="请确认后继续操作" /><Alert type="error" title="操作失败，请检查后重试" /></div>
          <div className="flex flex-wrap gap-2">{(['info', 'success', 'warning', 'error'] as const).map((kind) => <Button key={kind} size="sm" onClick={() => message[kind](`${kind} 类型轻提示`)}>{kind} 提示</Button>)}<Button size="sm" onClick={() => { const id = message.loading('正在处理…'); window.setTimeout(() => { message.destroy(id); message.success('处理完成'); }, 1000); }}>加载提示</Button></div>
        </Example>
        <Example id="gallery-tabs" title="标签页与浮层" description="品牌色下划线，键盘可访问的菜单与弹层">
          <Tabs items={[{ key: 'overview', label: '概览' }, { key: 'details', label: '详情', count: 3 }, { key: 'history', label: '历史' }]} value={tab} onChange={setTab} />
          <SectionBar description={tab === 'overview' ? '当前为概览标签页' : tab === 'details' ? '当前为详情标签页' : '当前为历史标签页'} actions={<Button size="xs" onClick={() => message.info('分区操作')}>分区操作</Button>} />
          <div className="flex flex-wrap gap-3"><Tooltip title="完整的提示文字"><Button size="sm">悬浮提示</Button></Tooltip><Popover trigger="click" title="浮层标题" content={<p className="text-xs leading-5">这里可以放置说明或快捷操作。</p>}><Button size="sm">打开 Popover</Button></Popover>
            <Dropdown menu={{ items: [{ key: 'edit', label: '编辑', onClick: () => message.info('已选择编辑') }, { key: 'disabled', label: '不可用操作', disabled: true }, { key: 'divider', type: 'divider' }, { key: 'delete', label: '删除', danger: true, onClick: () => message.warning('已选择删除') }] }}><Button size="sm">下拉菜单<Icon icon="chevron-down" size={14} /></Button></Dropdown>
            <Popconfirm title="确认执行这个操作？" description="这是一条局部确认提示。" onConfirm={() => message.success('已确认')}><Button size="sm">气泡确认</Button></Popconfirm>
          </div>
          <Tooltip title="这是一段很长的文字，使用省略号时仍然可以查看完整内容"><span tabIndex={0} className="block w-44 truncate text-13 text-slate-600" title="这是一段很长的文字，使用省略号时仍然可以查看完整内容">这是一段很长的文字，使用省略号时仍然可以查看完整内容</span></Tooltip>
        </Example>
        <Example id="gallery-overlays" title="弹窗、确认与抽屉" description="固定标题与操作栏，内容独立滚动">
          <div className="flex flex-wrap gap-3"><Button onClick={() => setModal(true)}>打开弹窗</Button><Button onClick={() => setAsyncModal(true)}>异步保存弹窗</Button><Button onClick={() => setDrawer(true)}>打开抽屉</Button><Button onClick={() => Modal.confirm({ title: '确认操作', content: '确认后将显示成功提示。', onOk: () => message.success('确认成功') })}>确认弹窗</Button></div>
          <div className="flex flex-wrap gap-2">{(['info', 'success', 'warning', 'error'] as const).map((kind) => <Button size="sm" key={kind} onClick={() => Modal[kind]({ title: `${kind} 弹窗`, content: '由应用根部的 ModalHost 统一承载。' })}>{kind} 弹窗</Button>)}</div>
          <p className="text-xs leading-6 text-slate-500">支持 Esc 关闭、焦点约束与返回。异步提交期间禁止重复保存，并保留弹窗内容。</p>
        </Example>
        <Example id="gallery-form" title="表单验证" description="字段校验内联显示，错误关联输入控件">
          <Form form={form} onFinish={() => { message.success('表单验证通过'); form.resetFields(); }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}><Input placeholder="请输入姓名" /></Form.Item>
            <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}><Input placeholder="name@example.com" /></Form.Item>
            <Form.Item name="agreement" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请先勾选确认')) }]}><Checkbox>我已核对以上信息</Checkbox></Form.Item>
            <div className="flex gap-3"><Button type="submit">验证并提交</Button><Button variant="ghost" onClick={() => form.resetFields()}>重置表单</Button></div>
          </Form>
        </Example>
        <Example id="gallery-files" title="文件选择" description="拖拽或点击选择，仅在浏览器内读取">
          <FileDropZone accept=".json,.txt" onFiles={setFiles} hint="支持 JSON、TXT 文件" />
          {files.length > 0 && <p role="status" className="text-xs text-slate-600">已选择：{files.map((file) => file.name).join('、')}</p>}
          <FileDropZone disabled onFiles={() => undefined} title="禁用的文件选择区域" className="py-3" />
        </Example>
        <Example id="gallery-loading" title="骨架、加载与空状态" description="首次加载保持结构，空数据保留可操作入口">
          <div className="flex gap-3"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/2" /></div><Spinner size={20} /></div>
          <Spin spinning tip="正在加载" className="h-20"><div className="h-20 rounded-lg bg-slate-50" /></Spin>
          <EmptyState title="暂无内容" description="创建第一条记录，开始管理您的数据" minHeight={180} action={<Button size="sm" onClick={() => message.info('创建新记录')}>创建记录</Button>} />
        </Example>
        <Example id="gallery-cards" title="卡片、面包屑与分隔线" description="保持一致的标题、工具条和操作区域">
          <WorkbenchCrumbs onBack={() => message.info('返回上一级')} items={[{ label: '示例', title: '示例', onClick: () => message.info('打开示例') }, { label: '组件示例', title: '组件示例' }]} />
          <Separator />
          <Card><CardToolbar title="卡片标题" count={3} description="可选说明文字" actions={<Button size="sm">操作</Button>} /><CardBar actions={<Button size="xs">更多</Button>}>紧凑工具条</CardBar><ListToolbar extra="3 条记录"><span className="text-xs text-slate-500">筛选工具条</span></ListToolbar><CardContent className="py-4 text-xs text-slate-600">内容区域</CardContent><CardFooter className="text-xs text-slate-500">卡片底栏</CardFooter></Card>
        </Example>
        <Example id="gallery-table" title="数据表格" description="支持勾选、窗口化、固定表头、加载与空状态" wide>
          <div className="flex gap-2"><Button size="sm" pressed={tableState === 'data'} onClick={() => setTableState('data')}>数据</Button><Button size="sm" pressed={tableState === 'loading'} onClick={() => setTableState('loading')}>加载中</Button><Button size="sm" pressed={tableState === 'empty'} onClick={() => setTableState('empty')}>空数据</Button></div>
          <div className="h-[260px] overflow-hidden rounded-xl border border-line">
            <FixedTable rowKey="id" loading={tableState === 'loading'} dataSource={tableState === 'empty' ? [] : tableState === 'loading' ? [] : DEMO_ROWS} rowSelection={{ selectedRowKeys: keys, onChange: setKeys }}
              columns={[{ title: '名称', dataIndex: 'name', width: '35%' }, { title: '编码', dataIndex: 'id', width: '30%', render: (value) => <CodeTag>{value}</CodeTag> }, { title: '负责人', dataIndex: 'owner', width: '20%' }, { title: '状态', dataIndex: 'status', width: '20%', render: (value) => <Tag dot color={value === '已完成' ? 'success' : value === '进行中' ? 'processing' : 'default'}>{value}</Tag> }, { title: '操作', width: 88, render: () => <RowAction icon="pencil" label="编辑表格示例" onClick={() => message.info('编辑记录')} /> }]} />
          </div>
          <DataTable rowKey="id" dataSource={DEMO_ROWS.slice(0, 1)} columns={[{ title: '独立数据表', dataIndex: 'name' }, { title: '负责人', dataIndex: 'owner' }]} />
          <Table><TableCaption>原生表格组件</TableCaption><TableHeader><TableRow><TableHead>名称</TableHead><TableHead>编码</TableHead></TableRow></TableHeader><TableBody>{DEMO_ROWS.slice(0, 2).map((row) => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell><CodeTag>{row.id}</CodeTag></TableCell></TableRow>)}</TableBody><TableFooter><TableRow><TableCell colSpan={2}>2 条示例记录</TableCell></TableRow></TableFooter></Table>
        </Example>
        <Example id="gallery-page-skeleton" title="页面与表格骨架" description="与真实列表结构一致的初始加载状态" wide>
          <div className="h-[230px] overflow-hidden rounded-xl border border-line"><PageSkeleton rows={2} /></div>
          <div className="h-[160px] overflow-hidden rounded-xl border border-line"><TableSkeleton rows={2} /></div>
        </Example>
      </div>
    </div>
    <Modal open={modal} onCancel={() => setModal(false)} onOk={() => { setModal(false); message.success('已保存'); }} title="标准弹窗" icon="layout-grid" description="标题与操作栏固定在弹窗边界" okText="保存">
      <p className="text-13 leading-6 text-slate-600">这里可以放置表单、详情或需要用户确认的内容。</p>
    </Modal>
    <Modal open={asyncModal} onCancel={() => setAsyncModal(false)} onOk={async () => { await new Promise<void>((resolve) => window.setTimeout(resolve, 1000)); setAsyncModal(false); message.success('异步保存完成'); }} title="异步保存" icon="save" okText="保存">
      <p className="text-13 leading-6 text-slate-600">点击保存后等待一秒，期间重复提交与关闭操作会被阻止。</p>
    </Modal>
    <Drawer open={drawer} onClose={() => setDrawer(false)} title="详情抽屉" footer={<Button onClick={() => setDrawer(false)}>关闭</Button>}>
      <div className="space-y-5">{Array.from({ length: 18 }, (_, index) => <div key={index}><h3 className="text-13 font-medium text-slate-900">内容分区 {index + 1}</h3><p className="mt-2 text-13 leading-6 text-slate-500">抽屉内容较长时，正文区域独立滚动，标题与底部操作始终可见。</p></div>)}</div>
    </Drawer>
  </div>;
};
