import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';
import dayjs from 'dayjs';
import { Check } from 'lucide-react';
import { exampleTableService, type InventoryErrors, type InventoryRow } from '@/api/services/exampleTableService';
import { countInventoryErrors, INVENTORY_CATEGORIES, INVENTORY_LIMIT, NAME_MAX_LENGTH, validateInventory, type InventoryField } from '@/api/services/exampleTableRules';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Icon } from '@/components/icon';
import { useT } from '@/i18n';
import { Button } from '@/ui/button';
import { Card, CardContent, ListToolbar } from '@/ui/card';
import { Alert, Checkbox, InputNumber, Switch, Tag } from '@/ui/controls';
import { Dropdown, menuItemClass } from '@/ui/dropdown';
import { Input } from '@/ui/input';
import { message } from '@/ui/message';
import { Modal } from '@/ui/modal';
import { RowAction } from '@/ui/row-action';
import { Select } from '@/ui/select';
import { Spin } from '@/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { cn } from '@/utils';
import { downloadCsv, toCsv } from '@/utils/csv';
import { createId } from '@/utils/id';
import { LeaveGuard } from '../forms/LeaveGuard';

const OPTIONAL_COLUMNS = ['category', 'price', 'stock', 'active'] as const;
type OptionalColumn = typeof OPTIONAL_COLUMNS[number];
const COLUMNS_KEY = 'pilot-admin:editable-table:hidden-columns:v1';

const readHidden = (): OptionalColumn[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(COLUMNS_KEY) || '[]');
    return Array.isArray(value) ? OPTIONAL_COLUMNS.filter((column) => value.includes(column)) : [];
  } catch { return []; }
};
const sameRow = (left: InventoryRow, right: InventoryRow) => left.name === right.name && left.category === right.category
  && left.price === right.price && left.stock === right.stock && left.active === right.active;

/** 统计新增、修改与删除；新增行未通过校验同样计入。 */
function diffRows(saved: readonly InventoryRow[], rows: readonly InventoryRow[]) {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const ids = new Set(rows.map((row) => row.id));
  const added = new Set(rows.filter((row) => !savedById.has(row.id)).map((row) => row.id));
  const modified = new Set(rows.filter((row) => { const before = savedById.get(row.id); return before && !sameRow(before, row); }).map((row) => row.id));
  const removed = saved.filter((row) => !ids.has(row.id)).length;
  return { added, modified, count: added.size + modified.size + removed };
}

export function EditableTablePage() {
  const { t, locale } = useT();
  const [saved, setSaved] = useState<InventoryRow[] | null>(null);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [errors, setErrors] = useState<InventoryErrors>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<OptionalColumn[]>(readHidden);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const alive = useRef(true);
  const saveLock = useRef(false);
  const focusAfterAdd = useRef<string | null>(null);

  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    let active = true;
    setLoadError('');
    exampleTableService.list().then(({ data }) => {
      if (!active) return;
      setSaved(data); setRows(data); setErrors({}); setSelected([]);
    }).catch((error: Error) => { if (active) setLoadError(error.message || t('exampleTable.errors.load')); });
    return () => { active = false; };
  }, [attempt, t]);
  useEffect(() => {
    try { localStorage.setItem(COLUMNS_KEY, JSON.stringify(hidden)); } catch { /* 当前页面仍可切换。 */ }
  }, [hidden]);
  useEffect(() => {
    const id = focusAfterAdd.current;
    if (!id) return;
    focusAfterAdd.current = null;
    document.getElementById(`inventory-${id}-name`)?.focus();
  }, [rows]);

  const diff = useMemo(() => diffRows(saved || [], rows), [saved, rows]);
  const dirty = diff.count > 0;
  const errorCount = countInventoryErrors(errors);
  const visible = (column: OptionalColumn) => !hidden.includes(column);
  const allSelected = rows.length > 0 && selected.length === rows.length;

  const update = useCallback((id: string, patch: Partial<InventoryRow>) => {
    setRows((previous) => previous.map((row) => row.id === id ? { ...row, ...patch } : row));
    // 已提示过的单元格随输入即时复核，未提示的单元格等保存时统一校验。
    setErrors((previous) => {
      if (!previous[id]) return previous;
      const next = { ...previous };
      const fields = Object.keys(patch) as InventoryField[];
      const remaining = { ...next[id] };
      fields.forEach((field) => { delete remaining[field]; });
      if (Object.keys(remaining).length) next[id] = remaining; else delete next[id];
      return next;
    });
  }, []);
  const addRow = () => {
    const id = `new-${createId()}`;
    focusAfterAdd.current = id;
    setRows((previous) => [...previous, { id, sku: '', name: '', category: 'hardware', price: null, stock: 0, active: true }]);
  };
  const removeRows = (ids: string[]) => {
    setRows((previous) => previous.filter((row) => !ids.includes(row.id)));
    setSelected((previous) => previous.filter((id) => !ids.includes(id)));
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([id]) => !ids.includes(id))));
  };
  const setActive = (active: boolean) => setRows((previous) => previous.map((row) => selected.includes(row.id) ? { ...row, active } : row));
  const discard = () => {
    if (saved) setRows(saved);
    setErrors({}); setSelected([]); setDiscardOpen(false);
  };
  const focusFirstError = (next: InventoryErrors) => {
    const row = rows.find((item) => next[item.id]);
    const field = row && (['name', 'category', 'price', 'stock'] as const).find((key) => next[row.id]?.[key]);
    if (row && field) document.getElementById(`inventory-${row.id}-${field}`)?.focus();
  };
  const save = async () => {
    if (saveLock.current || !dirty) return;
    const local = validateInventory(rows);
    if (Object.keys(local).length) { setErrors(local); focusFirstError(local); return; }
    saveLock.current = true;
    setSaving(true);
    try {
      const { data } = await exampleTableService.save(rows);
      if (!alive.current) return;
      if (!data.success) { setErrors(data.errors); focusFirstError(data.errors); return; }
      // 新增行在保存后获得编号，与服务端分配主键的流程一致。
      const next = rows.map((row, index) => row.sku ? row : { ...row, sku: `SKU-${String(2000 + index)}` });
      message.success(t('exampleTable.success', { count: diff.count }));
      setSaved(next); setRows(next); setErrors({}); setSelected([]);
      setSavedAt(data.savedAt);
    } catch (error) {
      if (alive.current) message.error((error as Error).message || t('exampleTable.errors.save'));
    } finally {
      saveLock.current = false;
      if (alive.current) setSaving(false);
    }
  };
  const exportCsv = () => {
    const columns = [
      { header: t('exampleTable.columns.sku'), value: (row: InventoryRow) => row.sku },
      { header: t('exampleTable.columns.name'), value: (row: InventoryRow) => row.name },
      ...(visible('category') ? [{ header: t('exampleTable.columns.category'), value: (row: InventoryRow) => t(`exampleTable.category.${row.category}`) }] : []),
      ...(visible('price') ? [{ header: t('exampleTable.columns.price'), value: (row: InventoryRow) => row.price?.toFixed(2) ?? '' }] : []),
      ...(visible('stock') ? [{ header: t('exampleTable.columns.stock'), value: (row: InventoryRow) => row.stock ?? '' }] : []),
      ...(visible('active') ? [{ header: t('exampleTable.columns.active'), value: (row: InventoryRow) => t(row.active ? 'exampleTable.listed' : 'exampleTable.unlisted') }] : []),
    ];
    downloadCsv(`inventory-${dayjs().format('YYYYMMDD-HHmm')}.csv`, toCsv(columns, rows));
  };

  const fieldError = (row: InventoryRow, field: InventoryField) => errors[row.id]?.[field];
  const errorText = (row: InventoryRow, field: InventoryField) => {
    const key = fieldError(row, field);
    return key ? <p id={`inventory-${row.id}-${field}-error`} className="mt-1 text-[11px] leading-4 text-red-600">{t(key)}</p> : null;
  };
  const describedBy = (row: InventoryRow, field: InventoryField) => fieldError(row, field) ? `inventory-${row.id}-${field}-error` : undefined;
  const columnSettings = <Dropdown placement="bottomRight" popupRender={() => <>
    {OPTIONAL_COLUMNS.map((column) => <Menu.CheckboxItem key={column} className={menuItemClass} checked={visible(column)}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={(checked) => setHidden((previous) => checked ? previous.filter((item) => item !== column) : [...previous, column])}>
      <span className="flex size-4 shrink-0 items-center justify-center"><Menu.ItemIndicator><Check className="size-3.5" /></Menu.ItemIndicator></span>
      <span className="min-w-0 flex-1 truncate">{t(`exampleTable.columns.${column}`)}</span>
    </Menu.CheckboxItem>)}
  </>}>
    <Button size="sm"><Icon icon="layout-grid" size={16} />{t('exampleTable.actions.columnSettings')}</Button>
  </Dropdown>;

  return <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
    <LeaveGuard dirty={dirty} busy={saving} />
    <PageHeader title={t('menu.editableTable')} description={t('exampleTable.description')} actions={<>
      <Button disabled={!saved || rows.length === 0} onClick={exportCsv}><Icon icon="download" size={16} />{t('exampleTable.actions.export')}</Button>
      <Button disabled={!dirty || saving} onClick={() => setDiscardOpen(true)}><Icon icon="rotate-ccw" size={16} />{t('exampleTable.actions.discard')}</Button>
      <Button variant="primary" loading={saving} disabled={!dirty} onClick={() => void save()}><Icon icon="save" size={16} />{t('exampleTable.actions.save')}</Button>
    </>} />
    {loadError ? <Alert type="error" title={loadError} action={<Button size="xs" onClick={() => setAttempt((value) => value + 1)}>{t('common.actions.retry')}</Button>} className="mb-4 shrink-0" /> : null}
    {errorCount > 0 ? <Alert type="error" role="alert" title={t('exampleTable.validation.summary', { count: errorCount })} className="mb-4 shrink-0" /> : null}
    <Card className="min-h-0 flex-1">
      <ListToolbar extra={<span aria-live="polite" data-slot="change-summary">{dirty ? t('exampleTable.changes', { count: diff.count })
        : savedAt ? t('exampleTable.savedAt', { time: dayjs(savedAt).locale(locale === 'zh-CN' ? 'zh-cn' : 'en').format('HH:mm:ss') }) : t('exampleTable.noChanges')}</span>}>
        <Button size="sm" disabled={!saved || saving} onClick={addRow}><Icon icon="plus" size={16} />{t('exampleTable.actions.add')}</Button>
        {columnSettings}
        <span className="text-xs text-slate-500">{t('exampleTable.total', { count: rows.length })}</span>
      </ListToolbar>
      {selected.length > 0 ? <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line-soft bg-slate-50/60 px-6 py-2" data-slot="selection-bar">
        <span className="text-xs text-slate-600" aria-live="polite">{t('exampleTable.selection', { count: selected.length })}</span>
        <Button size="xs" disabled={saving} onClick={() => setActive(true)}>{t('exampleTable.actions.batchEnable')}</Button>
        <Button size="xs" disabled={saving} onClick={() => setActive(false)}>{t('exampleTable.actions.batchDisable')}</Button>
        <Button size="xs" disabled={saving} onClick={() => removeRows(selected)}>{t('exampleTable.actions.batchRemove')}</Button>
        <Button size="xs" variant="ghost" onClick={() => setSelected([])}>{t('exampleTable.actions.clearSelection')}</Button>
      </div> : null}
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <p className="shrink-0 border-b border-line-soft px-6 py-2 text-xs text-slate-500">{t('exampleTable.demoHint')}</p>
        {!saved && !loadError ? <div className="flex flex-1 items-center justify-center"><Spin /></div> : null}
        {saved && rows.length === 0 ? <EmptyState icon="sheet" title={t('exampleTable.empty')} /> : null}
        {saved && rows.length > 0 ? <Table aria-label={t('exampleTable.tableLabel')} containerClassName="min-h-0 flex-1 overflow-auto" className="min-w-[860px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-6"><Checkbox aria-label={t('exampleTable.actions.selectAll')} checked={allSelected} indeterminate={selected.length > 0 && !allSelected}
                onChange={(event) => setSelected(event.target.checked ? rows.map((row) => row.id) : [])} /></TableHead>
              <TableHead className="w-28">{t('exampleTable.columns.sku')}</TableHead>
              <TableHead className="min-w-[200px]">{t('exampleTable.columns.name')}</TableHead>
              {visible('category') ? <TableHead className="w-36">{t('exampleTable.columns.category')}</TableHead> : null}
              {visible('price') ? <TableHead className="w-36">{t('exampleTable.columns.price')}</TableHead> : null}
              {visible('stock') ? <TableHead className="w-28">{t('exampleTable.columns.stock')}</TableHead> : null}
              {visible('active') ? <TableHead className="w-20">{t('exampleTable.columns.active')}</TableHead> : null}
              <TableHead className="w-16 pr-6 text-center">{t('common.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const label = row.name.trim() || t('exampleTable.rowLabel', { index: index + 1 });
              const state = diff.added.has(row.id) ? 'added' : diff.modified.has(row.id) ? 'modified' : undefined;
              return <TableRow key={row.id} data-row-state={state} data-state={selected.includes(row.id) ? 'selected' : undefined}
                className={cn('align-top', state && 'bg-amber-50/40 hover:bg-amber-50/60')}>
                <TableCell className="pl-6 pt-4"><Checkbox aria-label={t('exampleTable.actions.selectRow', { name: label })} checked={selected.includes(row.id)}
                  onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, row.id] : previous.filter((id) => id !== row.id))} /></TableCell>
                <TableCell className="pt-3.5">
                  {row.sku ? <span className="font-mono text-xs text-slate-600">{row.sku}</span> : <Tag color="brand">{t('exampleTable.newRow')}</Tag>}
                  {state === 'modified' ? <span className="mt-1 block text-[11px] text-amber-700">{t('exampleTable.modified')}</span> : null}
                </TableCell>
                <TableCell>
                  <Input id={`inventory-${row.id}-name`} size="small" value={row.name} maxLength={NAME_MAX_LENGTH + 10}
                    aria-label={`${t('exampleTable.columns.name')} · ${label}`} aria-invalid={Boolean(fieldError(row, 'name')) || undefined} aria-describedby={describedBy(row, 'name')}
                    status={fieldError(row, 'name') ? 'error' : undefined} onChange={(event) => update(row.id, { name: event.target.value })} />
                  {errorText(row, 'name')}
                </TableCell>
                {visible('category') ? <TableCell>
                  <Select<InventoryRow['category']> id={`inventory-${row.id}-category`} size="small" className="w-full" value={row.category} aria-label={`${t('exampleTable.columns.category')} · ${label}`}
                    status={fieldError(row, 'category') ? 'error' : undefined} onChange={(value) => update(row.id, { category: value })}
                    options={INVENTORY_CATEGORIES.map((value) => ({ value, label: t(`exampleTable.category.${value}`) }))} />
                  {errorText(row, 'category')}
                </TableCell> : null}
                {visible('price') ? <TableCell>
                  <InputNumber id={`inventory-${row.id}-price`} className="h-8" value={row.price} min={0} max={INVENTORY_LIMIT} precision={2} step={1}
                    aria-label={`${t('exampleTable.columns.price')} · ${label}`} aria-invalid={Boolean(fieldError(row, 'price')) || undefined} aria-describedby={describedBy(row, 'price')}
                    onChange={(value) => update(row.id, { price: value })} />
                  {errorText(row, 'price')}
                </TableCell> : null}
                {visible('stock') ? <TableCell>
                  <InputNumber id={`inventory-${row.id}-stock`} className="h-8" value={row.stock} min={0} max={INVENTORY_LIMIT} precision={0} step={1}
                    aria-label={`${t('exampleTable.columns.stock')} · ${label}`} aria-invalid={Boolean(fieldError(row, 'stock')) || undefined} aria-describedby={describedBy(row, 'stock')}
                    onChange={(value) => update(row.id, { stock: value })} />
                  {errorText(row, 'stock')}
                </TableCell> : null}
                {visible('active') ? <TableCell className="pt-4">
                  <Switch size="small" checked={row.active} aria-label={`${t('exampleTable.columns.active')} · ${label}`} onChange={(active) => update(row.id, { active })} />
                </TableCell> : null}
                <TableCell className="pr-6 pt-3 text-center">
                  <RowAction icon="trash-2" tone="danger" label={`${t('exampleTable.actions.removeRow')} · ${label}`} disabled={saving} onClick={() => removeRows([row.id])} />
                </TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table> : null}
      </CardContent>
    </Card>
    <Modal open={discardOpen} title={t('exampleTable.discardDialog.title')} icon="triangle-alert" okType="danger" okText={t('exampleTable.discardDialog.ok')}
      onOk={discard} onCancel={() => setDiscardOpen(false)}>
      <p className="text-13 leading-6 text-slate-600">{t('exampleTable.discardDialog.description')}</p>
    </Modal>
  </div>;
}
