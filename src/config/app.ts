import common from '@/i18n/locales/zh-CN/common';

export const appConfig = {
  name: 'Pilot Admin',
  shortName: 'Pilot',
  zhName: '领航',
  description: common.appDescription,
  defaultLocale: 'zh-CN' as const,
  locales: [{ code: 'zh-CN', label: '简体中文' }, { code: 'en-US', label: 'English' }] as const,
  helpUrl: undefined as string | undefined,
};
