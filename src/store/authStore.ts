import { t } from '@/i18n';
import { create } from 'zustand';
import type { AuthMeResponse, User, Menu, UserPreferences } from '../types';
import { authService, DEFAULT_USER_PREFERENCES } from '../api/services/authService';
import { clearQueryCache } from '../api/queryCache';
import { getLocale, registerLocaleRefresh } from '@/i18n/store';
import { isUnauthorizedError, setUnauthorizedHandler } from '../api/errors';
import {
  clearStoredTokens,
  getAccessTokenSessionKey,
  getStoredTokens,
  saveStoredTokens,
  subscribeToExternalTokenChanges,
} from '../api/tokenStorage';

interface AuthState {
  user: User | null;
  roles: string[];
  roleNames: string[];
  permissions: string[];
  menus: Menu[];
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;

  login: (loginName: string, password: string) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  refreshMe: () => Promise<void>;
  patchPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
}

type AuthDataState = Pick<
  AuthState,
  | 'user'
  | 'roles'
  | 'roleNames'
  | 'permissions'
  | 'menus'
  | 'preferences'
  | 'isAuthenticated'
  | 'isLoading'
  | 'isInitializing'
>;

const EMPTY_AUTH_STATE: AuthDataState = {
  user: null,
  roles: [],
  roleNames: [],
  permissions: [],
  menus: [],
  preferences: DEFAULT_USER_PREFERENCES,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: false,
};

const toAuthenticatedState = (me: AuthMeResponse): AuthDataState => ({
  user: me.user,
  roles: me.roles,
  roleNames: me.roleNames || me.user.role_names || [],
  permissions: me.permissions,
  menus: me.menus,
  preferences: me.preferences,
  isAuthenticated: true,
  isLoading: false,
  isInitializing: false,
});

let authGeneration = 0;
let authInitPromise: Promise<void> | null = null;
const hasInitialTokens = Boolean(getStoredTokens());

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  roles: [],
  roleNames: [],
  permissions: [],
  menus: [],
  preferences: DEFAULT_USER_PREFERENCES,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: hasInitialTokens,

  // 刷新时恢复本地会话，StrictMode 复用同一个初始化请求。
  initAuth: () => {
    if (!getStoredTokens()) {
      set(EMPTY_AUTH_STATE);
      return Promise.resolve();
    }

    const state = get();
    if (state.user && state.isAuthenticated) {
      if (state.isInitializing) set({ isInitializing: false });
      return Promise.resolve();
    }
    if (authInitPromise) return authInitPromise;

    const generation = authGeneration;
    set({ isInitializing: true });
    const request = (async () => {
      try {
        const me = await authService.getMe();
        if (authGeneration !== generation || !getStoredTokens()) return;
        set(toAuthenticatedState(me));
      } catch (error) {
        if (authGeneration !== generation) return;
        clearQueryCache();
        if (isUnauthorizedError(error)) clearStoredTokens();
        set(EMPTY_AUTH_STATE);
      } finally {
        if (authGeneration === generation) set({ isInitializing: false });
      }
    })();
    const trackedRequest: Promise<void> = request.finally(() => {
      if (authInitPromise === trackedRequest) authInitPromise = null;
    });
    authInitPromise = trackedRequest;
    return trackedRequest;
  },

  // 旧登录响应不能覆盖新操作。
  login: async (loginName: string, password: string) => {
    const generation = ++authGeneration;
    authInitPromise = null;
    clearQueryCache();
    clearStoredTokens();
    set({ ...EMPTY_AUTH_STATE, isLoading: true });
    try {
      const tokens = await authService.login(loginName, password);
      if (authGeneration !== generation) throw new Error(t('auth.cancelled'));
      saveStoredTokens(tokens);

      const me = await authService.getMe();
      if (authGeneration !== generation || !getStoredTokens()) {
        throw new Error(t('auth.sessionChanged'));
      }
      set(toAuthenticatedState(me));
    } catch (error) {
      if (authGeneration === generation) {
        clearStoredTokens();
        set(EMPTY_AUTH_STATE);
      }
      throw error;
    }
  },

  // 清除本地会话与查询缓存。
  logout: () => {
    authService.logout(get().user || undefined);
    authGeneration += 1;
    authInitPromise = null;
    clearQueryCache();
    clearStoredTokens();
    set(EMPTY_AUTH_STATE);
  },

  patchPreferences: async (preferences) => {
    const generation = authGeneration;
    const updated = await authService.patchPreferences(preferences);
    if (generation === authGeneration && get().isAuthenticated) set({ preferences: updated });
  },

  refreshMe: async () => {
    const generation = authGeneration;
    const locale = getLocale();
    try {
      const me = await authService.getMe();
      if (generation === authGeneration && locale === getLocale() && getStoredTokens()) set(toAuthenticatedState(me));
    } catch (error) {
      if (generation === authGeneration && locale === getLocale() && isUnauthorizedError(error)) get().logout();
      throw error;
    }
  },
}));

registerLocaleRefresh(async () => {
  const state = useAuthStore.getState();
  if (state.isAuthenticated) await state.refreshMe();
});

setUnauthorizedHandler(() => {
  authGeneration += 1;
  authInitPromise = null;
  clearQueryCache();
  useAuthStore.setState(EMPTY_AUTH_STATE);
});

subscribeToExternalTokenChanges((tokens, previousTokens) => {
  const previousSession = previousTokens
    ? getAccessTokenSessionKey(previousTokens.accessToken)
    : null;
  const nextSession = tokens ? getAccessTokenSessionKey(tokens.accessToken) : null;
  if (previousSession && previousSession === nextSession) return;

  authGeneration += 1;
  authInitPromise = null;
  clearQueryCache();
  if (!tokens) {
    useAuthStore.setState(EMPTY_AUTH_STATE);
    return;
  }
  useAuthStore.setState({ ...EMPTY_AUTH_STATE, isInitializing: true });
  void useAuthStore.getState().initAuth();
});
