import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Languages } from 'lucide-react';
import { appConfig } from '@/config/app';
import { setLocale, useT, type Locale } from '@/i18n';
import { Dropdown, menuItemClass } from '@/ui/dropdown';
import { Button } from '@/ui/button';

function LocaleOptions() {
  const { t, locale } = useT();
  return <Menu.RadioGroup value={locale} onValueChange={(value) => { void setLocale(value as Locale); }} aria-label={t('layout.language')}>
    {appConfig.locales.map((item) => <Menu.RadioItem key={item.code} value={item.code} className={menuItemClass}>
      <span className="flex size-4 shrink-0 items-center justify-center"><Menu.ItemIndicator><Check className="size-3.5" /></Menu.ItemIndicator></span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Menu.RadioItem>)}
  </Menu.RadioGroup>;
}

/** 紧凑入口不改变登录表单与品牌区的位置。 */
export function LocaleSwitcher() {
  const { t, locale } = useT();
  return <Dropdown placement="bottomRight" popupRender={() => <LocaleOptions />}>
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs font-normal text-slate-500" aria-label={`${t('layout.switchLanguage')}: ${appConfig.locales.find((item) => item.code === locale)?.label}`}>
      <Languages className="size-4" /><span>{appConfig.locales.find((item) => item.code === locale)?.label}</span>
    </Button>
  </Dropdown>;
}

export function LocaleSubmenu() {
  const { t } = useT();
  return <Menu.Sub>
    <Menu.SubTrigger className={menuItemClass}>
      <Languages /><span className="min-w-0 flex-1 truncate">{t('layout.language')}</span><ChevronRight className="size-3.5" />
    </Menu.SubTrigger>
    <Menu.Portal><Menu.SubContent sideOffset={6} collisionPadding={8} className="z-[1060] min-w-[168px] rounded-xl border border-line bg-white p-1.5 shadow-pop outline-none">
      <LocaleOptions />
    </Menu.SubContent></Menu.Portal>
  </Menu.Sub>;
}
