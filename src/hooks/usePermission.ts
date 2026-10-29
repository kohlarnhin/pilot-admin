import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useCan() {
  const permissions = useAuthStore((state) => state.permissions);
  return useCallback((codes: string | string[], mode: 'all' | 'any' = 'all'): boolean => {
    const required = typeof codes === 'string' ? [codes] : codes;
    return mode === 'any' ? required.some((code) => permissions.includes(code)) : required.every((code) => permissions.includes(code));
  }, [permissions]);
}

export function usePermission(code: string): boolean {
  return useCan()(code);
}
