import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthTokens } from '../types';
import {
  clearStoredTokens,
  replaceStoredTokens,
  syncStoredTokens,
} from './tokenStorage';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _authRetry?: boolean;
  _sentAccessToken?: string;
}

interface RefreshTokenData {
  accessToken: string;
  refreshToken: string;
}

const PUBLIC_AUTH_ENDPOINTS = new Set(['/auth/login', '/auth/login/resolve', '/auth/refresh']);
const REFRESH_LOCK_NAME = 'pilot-admin:auth:refresh:v2';
let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<string> | null = null;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 401 || error.code === 1002);
}

// --- 命名转换（后端 camelCase ↔ 前端 snake_case，仅转换 key 不转换值） ---

export const snakeToCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
export const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export function transformKeys(value: unknown, transform: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => transformKeys(v, transform));
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[transform(key)] = transformKeys(val, transform);
    }
    return out;
  }
  return value;
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_ENDPOINTS.has(url.split('?')[0]);
}

function responseMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

function responseCode(body: unknown): number | undefined {
  if (body && typeof body === 'object' && 'code' in body) {
    const code = (body as { code?: unknown }).code;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
}

// --- axios 实例 ---

export const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

/** 由认证状态层接管 Token 最终失效后的本地用户状态清理。 */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

// 请求：注入 Bearer AT，body 统一 snake_case → camelCase。
http.interceptors.request.use((config) => {
  const retryableConfig = config as RetryableRequestConfig;
  if (!isAuthEndpoint(config.url)) {
    const accessToken = syncStoredTokens()?.accessToken;
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
      retryableConfig._sentAccessToken = accessToken;
    }
  }
  if (config.data) config.data = transformKeys(config.data, snakeToCamel);
  return config;
});

// 响应：统一信封处理 + camelCase → snake_case。
http.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code !== 0) {
        return Promise.reject(
          new ApiRequestError(responseMessage(body, '请求失败'), response.status, responseCode(body))
        );
      }
      return { ...response, data: { ...body, data: transformKeys(body.data, camelToSnake) } };
    }
    return response;
  },
  async (error) => {
    const response = axios.isAxiosError(error) ? error.response : undefined;
    const config = axios.isAxiosError(error)
      ? (error.config as RetryableRequestConfig | undefined)
      : undefined;

    if (response?.status === 401 && config && !isAuthEndpoint(config.url)) {
      if (!config._authRetry) {
        config._authRetry = true;
        try {
          const accessToken = await refreshAccessToken(config._sentAccessToken);
          config.headers.set('Authorization', `Bearer ${accessToken}`);
          config._sentAccessToken = accessToken;
          return http(config);
        } catch (refreshError) {
          if (isUnauthorizedError(refreshError)) {
            const cleared = clearStoredTokens(config._sentAccessToken);
            if (cleared) unauthorizedHandler?.();
          }
          return Promise.reject(refreshError);
        }
      }

      const cleared = clearStoredTokens(config._sentAccessToken);
      if (cleared) unauthorizedHandler?.();
    }

    return Promise.reject(
      new ApiRequestError(
        responseMessage(response?.data, '请求失败，请稍后重试'),
        response?.status,
        responseCode(response?.data)
      )
    );
  }
);

// --- RT 原子轮换（裸 axios 避免拦截器递归；同标签页单飞、同源标签页使用 Web Lock） ---

export function refreshAccessToken(failedAccessToken?: string): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const request = navigator.locks?.request
    ? navigator.locks
        .request(REFRESH_LOCK_NAME, () => performTokenRefresh(failedAccessToken))
        .then((tokenRequest) => tokenRequest)
    : performTokenRefresh(failedAccessToken);
  const singleFlightRequest: Promise<string> = request.finally(() => {
    if (refreshPromise === singleFlightRequest) refreshPromise = null;
  });
  refreshPromise = singleFlightRequest;
  return refreshPromise;
}

async function performTokenRefresh(failedAccessToken?: string): Promise<string> {
  const currentTokens = syncStoredTokens();
  if (!currentTokens) throw new ApiRequestError('登录状态已失效，请重新登录', 401, 1002);

  // 等待跨标签页锁期间，其他标签页可能已完成轮换或重新登录。
  if (!failedAccessToken) return currentTokens.accessToken;
  if (failedAccessToken && currentTokens.accessToken !== failedAccessToken) {
    return currentTokens.accessToken;
  }

  const consumedRefreshToken = currentTokens.refreshToken;
  try {
    const response = await refreshClient.post<ApiResponse<RefreshTokenData>>('/auth/refresh', {
      refreshToken: consumedRefreshToken,
    });
    const body = response.data;
    if (body.code !== 0) {
      throw new ApiRequestError(responseMessage(body, '刷新 Token 失败'), response.status, body.code);
    }
    const nextTokens: AuthTokens = {
      accessToken: body.data?.accessToken,
      refreshToken: body.data?.refreshToken,
    };
    if (!nextTokens.accessToken || !nextTokens.refreshToken) {
      throw new ApiRequestError('刷新 Token 响应不完整');
    }
    if (!replaceStoredTokens(nextTokens, consumedRefreshToken)) {
      const latestTokens = syncStoredTokens();
      if (latestTokens) return latestTokens.accessToken;
      throw new ApiRequestError('登录状态已变更，请重新登录', 401, 1002);
    }
    return nextTokens.accessToken;
  } catch (error) {
    // 无 Web Lock 或异常并发下，另一个标签页可能已经消费旧 RT 并写入了新令牌。
    const latestTokens = syncStoredTokens();
    if (latestTokens && latestTokens.refreshToken !== consumedRefreshToken) {
      return latestTokens.accessToken;
    }
    if (error instanceof ApiRequestError) throw error;
    if (axios.isAxiosError(error)) {
      throw new ApiRequestError(
        responseMessage(error.response?.data, '刷新 Token 失败'),
        error.response?.status,
        responseCode(error.response?.data)
      );
    }
    throw error;
  }
}
