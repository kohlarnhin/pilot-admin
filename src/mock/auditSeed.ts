import { getSeedText } from '@/i18n/seed';
import { allowAuditParams, auditModule, AUDIT_PARAMS } from '@/audit/catalog';
import type { AuditAction, AuditLog, AuditModule, ExampleProject, Role, User } from '@/types';

/** 固定锚点之前 30 天，每六小时一条；只存代码和种子实体的显示名。 */
export function seedAuditLogs(users: User[], roles: Role[], projects: ExampleProject[]): AuditLog[] {
  const text = getSeedText();
  const actions = Object.keys(AUDIT_PARAMS) as AuditAction[];
  const anchor = Date.parse('2026-10-28T09:00:00+08:00');
  return Array.from({ length: 120 }, (_, index) => {
    const action = actions[index % actions.length];
    const module = auditModule(action);
    const actor = users[index % 3];
    const user = users[(index + 3) % users.length];
    const role = roles[index % roles.length];
    const project = projects[index % projects.length];
    const userTarget = {
      target_type: 'user' as const,
      target_id: user.id,
      target_name: user.user_name,
    };
    const targets: Record<AuditModule, Pick<AuditLog, 'target_type' | 'target_id' | 'target_name'>> = {
      auth: userTarget,
      user: userTarget,
      role: {
        target_type: 'role',
        target_id: role.id,
        target_name: role.role_name,
      },
      menu: {
        target_type: action === 'button.rename' ? 'button' : 'menu',
        target_id: action === 'button.rename' ? 'user-update' : 'users',
        target_name: user.user_name,
      },
      settings: {
        target_type: 'settings',
      },
      agent_config: {
        target_type: 'agent_config',
        target_id: 'model-demo',
        target_name: text.model.name,
      },
      agent_profile: {
        target_type: 'agent_profile',
        target_name: text.agentProfile.name,
      },
      profile: {
        target_type: 'user',
        target_id: actor.id,
        target_name: actor.user_name,
      },
      example: {
        target_type: 'example',
        target_id: project.id,
        target_name: project.name,
      },
    };
    const params = allowAuditParams(action, {
      status: index % 2,
      menu_count: 6,
      button_count: 2,
      section: (['basic', 'security', 'notifications'] as const)[index % 3],
      count: 3,
      fields: ['user_name', 'email'],
    });
    const failure = index % 7 === 6 || action === 'auth.login_failed';
    return {
      id: `audit-seed-${String(index + 1).padStart(3, '0')}`,
      actor_id: actor.id,
      actor_name: actor.user_name,
      module,
      action,
      ...(action === 'example.batch_delete' ? {} : targets[module]),
      ...(Object.keys(params).length ? { params } : {}),
      result: failure ? 'failure' : 'success',
      ...(failure ? { reason: action === 'auth.login_failed' ? 'invalid_credentials' as const : 'forbidden' as const } : {}),
      trace_id: `mock-seed-${index + 1}`,
      create_date: new Date(anchor - (index + 1) * 6 * 60 * 60 * 1000).toISOString(),
    };
  });
}
