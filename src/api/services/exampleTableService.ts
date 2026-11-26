import { t } from '@/i18n';
import { requireMenu } from '@/mock/access';
import { delay, response } from '@/mock/helpers';
import type { ApiResponse } from '@/types';
import { validateInventory, type InventoryCategory, type InventoryErrors, type InventoryRow } from './exampleTableRules';

export type { InventoryRow, InventoryErrors } from './exampleTableRules';
export type InventorySaveResult = { success: true; savedAt: string } | { success: false; errors: InventoryErrors };

const SEED: readonly [InventoryCategory, number, number, boolean][] = [
  ['hardware', 199, 120, true], ['hardware', 259, 64, true], ['hardware', 1899, 18, true], ['hardware', 699, 0, false],
  ['hardware', 1299, 32, true], ['software', 399, 500, true], ['software', 2999, 40, true], ['software', 129, 800, false],
  ['software', 99, 999, true], ['service', 150, 60, true], ['service', 299, 200, true], ['service', 1999, 12, false],
];

/** 初始数据按当前语言生成；示例不写入 Mock DB。 */
export const createInventorySeed = (): InventoryRow[] => SEED.map(([category, price, stock, active], index) => {
  const no = String(index + 1).padStart(2, '0');
  return { id: `inv-${no}`, sku: `SKU-10${no}`, name: t(`exampleTable.seed.p${no}` as 'exampleTable.seed.p01'), category, price, stock, active };
});

export const exampleTableService = {
  async list(): Promise<ApiResponse<InventoryRow[]>> {
    await delay();
    requireMenu('/examples/editable-table');
    return response(createInventorySeed());
  },
  /** 无持久化的示例接口：服务端重复整表校验，并把 system 视为保留名称。 */
  async save(rows: InventoryRow[]): Promise<ApiResponse<InventorySaveResult>> {
    await delay();
    requireMenu('/examples/editable-table');
    const errors = validateInventory(rows);
    for (const row of rows) {
      if (row.name.trim().toLowerCase() === 'system') errors[row.id] = { ...errors[row.id], name: 'exampleTable.validation.reservedName' };
    }
    if (Object.keys(errors).length) return response({ success: false, errors });
    return response({ success: true, savedAt: new Date().toISOString() });
  },
};
