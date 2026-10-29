import { create } from 'zustand';
import { appConfig } from '@/config/app';
import { settingsService } from '@/api/services/settingsService';

const SIDEBAR_KEY = 'pilot-admin:sidebar-collapsed:v1';
const readCollapsed = () => {
  try { return localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch { return false; }
};
const persistCollapsed = (collapsed: boolean) => {
  try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)); } catch { /* 当前页面仍可切换。 */ }
};

interface AppState {
  sidebarCollapsed: boolean;
  siteName: string;
  siteDescription: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  loadBrand: () => Promise<void>;
}

let brandRequest: Promise<void> | null = null;
export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: readCollapsed(), siteName: appConfig.name, siteDescription: appConfig.description,
  toggleSidebar: () => get().setSidebarCollapsed(!get().sidebarCollapsed),
  setSidebarCollapsed: (sidebarCollapsed) => { persistCollapsed(sidebarCollapsed); set({ sidebarCollapsed }); },
  loadBrand: () => {
    if (brandRequest) return brandRequest;
    const request = settingsService.getBrand().then((brand) => {
      set({ siteName: brand.siteName, siteDescription: brand.description });
    }).finally(() => { if (brandRequest === request) brandRequest = null; });
    brandRequest = request;
    return request;
  },
}));
