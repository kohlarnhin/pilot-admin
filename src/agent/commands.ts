import chinese from '@/i18n/locales/zh-CN/agentCommands';
import english from '@/i18n/locales/en-US/agentCommands';
import { getLocale } from '@/i18n';
import type { MessageKey, MessageParams } from '@/i18n/types';

export type CommandId = keyof typeof chinese;

const prefixCommands = new Set<CommandId>(['createUser', 'findUsers', 'disableUsers', 'openPage']);

type CommandMessageKey = { [K in MessageKey]: [MessageParams<K>] extends [never] ? K : never }[MessageKey];

interface CommandMetadata {
  descriptionKey: CommandMessageKey;
  permissions?: string[];
  accessKey?: CommandMessageKey;
}

/** 只读能力说明；执行权限仍由工具和 service 校验。所有命令都需要 agent:use。 */
const commandMetadata: Record<CommandId, CommandMetadata> = {
  createUser: { descriptionKey: 'assistantSettings.commands.items.createUser', permissions: ['user:create'] },
  findUsers: { descriptionKey: 'assistantSettings.commands.items.findUsers', accessKey: 'assistantSettings.commands.access.users' },
  disableUsers: { descriptionKey: 'assistantSettings.commands.items.disableUsers', permissions: ['user:update'], accessKey: 'assistantSettings.commands.access.users' },
  openPage: { descriptionKey: 'agentTools.openPage.description', accessKey: 'assistantSettings.commands.access.destination' },
  help: { descriptionKey: 'assistantSettings.commands.items.help' },
  overview: { descriptionKey: 'assistantSettings.commands.items.overview', accessKey: 'assistantSettings.commands.access.users' },
  accountAudit: { descriptionKey: 'assistantSettings.commands.items.accountAudit', accessKey: 'assistantSettings.commands.access.audit' },
  assignRoles: { descriptionKey: 'agentTools.assignRoles.description', permissions: ['user:update'], accessKey: 'assistantSettings.commands.access.users' },
  simulateError: { descriptionKey: 'assistantSettings.commands.items.simulateError' },
};

export const commandCatalog = (Object.keys(chinese) as CommandId[]).map((id) => ({
  id,
  titleKey: `agentCommands.${id}.primary` as const,
  ...commandMetadata[id],
  takesArgument: prefixCommands.has(id),
  phrases: { 'zh-CN': Object.values(chinese[id]), 'en-US': Object.values(english[id]) },
}));

const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const separator = /[\s:\uFF1A]/u;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phrases = Object.fromEntries((Object.keys(chinese) as CommandId[]).map((id) => [
  id,
  [...new Set([...Object.values(chinese[id]), ...Object.values(english[id])])]
    .sort((a, b) => b.length - a.length)
    .map((phrase) => ({
      expression: new RegExp(phrase.trim().split(/\s+/).map(escapeRegex).join('\\s+'), 'giu'),
      startsCjk: cjk.test(Array.from(phrase)[0]),
      endsCjk: cjk.test(Array.from(phrase).at(-1)!),
    })),
])) as Record<CommandId, { expression: RegExp; startsCjk: boolean; endsCjk: boolean }[]>;

/** 匹配和取参共用边界；语言切换不改变已存命令和 choice id 的可执行性。 */
export function parseCommand(text: string, commandId: CommandId): { matched: boolean; argument: string } {
  const input = text.trim();
  for (const phrase of phrases[commandId]) {
    phrase.expression.lastIndex = 0;
    for (const match of input.matchAll(phrase.expression)) {
      const start = match.index;
      const end = start + match[0].length;
      if (prefixCommands.has(commandId) && start !== 0) break;
      if (start > 0 && !phrase.startsCjk && !separator.test(input[start - 1])) continue;
      const next = Array.from(input.slice(end))[0];
      if (next && !separator.test(next) && !(phrase.endsCjk && cjk.test(next))) continue;
      return { matched: true, argument: input.slice(end).trim().replace(/^[:\uFF1A]\s*/u, '').trim() };
    }
  }
  return { matched: false, argument: '' };
}

export function commandPrompt(commandId: CommandId, argument = ''): string {
  const command = (getLocale() === 'en-US' ? english : chinese)[commandId].primary;
  return argument ? `${command} ${argument}` : command;
}

/** prompt 卡片保留原 id；提交时只本地化命令，用户参数保持原文。 */
export function localizeCommandPrompt(text: string): string {
  for (const id of Object.keys(chinese) as CommandId[]) {
    const parsed = parseCommand(text, id);
    if (parsed.matched) return commandPrompt(id, parsed.argument);
  }
  return text;
}
