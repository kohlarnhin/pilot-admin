import type { MessageKey } from '@/i18n';

export const INVENTORY_CATEGORIES = ['hardware', 'software', 'service'] as const;
export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

export interface InventoryRow {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  price: number | null;
  stock: number | null;
  active: boolean;
}

export type InventoryField = 'name' | 'category' | 'price' | 'stock';
export type InventoryValidationKey = Exclude<Extract<MessageKey, `exampleTable.validation.${string}`>, 'exampleTable.validation.summary'>;
export type InventoryRowErrors = Partial<Record<InventoryField, InventoryValidationKey>>;
export type InventoryErrors = Record<string, InventoryRowErrors>;

export const INVENTORY_LIMIT = 99999;
export const NAME_MAX_LENGTH = 40;

/** 单行校验：前端即时提示与模拟服务端共用同一规则。 */
export function validateInventoryRow(row: InventoryRow): InventoryRowErrors {
  const errors: InventoryRowErrors = {};
  const name = row.name.trim();
  if (!name) errors.name = 'exampleTable.validation.nameRequired';
  else if (name.length > NAME_MAX_LENGTH) errors.name = 'exampleTable.validation.nameTooLong';
  if (!INVENTORY_CATEGORIES.includes(row.category)) errors.category = 'exampleTable.validation.category';
  if (row.price === null || !Number.isFinite(row.price)) errors.price = 'exampleTable.validation.priceRequired';
  else if (row.price < 0 || row.price > INVENTORY_LIMIT) errors.price = 'exampleTable.validation.priceRange';
  if (row.stock === null || !Number.isFinite(row.stock)) errors.stock = 'exampleTable.validation.stockRequired';
  else if (!Number.isInteger(row.stock) || row.stock < 0 || row.stock > INVENTORY_LIMIT) errors.stock = 'exampleTable.validation.stockRange';
  return errors;
}

/** 整表校验：在单行规则之外检查名称重复（忽略大小写与首尾空白）。 */
export function validateInventory(rows: readonly InventoryRow[]): InventoryErrors {
  const errors: InventoryErrors = {};
  const seen = new Map<string, string[]>();
  for (const row of rows) {
    const rowErrors = validateInventoryRow(row);
    if (Object.keys(rowErrors).length) errors[row.id] = rowErrors;
    const key = row.name.trim().toLowerCase();
    if (key) seen.set(key, [...(seen.get(key) || []), row.id]);
  }
  for (const ids of seen.values()) {
    if (ids.length < 2) continue;
    for (const id of ids) errors[id] = { ...errors[id], name: errors[id]?.name ?? 'exampleTable.validation.duplicateName' };
  }
  return errors;
}

export const countInventoryErrors = (errors: InventoryErrors) => Object.values(errors).reduce((sum, row) => sum + Object.keys(row).length, 0);
