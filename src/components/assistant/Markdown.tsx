import { t, useT } from '@/i18n';
import { Button } from '@/ui/button';
import { createLazyResource } from '@/utils/lazyResource';
import { useLazyResource } from '@/hooks/useLazyResource';

const renderer = createLazyResource(() => import('./MarkdownRenderer'));

export function Markdown(props: { content: string; sessionId?: string }) {
  useT();
  const { value, error, retry } = useLazyResource(renderer);
  if (value) return <value.MarkdownRenderer {...props} />;
  return <div className="ai-message-content min-w-0 max-w-full whitespace-pre-wrap text-13 leading-7 [overflow-wrap:anywhere]">
    {props.content}
    {error ? <div role="alert" className="mt-2 text-xs text-slate-500">{t('assistant.errors.loadInterface')} <Button variant="ghost" size="xs" onClick={retry}>{t('common.actions.retry')}</Button></div> : null}
  </div>;
}
