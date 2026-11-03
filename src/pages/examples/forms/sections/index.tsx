import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { exampleFormService, type ProfileErrors, type ProfileValues } from '@/api/services/exampleFormService';
import { validateProfile } from '@/api/services/exampleFormRules';
import { PageHeader } from '@/components/common/PageHeader';
import { Icon } from '@/components/icon';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/ui/button';
import { Card, CardFooter } from '@/ui/card';
import { Alert, Switch } from '@/ui/controls';
import { Input } from '@/ui/input';
import { Modal } from '@/ui/modal';
import { Select } from '@/ui/select';
import { cn } from '@/utils';
import { Field } from '../Field';
import { LeaveGuard } from '../LeaveGuard';
import { defaultProfile } from './defaults';

const sectionIds = ['basic', 'contact', 'address', 'notifications', 'advanced'] as const;
type SectionId = typeof sectionIds[number];
const sectionIcons = ['file-text', 'user', 'map-pin', 'bell', 'settings-2'];

function ProfileForm() {
  const { t } = useT();
  const [values, setValues] = useState(defaultProfile);
  const [submitted, setSubmitted] = useState(defaultProfile);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [active, setActive] = useState<SectionId>('basic');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reference, setReference] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const submitLock = useRef(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(submitted);
  const errorFields = Object.keys(errors).filter((key) => errors[key as keyof ProfileValues]) as (keyof ProfileValues)[];

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const updateActive = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    const top = element.getBoundingClientRect().top;
    let current: SectionId = 'basic';
    for (const id of sectionIds) {
      const heading = document.getElementById(`profile-section-${id}`);
      if (heading && heading.getBoundingClientRect().top <= top + 64) current = id;
    }
    if (element.scrollTop > 0 && element.scrollHeight - element.scrollTop - element.clientHeight < 2) current = 'advanced';
    setActive(current);
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observer = new ResizeObserver(updateActive);
    observer.observe(element);
    if (formRef.current) observer.observe(formRef.current);
    // 内容与字体尺寸变化也会改变分区位置；滚动事件由实际容器声明式绑定。
    let mounted = true;
    void document.fonts.ready.then(() => { if (mounted) updateActive(); });
    updateActive();
    return () => { mounted = false; observer.disconnect(); };
  }, [updateActive]);

  const showErrors = (nextErrors: ProfileErrors) => {
    setErrors(nextErrors);
    window.requestAnimationFrame(() => {
      scroller.current?.scrollTo({ top: 0 });
      summary.current?.focus({ preventScroll: true });
    });
  };
  const update = <K extends keyof ProfileValues>(field: K, value: ProfileValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFailed(false);
    setReference('');
  };
  const anchor = (id: SectionId) => {
    const heading = document.getElementById(`profile-section-${id}`);
    const container = scroller.current;
    if (!heading || !container) return;
    heading.focus({ preventScroll: true });
    container.scrollTo({ top: heading.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 24,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const focusField = (field: keyof ProfileValues) => {
    const control = document.getElementById(`profile-${field}`);
    control?.scrollIntoView({ block: 'center' });
    control?.focus({ preventScroll: true });
  };
  const submit = async () => {
    if (submitLock.current) return;
    setReference('');
    setFailed(false);
    const clientErrors = validateProfile(values);
    if (Object.keys(clientErrors).length) { showErrors(clientErrors); return; }
    submitLock.current = true;
    setSaving(true);
    try {
      const { data } = await exampleFormService.submitProfile(values);
      if (!alive.current) return;
      if (!data.success) showErrors(data.errors);
      else {
        setErrors({});
        setSubmitted({ ...values });
        setReference(data.reference);
        scroller.current?.scrollTo({ top: 0 });
      }
    } catch {
      if (alive.current) { setFailed(true); scroller.current?.scrollTo({ top: 0 }); }
    } finally {
      submitLock.current = false;
      if (alive.current) setSaving(false);
    }
  };
  const errorText = (field: keyof ProfileValues) => errors[field] ? t(errors[field]!) : undefined;
  const reset = () => {
    setValues(defaultProfile());
    setSubmitted(defaultProfile());
    setErrors({});
    setReference('');
    setFailed(false);
    setResetOpen(false);
    scroller.current?.scrollTo({ top: 0 });
  };
  const props = (field: keyof ProfileValues, required = false, hint = false) => ({
    id: `profile-${field}`,
    'aria-labelledby': `profile-${field}-label`,
    'aria-invalid': !!errors[field],
    'aria-required': required,
    'aria-describedby': errors[field] || hint ? `profile-${field}-help` : undefined,
    disabled: saving,
  });
  const textField = (field: keyof ProfileValues, options: { required?: boolean; type?: string; maxLength?: number; hint?: string } = {}) => <Field id={`profile-${field}`} label={t(`exampleForms.fields.${field}`)} required={options.required} error={errorText(field)} hint={options.hint}>
    <Input {...props(field, options.required, !!options.hint)} type={options.type || 'text'} maxLength={options.maxLength} value={String(values[field])} onChange={(event) => update(field, event.target.value)} />
  </Field>;
  const section = (id: SectionId, children: ReactNode) => <section aria-labelledby={`profile-section-${id}`} className="border-b border-line-soft p-6 last:border-b-0">
    <h2 id={`profile-section-${id}`} tabIndex={-1} className="scroll-mt-6 text-[15px] font-semibold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-focus">{t(`exampleForms.sections.${id}`)}</h2>
    <p className="mb-5 mt-1 text-xs leading-5 text-slate-500">{t(`exampleForms.sections.${id}Hint`)}</p>
    {children}
  </section>;

  return <>
    <LeaveGuard dirty={dirty} busy={saving} />
    <div className="flex min-h-0 min-w-0 flex-1 gap-5">
      <Card className="w-56 shrink-0 xl:w-64">
        <nav aria-label={t('exampleForms.sections.navLabel')} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <ol className="space-y-1">{sectionIds.map((id, index) => <li key={id}>
            <a href={`#profile-section-${id}`} aria-current={active === id ? 'location' : undefined} onClick={(event) => { event.preventDefault(); anchor(id); }}
              className={cn('flex items-center gap-3 rounded-xl border p-3 text-13 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus', active === id ? 'border-line bg-slate-100 font-medium text-slate-900' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900')}>
              <Icon icon={sectionIcons[index]} size={18} /><span>{t(`exampleForms.sections.${id}`)}</span>
            </a>
          </li>)}</ol>
        </nav>
      </Card>
      <Card className="min-h-0 min-w-0 flex-1">
        <div ref={scroller} onScroll={updateActive} role="region" aria-label={t('exampleForms.sections.title')} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">
          <div className="space-y-4 px-6 pt-6">
            <Alert type="info" description={t('exampleForms.sections.demoNotice')} />
            {errorFields.length > 0 && <div ref={summary} role="alert" tabIndex={-1} aria-labelledby="profile-error-title" className="rounded-xl border-2 border-red-600 p-4 outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2">
              <h2 id="profile-error-title" className="text-[15px] font-semibold text-slate-900">{t('exampleForms.sections.errorTitle')}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">{errorFields.map((field) => <li key={field} className="text-xs text-red-600"><a href={`#profile-${field}`} className="rounded underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-focus" onClick={(event) => { event.preventDefault(); focusField(field); }}>{t(`exampleForms.fields.${field}`)}: {errorText(field)}</a></li>)}</ul>
            </div>}
            {failed && <Alert type="error" role="alert" title={t('exampleForms.sections.saveFailed')} action={<Button size="sm" onClick={() => void submit()} loading={saving}>{t('common.actions.retry')}</Button>} />}
            {reference && <Alert type="success" role="status" title={t('exampleForms.sections.success')} description={t('exampleForms.sections.reference', { reference })} />}
          </div>
          <form ref={formRef} id="profile-form" noValidate onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            {section('basic', <div className="space-y-5">
              {textField('organizationName', { required: true, maxLength: 60, hint: t('exampleForms.sections.reservedHint') })}
              {textField('website', { type: 'url', maxLength: 200 })}
            </div>)}
            {section('contact', <div className="grid gap-5 sm:grid-cols-2">
              {textField('contactName', { required: true, maxLength: 40 })}
              {textField('email', { required: true, type: 'email', maxLength: 100 })}
              {textField('phone', { type: 'tel', maxLength: 30 })}
            </div>)}
            {section('address', <div className="grid gap-5 sm:grid-cols-2">
              <Field id="profile-country" label={t('exampleForms.fields.country')} required error={errorText('country')}>
                <Select {...props('country', true)} value={values.country} onChange={(value: string) => update('country', value)} options={[
                  { value: 'CN', label: t('exampleForms.countries.china') }, { value: 'US', label: t('exampleForms.countries.unitedStates') },
                  { value: 'GB', label: t('exampleForms.countries.unitedKingdom') }, { value: 'SG', label: t('exampleForms.countries.singapore') }, { value: 'other', label: t('exampleForms.countries.other') },
                ]} />
              </Field>
              {textField('region', { maxLength: 60 })}{textField('city', { maxLength: 60 })}{textField('postalCode', { maxLength: 60 })}
              <div className="sm:col-span-2">{textField('street', { maxLength: 120 })}</div>
            </div>)}
            {section('notifications', <div className="divide-y divide-line-soft rounded-xl border border-line px-4">
              {(['systemNotice', 'activityDigest', 'productUpdates'] as const).map((field) => <div key={field} className="flex items-center justify-between gap-4 py-4">
                <div><label id={`profile-${field}-label`} htmlFor={`profile-${field}`} className="text-13 font-medium text-slate-800">{t(`exampleForms.fields.${field}`)}</label><p id={`profile-${field}-help`} className={`mt-1 text-xs ${errors[field] ? 'text-red-600' : 'text-slate-500'}`}>{errorText(field) || t(`exampleForms.sections.${field}Hint`)}</p></div>
                <Switch {...props(field, false, true)} aria-labelledby={`profile-${field}-label`} checked={values[field]} onChange={(value) => update(field, value)} />
              </div>)}
            </div>)}
            {section('advanced', <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">{textField('startDate', { type: 'date', required: true })}{textField('endDate', { type: 'date', required: true, hint: t('exampleForms.sections.dateHint') })}</div>
              <Field id="profile-retentionDays" label={t('exampleForms.fields.retentionDays')} required error={errorText('retentionDays')}>
                <div className="flex items-center gap-3"><Input {...props('retentionDays', true)} className="max-w-40" type="number" min={1} max={365} step={1} value={values.retentionDays} onChange={(event) => update('retentionDays', event.target.value)} /><span className="text-13 text-slate-500">{t('exampleForms.sections.days')}</span></div>
              </Field>
            </div>)}
          </form>
        </div>
        <CardFooter className="shrink-0 justify-between gap-3">
          <p role="status" className="flex items-center gap-2 text-xs text-slate-500">{dirty && <span aria-hidden="true" className="size-1.5 rounded-full bg-slate-600" />}{t(dirty ? 'exampleForms.sections.dirty' : 'exampleForms.sections.clean')}</p>
          <div className="flex shrink-0 gap-2.5"><Button disabled={saving} onClick={() => dirty ? setResetOpen(true) : reset()}>{t('exampleForms.sections.reset')}</Button><Button type="submit" form="profile-form" loading={saving}>{t('exampleForms.sections.save')}</Button></div>
        </CardFooter>
      </Card>
    </div>
    <Modal open={resetOpen} title={t('exampleForms.sections.resetTitle')} icon="rotate-ccw" onCancel={() => setResetOpen(false)} okText={t('common.actions.confirmReset')} onOk={reset}>
      <p className="text-13 text-slate-600">{t('exampleForms.sections.resetHint')}</p>
    </Modal>
  </>;
}

export function FormSectionsPage() {
  const { t } = useT();
  const userId = useAuthStore((state) => state.user?.id);
  return <div className="flex h-full min-h-0 min-w-0 flex-col">
    <PageHeader title={t('exampleForms.sections.title')} description={t('exampleForms.sections.description')} />
    <ProfileForm key={userId} />
  </div>;
}
