import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandId } from '@/agent/commands';

let commands: typeof import('@/agent/commands');

beforeEach(async () => {
  vi.resetModules();
  commands = await import('@/agent/commands');
});

describe('parseCommand', () => {
  it.each<[string, CommandId, string]>([
    ['Create user Alice', 'createUser', 'Alice'],
    ['Add user Alice Zhang', 'createUser', 'Alice Zhang'],
    ['  cReAtE\t  UsEr  Alice  ', 'createUser', 'Alice'],
    ['Create user:Alice', 'createUser', 'Alice'],
    ['Create user： 张三', 'createUser', '张三'],
    ['新增用户张三', 'createUser', '张三'],
    ['创建用户：李四', 'createUser', '李四'],
    ['Find users Alice', 'findUsers', 'Alice'],
    ['停用用户王五', 'disableUsers', '王五'],
    ['Open page: /system/users', 'openPage', '/system/users'],
    ['打开页面：用户管理', 'openPage', '用户管理'],
    ['Create user', 'createUser', ''],
  ])('extracts the argument from %j', (text, id, argument) => {
    expect(commands.parseCommand(text, id)).toEqual({ matched: true, argument });
  });

  it.each([
    'create username Alice',
    'create user_name Alice',
    'precreate user Alice',
    'please create user Alice',
    '请新增用户张三',
    '新增用户Alice',
  ])('rejects an invalid prefix or boundary: %j', (text) => {
    expect(commands.parseCommand(text, 'createUser')).toEqual({ matched: false, argument: '' });
  });

  it('allows a non-prefix command inside a sentence, with word boundaries', () => {
    expect(commands.parseCommand('Please help: today', 'help')).toEqual({ matched: true, argument: 'today' });
    expect(commands.parseCommand('shelp', 'help').matched).toBe(false);
    expect(commands.parseCommand('helpful', 'help').matched).toBe(false);
  });

  it.each(['zh-CN', 'en-US'] as const)('accepts phrases from both locales while using %s', async (locale) => {
    const { setLocale } = await import('@/i18n');
    await setLocale(locale);
    for (const phrase of ['Create user Alice', 'Add user Alice', '新增用户 Alice', '创建用户 Alice']) {
      expect(commands.parseCommand(phrase, 'createUser')).toEqual({ matched: true, argument: 'Alice' });
    }
  });
});
