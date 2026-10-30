import { Navigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import { Spin } from '@/ui/spinner';
import { canAccessAgent } from './access';
import { assistantUI } from '@/components/assistant/assistantResources';
import { AssistantLoadState } from '@/components/assistant/AssistantLoadState';
import { useLazyResource } from '@/hooks/useLazyResource';

function LazyAgentWorkspace() {
  const { value, error, retry } = useLazyResource(assistantUI);
  return value ? <value.AgentWorkspace /> : <div className="flex h-dvh flex-col bg-white"><AssistantLoadState error={error} retry={retry} /></div>;
}

export function AgentPage() {
  const { isAuthenticated, isInitializing, menus, permissions } = useAuthStore();
  if (isInitializing) return <div className="flex h-dvh items-center justify-center"><Spin size="large" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccessAgent(menus, permissions)) return <Navigate to="/403" replace />;
  return <LazyAgentWorkspace />;
}
