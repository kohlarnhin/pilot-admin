import { clearQueryCache } from '../queryCache';
export const AGENT_DATA_CHANGED_EVENT = 'pilot-admin:agent:data-changed';
export type DataChangeReason = 'data' | 'locale';
export function triggerDataChangeSideEffects(reason: DataChangeReason = 'data'): void {
  clearQueryCache();
  window.dispatchEvent(new CustomEvent(AGENT_DATA_CHANGED_EVENT, { detail: { reason } }));
}
