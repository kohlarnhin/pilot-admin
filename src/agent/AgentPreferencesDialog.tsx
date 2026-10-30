import { t, useT } from '@/i18n';
import { useAgentPreference } from '@/hooks/useAgentPreference';
import { Modal } from '@/ui/modal';
import { AgentPreferenceField } from './AgentPreferenceField';

export function AgentPreferencesDialog({ onClose }: { onClose: () => void }) {
  useT();
  const preference = useAgentPreference(onClose);
  return <Modal open title={t('agentEntry.preferences')} icon="square-terminal" description={t('agentEntry.preferencesDescription')}
    confirmLoading={preference.saving} onCancel={preference.saving ? undefined : onClose} onOk={preference.save} okText={t('common.actions.save')} width={460}>
    <div className="space-y-5"><AgentPreferenceField {...preference} /></div>
  </Modal>;
}
