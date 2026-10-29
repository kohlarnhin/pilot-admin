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
  todos: { id: string; code: 'users' | 'roles' | 'components' | 'settings'; route: string; icon: string }[];
  activities: Activity[];
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
