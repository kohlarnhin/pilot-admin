import { appConfig } from '@/config/app';
import { DEFAULT_MENUS } from '@/config/menus';
import type {
  Activity,
  AgentConfig,
  AgentMessage,
  AgentProfile,
  AgentSession,
  Role,
  SystemSettings,
  User,
  UserPreferences,
} from '@/types';

export interface MockUser extends User {
  password: string;
  preferences: UserPreferences;
}

export interface MockRole extends Role {
  menuIds: string[];
  buttonIds: string[];
}

export interface MockAgentSession extends AgentSession {
  userId: string;
  messages: AgentMessage[];
}

export interface MockDb {
  agentSessions: MockAgentSession[];
  agentProfile: AgentProfile;
  agentConfigs: (AgentConfig & { apiKey: string })[];
  version: 3;
  users: MockUser[];
  roles: MockRole[];
  menuNames: Record<string, string>;
  buttonNames: Record<string, string>;
  settings: SystemSettings;
  activities: Activity[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  agent_mode_entry: 'ask',
};

export const SEED_USER_COUNT = 150;

const audit = {
  create_by: 'system',
  create_date: '2026-01-01T08:00:00+08:00',
  last_update_by: 'system',
  last_update_date: '2026-01-01T08:00:00+08:00',
};
const flatMenus = DEFAULT_MENUS.flatMap((menu) => [menu, ...(menu.children || [])]);
const allButtons = flatMenus.flatMap((menu) => menu.buttons || []);

export function createSeed(): MockDb {
  const role = (
    id: string,
    role_name: string,
    role_code: string,
    description: string,
    menuIds: string[],
    buttonIds: string[],
  ): MockRole => ({
    ...audit,
    id,
    role_name,
    role_code,
    description,
    status: 1,
    menuIds,
    buttonIds,
    menu_count: menuIds.length,
    button_count: buttonIds.length,
  });
  const roles = [
    role(
      'role-admin',
      '超级管理员',
      'ROLE_ADMIN',
      '管理所有菜单、账号与系统配置',
      flatMenus.map((menu) => menu.id),
      allButtons.map((button) => button.id),
    ),
    role(
      'role-operator',
      '运营人员',
      'ROLE_OPERATOR',
      '查看概览，维护用户信息与状态',
      ['dashboard', 'system', 'users', 'examples', 'components', 'ai-permissions'],
      ['user-update', 'agent-use'],
    ),
    role(
      'role-viewer',
      '访客',
      'ROLE_VIEWER',
      '只读浏览概览与组件示例',
      ['dashboard', 'examples', 'components'],
      [],
    ),
  ];
  const accounts = [
    {
      login_name: 'admin',
      user_name: '林知行',
      password: 'admin123',
      role_ids: ['role-admin'],
    },
    {
      login_name: 'operator',
      user_name: '陈思远',
      password: 'operator123',
      role_ids: ['role-operator'],
    },
    {
      login_name: 'viewer',
      user_name: '许清和',
      password: 'viewer123',
      role_ids: ['role-viewer'],
    },
  ];
  const surnames = [
    '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '胡', '朱', '林', '何', '高', '郭', '马', '罗', '梁',
  ];
  const givenNames = [
    '雨桐', '子涵', '思源', '明轩', '若宁', '嘉禾', '星辰', '书瑶', '沐阳', '景行',
    '安然', '知夏', '亦凡', '清越', '文博', '语棠', '致远', '欣怡', '一诺',
  ];
  const users: MockUser[] = Array.from({ length: SEED_USER_COUNT }, (_, index) => {
    const account = accounts[index];
    const date = new Date(Date.UTC(2026, 0, 2 + index, 1 + index % 8, index % 60)).toISOString();
    return {
      ...audit,
      id: `u-${String(index + 1).padStart(4, '0')}`,
      login_name: account?.login_name || `user_${String(index + 1).padStart(3, '0')}`,
      user_name: account?.user_name || `${surnames[index % surnames.length]}${givenNames[index % givenNames.length]}`,
      email: `${account?.login_name || `user${String(index + 1).padStart(3, '0')}`}@example.com`,
      password: account?.password || 'pilot123',
      role_ids: account?.role_ids || [index % 3 === 0 ? 'role-operator' : 'role-viewer'],
      status: index > 2 && index % 11 === 0 ? 0 : 1,
      create_date: date,
      last_update_date: date,
      preferences: { ...DEFAULT_USER_PREFERENCES },
    };
  });

  return {
    agentSessions: seedAgentSessions(roles),
    agentProfile: {
      name: '领航助手',
      greeting: '你好，我是你的工作助手。可以帮你查看概况、查找用户、维护账号和执行巡检。',
      suggestions: [
        { label: '概况统计', prompt: '概况统计' },
        { label: '查找用户', prompt: '查找用户 陈' },
        { label: '新增用户', prompt: '新增用户 林沐晨' },
        { label: '账号巡检', prompt: '账号巡检' },
      ],
    },
    agentConfigs: [
      {
        id: 'model-demo',
        provider: 'OpenAI 兼容',
        base_url: 'https://api.example.com/v1',
        model_code: 'pilot-demo',
        model_name: '演示模型',
        apiKey: 'demo-key',
        api_key_masked: '••••••••',
        status: 1,
        create_date: audit.create_date,
        last_update_date: audit.last_update_date,
      },
    ],
    version: 3,
    users,
    roles,
    menuNames: {},
    buttonNames: {},
    settings: {
      basic: {
        siteName: appConfig.name,
        description: appConfig.description,
      },
      security: {
        passwordMinLength: 6,
        requireNumber: true,
        requireLetter: true,
      },
      notifications: {
        systemNotice: true,
        accountChange: true,
        weeklySummary: false,
      },
    },
    activities: [
      {
        id: 'activity-1',
        actor: '林知行',
        action: '更新了系统基本设置',
        time: '2026-10-29T09:40:00+08:00',
        icon: 'settings-2',
      },
      {
        id: 'activity-2',
        actor: '陈思远',
        action: '完善了用户资料',
        time: '2026-10-29T09:25:00+08:00',
        icon: 'user',
      },
      {
        id: 'activity-3',
        actor: '林知行',
        action: '调整了运营人员的菜单权限',
        time: '2026-10-28T16:10:00+08:00',
        icon: 'shield-check',
      },
      {
        id: 'activity-4',
        actor: '林知行',
        action: '创建了访客角色',
        time: '2026-10-28T14:30:00+08:00',
        icon: 'plus',
      },
      {
        id: 'activity-5',
        actor: '系统',
        action: '演示数据已准备就绪',
        time: '2026-10-28T09:00:00+08:00',
        icon: 'circle-check',
      },
    ],
  };
}

// 固定历史便于验证会话分页；长会话保留 60 条消息。
function seedAgentSessions(roles: MockRole[]): MockAgentSession[] {
  return Array.from({ length: 25 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 29 - index, 8)).toISOString();
    const count = index === 0 ? 60 : 2;
    const messages: AgentMessage[] = Array.from({ length: count }, (_, item) => ({
      id: `seed-${index + 1}-message-${item + 1}`,
      sequence_no: item + 1,
      role: item % 2 === 0 ? 'user' : 'assistant',
      content: item % 2 === 0
        ? `第 ${Math.floor(item / 2) + 1} 次账号检查`
        : `检查已完成，账号状态正常。\n\n- 保持最小权限\n- 定期核对账号状态`,
      data_changed: false,
      create_date: date,
    }));

    if (index === 1) {
      messages[0].content = '新增用户 演示新用户';
      messages[1] = {
        ...messages[1],
        content: '为 **演示新用户** 选择一个角色，确认后再创建账号。',
        choices: roles.filter((item) => item.status === 1).map((item) => ({
          id: `role:${item.id}`,
          label: item.role_name,
        })),
        task_context: {
          tool: 'create-user',
          data: { name: '演示新用户' },
        },
      };
    }

    return {
      id: `demo-session-${index + 1}`,
      userId: 'u-0001',
      title: index === 0 ? '账号检查记录 · 长会话示例'
        : index === 1 ? '新增用户 · 选择角色示例' : `工作记录 ${String(index + 1).padStart(2, '0')}`,
      message_count: messages.length,
      context_character_count: messages.reduce((sum, message) => sum + message.content.length, 0),
      create_date: date,
      last_message_date: date,
      messages,
    };
  });
}
