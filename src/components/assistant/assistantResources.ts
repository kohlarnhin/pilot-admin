import { createLazyResource } from '@/utils/lazyResource';

export const assistantUI = createLazyResource(() => import('./AssistantUI'));

export const preloadAssistantUI = () => { void assistantUI.load().catch(() => undefined); };
