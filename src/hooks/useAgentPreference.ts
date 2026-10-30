import { useEffect, useRef, useState } from 'react';
import { t } from '@/i18n';
import { isUnauthorizedError } from '@/api/http';
import { useAuthStore } from '@/store/authStore';
import { message } from '@/ui/message';

export function useAgentPreference(onSaved?: () => void) {
  const preference = useAuthStore((state) => state.preferences.agent_mode_entry);
  const patchPreferences = useAuthStore((state) => state.patchPreferences);
  const [entry, setEntry] = useState(preference);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  useEffect(() => { setEntry(preference); }, [preference]);
  const save = async () => {
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    try {
      await patchPreferences({ agent_mode_entry: entry });
      message.success(t('agentEntry.saved'));
      onSaved?.();
    } catch (error) {
      if (isUnauthorizedError(error)) await useAuthStore.getState().refreshMe().catch(() => undefined);
      message.error((error as Error).message || t('agentEntry.saveFailed'));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  return { entry, setEntry, saving, save };
}

