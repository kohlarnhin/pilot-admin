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

export type AuditModule = 'auth' | 'user' | 'role' | 'menu' | 'settings' | 'agent_config' | 'agent_profile' | 'profile' | 'example';
export type AuditResult = 'success' | 'failure';
export type AuditReason = 'invalid_credentials' | 'account_disabled' | 'forbidden' | 'invalid_input' | 'not_found' | 'conflict';
export type AuditSection = keyof SystemSettings;
export type AuditProfileField = 'user_name' | 'email' | 'agent_mode_entry';

/** 每个动作只接受业务代码和数量，不接受任意输入对象。 */
export interface AuditParamsMap {
  'auth.login': Record<never, never>;
  'auth.login_failed': Record<never, never>;
  'auth.logout': Record<never, never>;
  'auth.password_change': Record<never, never>;
  'user.create': Record<never, never>;
  'user.update': Record<never, never>;
  'user.status': { status: 0 | 1 };
  'user.reset_password': Record<never, never>;
  'user.delete': Record<never, never>;
  'role.create': Record<never, never>;
  'role.update': Record<never, never>;
  'role.status': { status: 0 | 1 };
  'role.delete': Record<never, never>;
  'role.permissions': { menu_count: number; button_count: number };
  'menu.rename': Record<never, never>;
  'button.rename': Record<never, never>;
  'settings.update': { section: AuditSection };
  'settings.reset_demo': Record<never, never>;
  'agent_config.create': Record<never, never>;
  'agent_config.update': Record<never, never>;
  'agent_config.delete': Record<never, never>;
  'agent_config.status': { status: 0 | 1 };
  'agent_profile.update': Record<never, never>;
  'profile.update': { fields: AuditProfileField[] };
  'example.create': Record<never, never>;
  'example.update': Record<never, never>;
  'example.delete': Record<never, never>;
  'example.batch_delete': { count: number };
  'example.import': { count: number; failed: number };
}
export type AuditAction = keyof AuditParamsMap;
export interface AuditDisplayParams {
  status?: 0 | 1;
  menu_count?: number;
  button_count?: number;
  section?: AuditSection;
  count?: number;
  failed?: number;
  fields?: AuditProfileField[];
}
export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name: string;
  module: AuditModule;
  action: AuditAction;
  target_type?: 'user' | 'role' | 'menu' | 'button' | 'settings' | 'agent_config' | 'agent_profile' | 'example';
  target_id?: string;
  target_name?: string;
  params?: AuditDisplayParams;
  result: AuditResult;
  reason?: AuditReason;
  trace_id: string;
  create_date: string;
}
export interface AuditActivity {
  id: string;
  actor_name: string;
  action: AuditAction;
  target_name?: string;
  display_params: AuditDisplayParams;
  create_date: string;
}
export type ExampleProjectStatus = 'active' | 'paused' | 'archived';
export interface ExampleProject extends AuditFields {
  id: string;
  name: string;
  code: string;
  owner: string;
  status: ExampleProjectStatus;
  description?: string;
}

export interface ProjectImportReceipt {
  import_id: string;
  row_no: number;
  status: 'created' | 'failed';
  project_id?: string;
  error_code?: number;
  actor_id: string;
  create_date: string;
}

export interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalMenus: number;
  todos: { id: string; code: 'users' | 'roles' | 'components' | 'settings'; route: string; icon: string }[];
  activities: AuditActivity[];
}

export type AgentMessageRole = 'user' | 'assistant';
export interface AgentChoice {
  id: string;
  label: string;
}
export interface AgentAttachmentMetadata {
  attachmentId: string;
  fileName: string;
  size: number;
  mimeType: string;
  lineCount?: number;
}
export interface AgentSelection {
  type: 'selection';
  version: 1;
  title: string;
  options: { id: string; label: string; description: string; disabled?: boolean }[];
  defaultSelectedIds: string[];
  minSelected: number;
  maxSelected: number;
}
export interface AgentPageActionOutcome {
  status: 'completed' | 'cancelled';
  summary: string;
  count?: number;
  finishedAt: string;
}
export interface AgentPageAction {
  type: 'page_action';
  version: 1;
  action: 'navigate' | 'modal';
  title: string;
  description: string;
  route?: string;
  actionKey?: string;
  autoOpen?: boolean;
  outcome?: AgentPageActionOutcome;
}
export type AgentPlanStepStatus = 'pending' | 'running' | 'completed' | 'waiting_user' | 'failed' | 'stopped';
export interface AgentPlanStep {
  type: 'check';
  title: string;
  description: string;
  status: AgentPlanStepStatus;
  reason?: string;
  outcome?: Record<string, number>;
}
export interface AgentExecutionPlan {
  type: 'execution_plan';
  version: 1;
  title: string;
  status: 'proposed' | 'running' | 'waiting_user' | 'failed' | 'stopped' | 'completed';
  steps: AgentPlanStep[];
  executionId?: string;
  reason?: string;
  revision?: number;
}
export type AgentInteraction = AgentSelection | AgentPageAction | AgentExecutionPlan | {
  type: 'attachment_metadata';
  attachments: AgentAttachmentMetadata[];
} | {
  type: 'selection_submission';
  selectedIds: string[];
};
export interface AgentTaskContext {
  tool: string;
  data: Record<string, unknown>;
}
export interface AgentMessage {
  id: string | number;
  sequence_no: number;
  role: AgentMessageRole;
  kind?: 'message' | 'progress' | 'error';
  content: string;
  data_changed: boolean;
  choices?: AgentChoice[];
  create_date: string;
  source_message_id?: string | number;
  selected_choice_id?: string;
  interaction?: AgentInteraction;
  task_context?: AgentTaskContext;
}
export interface AgentSession {
  id: string | number;
  title: string;
  message_count: number;
  context_character_count: number;
  create_date: string;
  last_message_date: string;
}
export interface AgentSessionDetail extends AgentSession {
  messages: AgentMessage[];
  has_more_before: boolean;
}
export interface AgentChatResult {
  sessionId: string | number;
  messageId: string | number;
  message: string;
  data_changed: boolean;
  choices: AgentChoice[];
  interaction?: AgentInteraction;
}
export interface AgentChatProgress {
  stage: string;
  message: string;
  elapsedSeconds: number;
  messageId?: string | number;
  sequenceNo?: number;
  createDate?: string;
}
export interface AgentConfig {
  id: string;
  provider: string;
  base_url: string;
  model_code: string;
  model_name: string;
  api_key_masked: string;
  status: 1 | 0;
  create_date: string;
  last_update_date: string;
}
export interface AgentProfile {
  name: string;
  greeting: string;
  suggestions: { label: string; prompt: string }[];
}
