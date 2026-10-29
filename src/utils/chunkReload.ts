import { t } from '@/i18n';
const CHUNK_RELOAD_KEY = 'pilot-admin:chunk-reload-at';
const CHUNK_RELOAD_WINDOW_MS = 10_000;

let lastReloadAt = 0;

export const isChunkLoadError = (error: unknown): boolean => {
  const message = typeof error === 'string'
    ? error
    : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';

  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload (?:CSS|JS)|Loading (?:CSS )?chunk .+ failed/i.test(message);
};

/** 同一标签页在短时间内只自动刷新一次；无法保存标记时保留手动刷新入口。 */
export const reloadOnceForChunkError = (): boolean => {
  const now = Date.now();
  if (lastReloadAt && now - lastReloadAt < CHUNK_RELOAD_WINDOW_MS) return false;

  try {
    const storedReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY));
    if (Number.isFinite(storedReloadAt) && storedReloadAt > 0 && now - storedReloadAt < CHUNK_RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
  } catch (error) {
    console.error(t('client.reloadMarkerError'), error);
    return false;
  }

  lastReloadAt = now;
  // 先让错误页的刷新提示完成绘制，再开始重新加载。
  window.setTimeout(() => window.location.reload(), 100);
  return true;
};
