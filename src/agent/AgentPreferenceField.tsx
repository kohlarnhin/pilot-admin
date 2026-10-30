import { t, useT } from '@/i18n';
import { useId } from 'react';
import { Select } from '@/ui/select';
import type { UserPreferences } from '@/types';
import type { useAgentPreference } from '@/hooks/useAgentPreference';

export function AgentPreferenceField({ entry, setEntry, saving }: Pick<ReturnType<typeof useAgentPreference>, 'entry' | 'setEntry' | 'saving'>) {
  useT();
  const id = useId();
  return <div>
    <label id={`${id}-agent-label`} htmlFor={`${id}-agent-entry`} className="mb-2 block text-13 font-medium text-slate-700">{t('agentEntry.afterLogin')}</label>
    <Select id={`${id}-agent-entry`} aria-labelledby={`${id}-agent-label`} value={entry} disabled={saving} className="w-full" onChange={(value) => setEntry(value as UserPreferences['agent_mode_entry'])}
      options={[{ value: 'ask', label: t('agentEntry.ask') }, { value: 'agent', label: t('agentEntry.agent') }, { value: 'console', label: t('agentEntry.console') }]} />
  </div>;
}
