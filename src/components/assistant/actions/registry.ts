import type { ComponentType } from 'react';
import type { AgentPageActionOutcome } from '@/types';
export interface AssistantActionProps {
  onComplete: (outcome: Omit<AgentPageActionOutcome, 'finishedAt'>) => Promise<void>;
  onCancel: () => Promise<void>;
}
const actions = new Map<string, ComponentType<AssistantActionProps>>();
export function registerAssistantAction(key: string, Component: ComponentType<AssistantActionProps>): void {
  actions.set(key, Component);
}
export const getAssistantAction = (key: string) => actions.get(key);
