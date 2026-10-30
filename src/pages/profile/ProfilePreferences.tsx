import { appConfig } from '@/config/app';
import { useAgentPreference } from '@/hooks/useAgentPreference';
import { setLocale, t, useT, type Locale } from '@/i18n';
import { usePermission } from '@/hooks/usePermission';
import { AgentPreferenceField } from '@/agent/AgentPreferenceField';
import { Button } from '@/ui/button';
import { CardContent, CardFooter } from '@/ui/card';
import { Select } from '@/ui/select';

export function ProfilePreferences() {
  const { locale } = useT();
  const canUseAgent = usePermission('agent:use');
  const preference = useAgentPreference();
  return <>
    <CardContent className="min-h-0 flex-1 overflow-y-auto">
      <div className="max-w-xl space-y-6">
        <div><label id="profile-language-label" htmlFor="profile-language" className="mb-2 block text-13 font-medium text-slate-700">{t('layout.language')}</label>
          <Select id="profile-language" aria-labelledby="profile-language-label" value={locale} className="w-full" onChange={(value) => { void setLocale(value as Locale); }} options={appConfig.locales.map((item) => ({ value: item.code, label: item.label }))} />
          <p className="mt-2 text-xs leading-5 text-slate-500">{t('profile.preferences.languageHint')}</p>
        </div>
        {canUseAgent ? <div className="border-t border-line-soft pt-6">
          <h3 className="mb-4 text-13 font-medium text-slate-900">{t('agentEntry.preferences')}</h3>
          <AgentPreferenceField {...preference} />
          <p className="mt-2 text-xs leading-5 text-slate-500">{t('profile.preferences.agentHint')}</p>
        </div> : null}
      </div>
    </CardContent>
    {canUseAgent ? <CardFooter className="shrink-0 justify-end"><Button loading={preference.saving} onClick={() => void preference.save()}>{t('common.actions.save')}</Button></CardFooter> : null}
  </>;
}
