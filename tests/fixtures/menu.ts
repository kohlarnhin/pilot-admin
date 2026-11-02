import type { Button, Menu } from '@/types';

const audit = {
  create_by: 'test',
  create_date: '2026-01-01T08:00:00+08:00',
  last_update_by: 'test',
  last_update_date: '2026-01-01T08:00:00+08:00',
};

export const menu = (id: string, overrides: Partial<Menu> = {}): Menu => ({
  ...audit,
  id,
  menu_name: id,
  menu_code: id,
  route_path: '',
  sort_no: 0,
  visible: 1,
  status: 1,
  ...overrides,
});

export const button = (id: string, menuId: string): Button => ({
  ...audit,
  id,
  menu_id: menuId,
  button_name: id,
  button_code: id,
  permission_code: `${menuId}:${id}`,
  sort_no: 0,
  status: 1,
});
