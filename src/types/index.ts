export interface AuditFields {
  create_by: string;
  create_date: string;
  last_update_by: string;
  last_update_date: string;
}

export interface User extends AuditFields {
  id: string;
  login_name: string;
  user_name: string;
  email?: string;
  avatar?: string;
  status: 1 | 0;
  role_ids: string[];
  roles?: Role[];
  role_names?: string[];
}

export interface Role extends AuditFields {
  id: string;
  role_name: string;
  role_code: string;
  description?: string;
  status: 1 | 0;
  menu_count: number;
  button_count: number;
}

export interface Menu extends AuditFields {
  id: string;
  parent_id?: string;
  menu_name: string;
  menu_code: string;
  route_path: string;
  icon?: string;
  sort_no: number;
  visible: 1 | 0;
  status: 1 | 0;
  children?: Menu[];
  buttons?: Button[];
}

export interface Button extends AuditFields {
  id: string;
  menu_id: string;
  button_name: string;
  button_code: string;
  permission_code: string;
  sort_no: number;
  status: 1 | 0;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

export interface PageResult<T> {
  records: T[];
  pageNo: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}

export interface CountResult { count: number }
export interface AuthTokens { accessToken: string; refreshToken: string }
export interface UserPreferences {
  agent_mode_entry: 'ask' | 'agent' | 'console';
  agent_entries_prompt: 'ask' | 'banner' | 'hidden';
}
export interface AuthMeResponse {
  user: User;
  roles: string[];
  roleNames: string[];
  permissions: string[];
  menus: Menu[];
  preferences: UserPreferences;
}

export interface SystemSettings {
  basic: { siteName: string; description: string };
  security: { passwordMinLength: number; requireNumber: boolean; requireLetter: boolean };
  notifications: { systemNotice: boolean; accountChange: boolean; weeklySummary: boolean };
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  time: string;
  icon: string;
}

export interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalMenus: number;
  todos: { id: string; title: string; description: string; route: string; icon: string }[];
  activities: Activity[];
}
