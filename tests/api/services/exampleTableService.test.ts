import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateInventory, validateInventoryRow, type InventoryRow } from '@/api/services/exampleTableRules';

vi.mock('@/mock/helpers', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/mock/helpers')>(),
  delay: () => Promise.resolve(),
}));

beforeEach(() => {
  vi.resetModules();
  localStorage.setItem('pilot-admin:auth:tokens:v2', JSON.stringify({ accessToken: `mock.${btoa(JSON.stringify({ sub: 'u-0003' }))}.local`, refreshToken: 'test' }));
});

const row = (patch: Partial<InventoryRow> = {}): InventoryRow => ({ id: 'r1', sku: 'SKU-1', name: 'Keyboard', category: 'hardware', price: 10, stock: 1, active: true, ...patch });

describe('editable inventory table', () => {
  it('validates names, categories, prices and whole-number stock', () => {
    expect(validateInventoryRow(row())).toEqual({});
    expect(validateInventoryRow(row({ name: ' ', price: null, stock: 1.5 }))).toEqual({
      name: 'exampleTable.validation.nameRequired', price: 'exampleTable.validation.priceRequired', stock: 'exampleTable.validation.stockRange',
    });
    expect(validateInventoryRow(row({ name: 'a'.repeat(41), price: 100000, stock: -1, category: 'other' as InventoryRow['category'] }))).toEqual({
      name: 'exampleTable.validation.nameTooLong', price: 'exampleTable.validation.priceRange', stock: 'exampleTable.validation.stockRange', category: 'exampleTable.validation.category',
    });
  });

  it('flags duplicate names across rows ignoring case and spaces', () => {
    expect(validateInventory([row(), row({ id: 'r2', name: ' keyboard ' }), row({ id: 'r3', name: 'Mouse' })])).toEqual({
      r1: { name: 'exampleTable.validation.duplicateName' }, r2: { name: 'exampleTable.validation.duplicateName' },
    });
  });

  it('lets viewers load and save without touching the mock DB', async () => {
    const { exampleTableService } = await import('@/api/services/exampleTableService');
    const { getMockDb } = await import('@/mock/db');
    const previous = structuredClone(getMockDb());
    const { data: rows } = await exampleTableService.list();
    expect(rows).toHaveLength(12);
    expect(new Set(rows.map((item) => item.sku)).size).toBe(12);
    expect((await exampleTableService.save(rows)).data).toMatchObject({ success: true });
    expect((await exampleTableService.save([...rows, row({ id: 'r-new', name: ' System ' })])).data).toEqual({
      success: false, errors: { 'r-new': { name: 'exampleTable.validation.reservedName' } },
    });
    expect(getMockDb()).toEqual(previous);
  });
});
