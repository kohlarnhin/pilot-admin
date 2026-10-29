import { create } from 'zustand';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { appConfig } from '@/config/app';
import { clearQueryCache } from '@/api/queryCache';
import { triggerDataChangeSideEffects } from '@/api/services/agentEvents';
import type { Locale } from './types';

export const LOCALE_STORAGE_KEY = 'pilot-admin:locale:v1';
export const isLocale = (value: unknown): value is Locale => value === 'zh-CN' || value === 'en-US';

const readLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch { /* 存储不可用时使用默认语言。 */ }
  return appConfig.defaultLocale;
};

const applyDocumentLocale = (locale: Locale) => {
  document.documentElement.lang = locale;
  dayjs.locale(locale === 'zh-CN' ? 'zh-cn' : 'en');
};

const initialLocale = readLocale();
applyDocumentLocale(initialLocale);

let refreshLocalizedMe: (() => Promise<void>) | undefined;
let localeGeneration = 0;

/** 认证层注册回调，基础控件无需反向依赖认证 store。 */
export function registerLocaleRefresh(handler: () => Promise<void>): void {
  refreshLocalizedMe = handler;
}

async function switchLocale(locale: Locale, persist: boolean): Promise<void> {
  if (useLocaleStore.getState().locale === locale) return;
  const generation = ++localeGeneration;
  if (persist) {
    try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* 本次会话仍可切换。 */ }
  }
  applyDocumentLocale(locale);
  clearQueryCache();
  useLocaleStore.setState({ locale });
  try {
    await refreshLocalizedMe?.();
  } catch {
    // 临时刷新失败不改变认证状态；后续数据操作仍由 service 校验。
  } finally {
    if (generation === localeGeneration) triggerDataChangeSideEffects('locale');
  }
}

export const useLocaleStore = create<{ locale: Locale; setLocale: (locale: Locale) => Promise<void> }>(() => ({
  locale: initialLocale,
  setLocale: (locale) => switchLocale(locale, true),
}));

export const getLocale = (): Locale => useLocaleStore.getState().locale;
export const setLocale = (locale: Locale): Promise<void> => useLocaleStore.getState().setLocale(locale);

window.addEventListener('storage', (event) => {
  if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
    void switchLocale(isLocale(event.newValue) ? event.newValue : readLocale(), false);
  }
});
