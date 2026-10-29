import type { ReactNode } from 'react';
import { useCan } from '@/hooks/usePermission';

export function Access({ permission, mode, fallback = null, children }: {
  permission: string | string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children?: ReactNode;
}) {
  const can = useCan();
  return can(permission, mode) ? children : fallback;
}
