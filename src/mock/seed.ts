import { seedAuditLogs } from './auditSeed';
import { getSeedText } from '@/i18n/seed';
import defaultText from '@/i18n/locales/zh-CN/common';
import { appConfig } from '@/config/app';
import { DEFAULT_MENUS } from '@/config/menus';
import { collectMenuCatalog, type PermissionCatalog } from './permissionCatalog';
import type {
  AuditLog,
  ExampleProject,
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
  auto_grant: boolean;
  menuIds: string[];
  buttonIds: string[];
}

export interface MockAgentSession extends AgentSession {
  userId: string;
  messages: AgentMessage[];
}

export type MockAuditLog = AuditLog;
export type MockExampleProject = ExampleProject;

export interface MockDb {
  agentSessions: MockAgentSession[];
  agentProfile: AgentProfile;
  agentProfileCustomized?: boolean;
  agentConfigs: (AgentConfig & { apiKey: string })[];
  version: 5;
  permissionCatalog: PermissionCatalog;
  users: MockUser[];
  roles: MockRole[];
  menuNames: Record<string, string>;
  buttonNames: Record<string, string>;
  settings: SystemSettings;
  auditLogs: MockAuditLog[];
  exampleProjects: MockExampleProject[];
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
const { menuIds: allMenuIds, buttonIds: allButtonIds } = collectMenuCatalog(DEFAULT_MENUS);

export function createSeed(): MockDb {
  const text = getSeedText();
  const role = (
    id: string,
    role_name: string,
    role_code: string,
    description: string,
    menuIds: string[],
    buttonIds: string[],
    auto_grant = false,
  ): MockRole => ({
    ...audit,
    id,
    role_name,
    role_code,
    description,
    status: 1,
    menuIds,
    buttonIds,
    auto_grant,
    menu_count: menuIds.length,
    button_count: buttonIds.length,
  });
  const roles = [
    role(
      'role-admin',
      text.roles.admin.name,
      'ROLE_ADMIN',
      text.roles.admin.description,
      [...allMenuIds],
      [...allButtonIds],
      true,
    ),
    role(
      'role-operator',
      text.roles.operator.name,
      'ROLE_OPERATOR',
      text.roles.operator.description,
      ['dashboard', 'system', 'users', 'examples', 'components', 'crud-example', 'ai-permissions'],
      ['user-update', 'agent-use', 'example-create', 'example-update'],
    ),
    role(
      'role-viewer',
      text.roles.viewer.name,
      'ROLE_VIEWER',
      text.roles.viewer.description,
      ['dashboard', 'examples', 'components', 'crud-example'],
      [],
    ),
  ];
  const accounts = [
    {
      login_name: 'admin',
      user_name: text.accountNames[0],
      password: 'admin123',
      role_ids: ['role-admin'],
    },
    {
      login_name: 'operator',
      user_name: text.accountNames[1],
      password: 'operator123',
      role_ids: ['role-operator'],
    },
    {
      login_name: 'viewer',
      user_name: text.accountNames[2],
      password: 'viewer123',
      role_ids: ['role-viewer'],
    },
  ];
  const { familyNames, givenNames, nameOrder, nameSeparator } = text;
  const users: MockUser[] = Array.from({ length: SEED_USER_COUNT }, (_, index) => {
    const account = accounts[index];
    const date = new Date(Date.UTC(2026, 0, 2 + index, 1 + index % 8, index % 60)).toISOString();
    return {
      ...audit,
      id: `u-${String(index + 1).padStart(4, '0')}`,
      login_name: account?.login_name || `user_${String(index + 1).padStart(3, '0')}`,
      user_name: account?.user_name || (nameOrder === 'family-given'
        ? [familyNames[index % familyNames.length], givenNames[index % givenNames.length]]
        : [givenNames[index % givenNames.length], familyNames[index % familyNames.length]]).join(nameSeparator),
      email: `${account?.login_name || `user${String(index + 1).padStart(3, '0')}`}@example.com`,
      password: account?.password || 'pilot123',
      role_ids: account?.role_ids || [index % 3 === 0 ? 'role-operator' : 'role-viewer'],
      status: index > 2 && index % 11 === 0 ? 0 : 1,
      create_date: date,
      last_update_date: date,
      preferences: { ...DEFAULT_USER_PREFERENCES },
    };
  });

  const projectAnchor = Date.parse('2026-10-28T09:00:00+08:00');
  const exampleProjects: MockExampleProject[] = Array.from({ length: 80 }, (_, index) => {
    const updatedAt = projectAnchor - index * 6 * 60 * 60 * 1000 - (index * 17 % 60) * 60 * 1000;
    const createdAt = updatedAt - (3 + Math.floor(index / 10)) * 24 * 60 * 60 * 1000;
    return {
      id: `project-${String(index + 1).padStart(3, '0')}`,
      name: `${text.exampleProjects.names[index % text.exampleProjects.names.length]} ${index + 1}`,
      code: `PRJ-${String(index + 1).padStart(3, '0')}`,
      owner: users[(index * 7) % users.length].user_name,
      status: (['active', 'paused', 'archived'] as const)[index % 3],
      description: index < 5 ? text.exampleProjects.longDescription : text.exampleProjects.description,
      create_by: users[index % users.length].id,
      create_date: new Date(createdAt).toISOString(),
      last_update_by: users[(index * 7) % users.length].id,
      last_update_date: new Date(updatedAt).toISOString(),
    };
  });

  return {
    agentSessions: seedAgentSessions(roles),
    agentProfile: structuredClone(text.agentProfile),
    agentConfigs: [
      {
        id: 'model-demo',
        provider: text.model.provider,
        base_url: 'https://api.example.com/v1',
        model_code: 'pilot-demo',
        model_name: text.model.name,
        apiKey: 'demo-key',
        api_key_masked: '••••••••',
        status: 1,
        create_date: audit.create_date,
        last_update_date: audit.last_update_date,
      },
    ],
    version: 5,
    permissionCatalog: { menuIds: [...allMenuIds], buttonIds: [...allButtonIds] },
    users,
    roles,
    menuNames: {},
    buttonNames: {},
    settings: {
      basic: {
        siteName: appConfig.name,
        description: appConfig.description === defaultText.appDescription ? text.settingsDescription : appConfig.description,
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
    auditLogs: seedAuditLogs(users, roles, exampleProjects),
    exampleProjects,
  };
}

// 固定历史便于验证会话分页；长会话保留 60 条消息。
function seedAgentSessions(roles: MockRole[]): MockAgentSession[] {
  const text = getSeedText().agentSessions;
  return Array.from({ length: 25 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 29 - index, 8)).toISOString();
    const count = index === 0 ? 60 : 2;
    const messages: AgentMessage[] = Array.from({ length: count }, (_, item) => ({
      id: `seed-${index + 1}-message-${item + 1}`,
      sequence_no: item + 1,
      role: item % 2 === 0 ? 'user' : 'assistant',
      content: item % 2 === 0
        ? text.checkPrompt.replace('{count}', String(Math.floor(item / 2) + 1))
        : text.checkReply,
      data_changed: false,
      create_date: date,
    }));

    if (index === 1) {
      messages[0].content = text.createPrompt.replace('{name}', text.demoName);
      messages[1] = {
        ...messages[1],
        content: text.chooseRole.replace('{name}', text.demoName),
        choices: roles.filter((item) => item.status === 1).map((item) => ({
          id: `role:${item.id}`,
          label: item.role_name,
        })),
        task_context: {
          tool: 'create-user',
          data: { name: text.demoName },
        },
      };
    }

    return {
      id: `demo-session-${index + 1}`,
      userId: 'u-0001',
      title: index === 0 ? text.longTitle
        : index === 1 ? text.createTitle : text.workTitle.replace('{index}', String(index + 1).padStart(2, '0')),
      message_count: messages.length,
      context_character_count: messages.reduce((sum, message) => sum + message.content.length, 0),
      create_date: date,
      last_message_date: date,
      messages,
    };
  });
}
