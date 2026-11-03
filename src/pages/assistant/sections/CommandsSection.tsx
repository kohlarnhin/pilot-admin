import { t, useT } from '@/i18n';
import { commandCatalog } from '@/agent/commands';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import type { AssistantSectionProps } from './types';

export default function CommandsSection({ section }: AssistantSectionProps) {
  useT();
  return <>
    <CardHeader className="shrink-0"><div><CardTitle>{t(section.titleKey)}</CardTitle><CardDescription>{t(section.descriptionKey)}</CardDescription></div></CardHeader>
    <CardContent role="region" aria-label={t(section.titleKey)} tabIndex={0} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">
      <ul aria-label={t(section.titleKey)} className="divide-y divide-line-soft">
        {commandCatalog.map((command) => <li key={command.id} className="py-5 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-13 font-medium text-slate-900">{t(command.titleKey)}</h3>
            <span className="text-[11px] text-slate-500">{t(command.takesArgument ? 'assistantSettings.commands.prefix' : 'assistantSettings.commands.noArgument')}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{t(command.descriptionKey)}</p>
          <dl className="mt-3 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs leading-5">
            {(['zh-CN', 'en-US'] as const).map((locale) => <div key={locale} className="contents">
              <dt className="text-slate-500">{t(locale === 'zh-CN' ? 'assistantSettings.commands.chinese' : 'assistantSettings.commands.english')}</dt>
              <dd lang={locale} className="flex min-w-0 flex-wrap gap-1.5">{command.phrases[locale].map((phrase) => <code key={phrase} className="break-words rounded-md border border-line-soft bg-slate-50/60 px-2 text-[11px] text-slate-700">{phrase}</code>)}</dd>
            </div>)}
            <dt className="text-slate-500">{t('assistantSettings.commands.permission')}</dt>
            <dd className="min-w-0 break-words text-slate-600"><code className="text-[11px]">{['agent:use', ...(command.permissions || [])].join(' · ')}</code>{command.accessKey ? <span className="block">{t(command.accessKey)}</span> : null}</dd>
          </dl>
        </li>)}
      </ul>
    </CardContent>
  </>;
}
