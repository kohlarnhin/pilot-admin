import { clearQueryCache } from '../queryCache';
export const AGENT_DATA_CHANGED_EVENT = 'pilot-admin:agent:data-changed';
export function triggerDataChangeSideEffects(): void {
  clearQueryCache();
  window.dispatchEvent(new CustomEvent(AGENT_DATA_CHANGED_EVENT));
}
