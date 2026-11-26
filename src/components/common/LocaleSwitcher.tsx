import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check, Languages } from 'lucide-react';
import { appConfig } from '@/config/app';
import { setLocale, useT, type Locale } from '@/i18n';
import { Dropdown, menuItemClass } from '@/ui/dropdown';
import { Button } from '@/ui/button';
import { Tooltip } from '@/ui/tooltip';

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

/** 侧栏底部的常驻语言入口：与账号同排的图标按钮，不占用菜单高度。 */
export function SidebarLocaleEntry() {
  const { t, locale } = useT();
  const current = appConfig.locales.find((item) => item.code === locale)?.label;
  return <Dropdown placement="rightBottom" popupRender={() => <LocaleOptions />}>
    <Tooltip title={`${t('layout.language')}: ${current}`} placement="right">
      <button type="button" data-slot="sidebar-locale-entry" aria-label={`${t('layout.switchLanguage')}: ${current}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus data-[state=open]:bg-slate-100">
        <Languages size={18} aria-hidden="true" />
      </button>
    </Tooltip>
  </Dropdown>;
}
