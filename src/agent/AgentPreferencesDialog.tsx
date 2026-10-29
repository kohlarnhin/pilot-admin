import { t, useT } from '@/i18n';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Modal } from '@/ui/modal';
import { Select } from '@/ui/select';
import { message } from '@/ui/message';
import type { UserPreferences } from '@/types';

export function AgentPreferencesDialog({ onClose }: { onClose: () => void }) {
  useT();
  const preferences = useAuthStore(state => state.preferences);
  const patchPreferences = useAuthStore(state => state.patchPreferences);
  const [entry, setEntry] = useState(preferences.agent_mode_entry);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await patchPreferences({ agent_mode_entry: entry });
      message.success(t('agentEntry.saved'));
      onClose();
    } catch (error) {
      message.error((error as Error).message || t('agentEntry.saveFailed'));
    } finally { setSaving(false); }
  };
  return <Modal open title={t('agentEntry.preferences')} icon="square-terminal" description={t('agentEntry.preferencesDescription')}
    confirmLoading={saving} onCancel={saving ? undefined : onClose} onOk={save} okText={t('common.save')} width={460}>
    <div className="space-y-5">
      <div><label htmlFor="agent-entry-preference" className="mb-2 block text-13 font-medium text-slate-700">{t('agentEntry.afterLogin')}</label>
        <Select id="agent-entry-preference" value={entry} disabled={saving} className="w-full" onChange={value => setEntry(value as UserPreferences['agent_mode_entry'])}
          options={[{ value: 'ask', label: t('agentEntry.ask') }, { value: 'agent', label: t('agentEntry.agent') }, { value: 'console', label: t('agentEntry.console') }]} /></div>
    </div>
  </Modal>;
}
