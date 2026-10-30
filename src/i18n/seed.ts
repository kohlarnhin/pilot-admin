import { getLocale } from './store';
import { seedText as chinese } from './locales/zh-CN/seed';
import { seedText as english } from './locales/en-US/seed';
import type { AgentProfile } from '@/types';

/** 种子数据允许数组，不进入 t() 的系统消息树。 */
export interface SeedText {
  roles: Record<'admin' | 'operator' | 'viewer', { name: string; description: string }>;
  accountNames: readonly [string, string, string];
  familyNames: readonly string[];
  givenNames: readonly string[];
  nameOrder: 'family-given' | 'given-family';
  nameSeparator: string;
  settingsDescription: string;
  model: { provider: string; name: string };
  exampleProjects: { names: string[]; description: string };
  agentProfile: AgentProfile;
  agentSessions: {
    checkPrompt: string;
    checkReply: string;
    demoName: string;
    createPrompt: string;
    chooseRole: string;
    longTitle: string;
    createTitle: string;
    workTitle: string;
  };
}

export const getSeedText = (): SeedText => getLocale() === 'en-US' ? english : chinese;
