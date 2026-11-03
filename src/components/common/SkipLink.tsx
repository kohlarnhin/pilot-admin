import { useT } from '@/i18n';

/** 脱离布局的键盘入口，聚焦后才显示，不改变外壳尺寸。 */
export function SkipLink({ targetId }: { targetId: string }) {
  const { t } = useT();
  return <a href={`#${targetId}`} onClick={(event) => {
    const target = document.getElementById(targetId);
    if (target) {
      event.preventDefault();
      target.focus({ preventScroll: true });
    }
  }} className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-13 focus:text-slate-900 focus:shadow-pop focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2">
    {t('layout.skipToContent')}
  </a>;
}
