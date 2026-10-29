import { create } from 'zustand';

interface AssistantState {
  panelOpen: boolean;
  /** 助手正在生成回复，供侧边栏入口显示状态点。 */
  streaming: boolean;
  /** 最近一次打开面板的入口，关闭时用于归还焦点。 */
  lastTrigger: HTMLElement | null;
  openPanel: (trigger?: HTMLElement | null) => void;
  closePanel: () => void;
  togglePanel: (trigger?: HTMLElement | null) => void;
  setStreaming: (streaming: boolean) => void;
}

const focusTrigger = (trigger: HTMLElement | null) => {
  if (!trigger?.isConnected) return;
  requestAnimationFrame(() => {
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
  });
};

/** 助手面板的开关状态独立于运行时，供侧边栏、工作台顶栏与快捷键共享。 */
export const useAssistantStore = create<AssistantState>((set, get) => ({
  panelOpen: false,
  streaming: false,
  lastTrigger: null,
  openPanel: (trigger) => {
    if (get().panelOpen) return;
    const active = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    set({ panelOpen: true, lastTrigger: active && active !== document.body ? active : null });
  },
  closePanel: () => {
    const { panelOpen, lastTrigger } = get();
    if (!panelOpen) return;
    set({ panelOpen: false });
    focusTrigger(lastTrigger);
  },
  togglePanel: (trigger) => {
    if (get().panelOpen) get().closePanel();
    else get().openPanel(trigger);
  },
  setStreaming: (streaming) => set({ streaming }),
}));
