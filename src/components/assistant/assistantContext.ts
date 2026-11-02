import { createContext, useContext } from 'react';
import type { AssistantRuntime } from './AssistantRuntime';

export const AssistantContext = createContext<AssistantRuntime | null>(null);

export function useAssistantRuntime() {
  const runtime = useContext(AssistantContext);
  if (!runtime) throw new Error('AssistantRuntime is unavailable');
  return runtime;
}
