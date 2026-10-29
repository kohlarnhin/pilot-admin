import type { AuthTokens } from '../types';

const TOKEN_STORAGE_KEY = 'pilot-admin:auth:tokens:v2';

type TokenChangeListener = (tokens: AuthTokens | null, previousTokens: AuthTokens | null) => void;

const externalChangeListeners = new Set<TokenChangeListener>();

function isAuthTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AuthTokens>;
  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshToken === 'string' &&
    candidate.refreshToken.length > 0
  );
}

function parseTokens(value: string | null): AuthTokens | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isAuthTokens(parsed)
      ? { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
      : null;
  } catch {
    return null;
  }
}

function readTokensFromStorage(): AuthTokens | null {
  try {
    return parseTokens(localStorage.getItem(TOKEN_STORAGE_KEY));
  } catch {
    return null;
  }
}

let cachedTokens = readTokensFromStorage();
let memoryOnly = false;

export function getStoredTokens(): AuthTokens | null {
  return cachedTokens ? { ...cachedTokens } : null;
}

/** 在跨标签页刷新锁内重新读取共享存储，避免使用过期的内存副本。 */
export function syncStoredTokens(): AuthTokens | null {
  if (memoryOnly) return getStoredTokens();
  try {
    cachedTokens = parseTokens(localStorage.getItem(TOKEN_STORAGE_KEY));
  } catch {
    // 存储不可用时保留当前标签页的内存 Token。
  }
  return getStoredTokens();
}

export function saveStoredTokens(tokens: AuthTokens): void {
  const nextTokens = { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  cachedTokens = nextTokens;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(nextTokens));
    memoryOnly = false;
  } catch {
    memoryOnly = true;
    // 写入失败时移除可能残留的旧 Token；当前标签页仍使用内存中的新 Token。
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // 浏览器完全禁用存储时无需继续处理。
    }
  }
}

/** 仅当 RT 仍是本次轮换所消费的值时写入，避免退出或重新登录被旧响应覆盖。 */
export function replaceStoredTokens(tokens: AuthTokens, expectedRefreshToken: string): boolean {
  const currentTokens = syncStoredTokens();
  if (currentTokens?.refreshToken !== expectedRefreshToken) return false;
  saveStoredTokens(tokens);
  return true;
}

/** expectedAccessToken 存在时只清理对应登录态，避免旧请求清除新登录态。 */
export function clearStoredTokens(expectedAccessToken?: string): boolean {
  const currentTokens = syncStoredTokens();
  if (expectedAccessToken && currentTokens?.accessToken !== expectedAccessToken) return false;
  cachedTokens = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
    // 内存状态已经清除。
  }
  return true;
}

export function subscribeToExternalTokenChanges(listener: TokenChangeListener): () => void {
  externalChangeListeners.add(listener);
  return () => externalChangeListeners.delete(listener);
}

window.addEventListener('storage', (event) => {
  if (event.key !== TOKEN_STORAGE_KEY && event.key !== null) return;
  const previousTokens = getStoredTokens();
  memoryOnly = false;
  cachedTokens = event.key === null ? null : parseTokens(event.newValue);
  const snapshot = getStoredTokens();
  externalChangeListeners.forEach((listener) => listener(snapshot, previousTokens));
});

/** 只用于判断跨标签页是否仍是同一登录会话，不把未验签声明用于鉴权。 */
export function getAccessTokenSessionKey(accessToken: string): string | null {
  try {
    const payloadPart = accessToken.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { sub?: unknown; sid?: unknown };
    return typeof payload.sub === 'string' && typeof payload.sid === 'string'
      ? `${payload.sub}:${payload.sid}`
      : null;
  } catch {
    return null;
  }
}
