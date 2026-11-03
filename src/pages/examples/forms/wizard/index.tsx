import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ApiRequestError } from '@/api/errors';
import { exampleProjectService, PROJECT_CODE_EXISTS, type ProjectInput } from '@/api/services/exampleProjectService';
import { PageHeader } from '@/components/common/PageHeader';
import { Result } from '@/components/common/Result';
import { Steps, type StepItem } from '@/components/common/Steps';
import { Icon } from '@/components/icon';
import { usePermission } from '@/hooks/usePermission';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/ui/button';
import { buttonVariants } from '@/ui/button-variants';
import { Card, CardFooter } from '@/ui/card';
import { Alert } from '@/ui/controls';
import { Input, TextArea } from '@/ui/input';
import { Select } from '@/ui/select';
import type { ExampleProject } from '@/types';
import { Field } from '../Field';
import { LeaveGuard } from '../LeaveGuard';
import { clearWizardDraft, readWizardDraft, saveWizardDraft } from './draft';
import { emptyWizardValues, hasWizardInput, validateWizardStep, type WizardErrors } from './validation';

type CodeCheck = { code: string; status: 'idle' | 'pending' | 'available' | 'taken' | 'error' };
const stepIds = ['basic', 'ownership', 'review', 'result'] as const;

function ProjectWizard({ userId }: { userId: string }) {
  const { t } = useT();
  const [values, setValues] = useState(emptyWizardValues);
  const [draft, setDraft] = useState(() => readWizardDraft(userId));
  const [draftStatus, setDraftStatus] = useState<'empty' | 'saving' | 'saved' | 'failed'>('empty');
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<WizardErrors>({});
  const [check, setCheck] = useState<CodeCheck>({ code: '', status: 'idle' });
  const [checkAttempt, setCheckAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [clearError, setClearError] = useState(false);
  const [created, setCreated] = useState<ExampleProject | null>(null);
  const submitLock = useRef(false);
  const draftTimer = useRef<number | undefined>(undefined);
  const alive = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusField = useRef<string | null>(null);
  const firstStep = useRef(true);
  const dirty = !created && !draft && hasWizardInput(values);
  const codeValid = /^[A-Z][A-Z0-9-]{1,19}$/.test(values.code);
  const codeAvailable = check.code === values.code && check.status === 'available';

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    if (draft) return;
    if (focusField.current) {
      document.getElementById(focusField.current)?.focus();
      focusField.current = null;
    } else if (step === 3) document.getElementById('wizard-result-title')?.focus();
    else headingRef.current?.focus();
  }, [step, draft]);

  useEffect(() => {
    if (draft || created) return;
    if (!hasWizardInput(values)) {
      setDraftStatus(clearWizardDraft(userId) ? 'empty' : 'failed');
      return;
    }
    setDraftStatus('saving');
    const timer = window.setTimeout(() => {
      setDraftStatus(saveWizardDraft(userId, values) ? 'saved' : 'failed');
    }, 450);
    draftTimer.current = timer;
    return () => window.clearTimeout(timer);
  }, [values, userId, draft, created]);

  useEffect(() => {
    if (draft || created || !codeValid) {
      setCheck({ code: values.code, status: 'idle' });
      return;
    }
    let active = true;
    setCheck({ code: values.code, status: 'pending' });
    const timer = window.setTimeout(() => {
      void exampleProjectService.checkCode(values.code).then(({ data }) => {
        if (active) setCheck({ code: values.code, status: data.available ? 'available' : 'taken' });
      }).catch(() => {
        if (active) setCheck({ code: values.code, status: 'error' });
      });
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [values.code, codeValid, checkAttempt, draft, created]);

  const update = <K extends keyof ProjectInput>(field: K, value: ProjectInput[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError(false);
  };
  const goTo = (target: number) => {
    if (saving || created || target === 3 || target > reached) return;
    if (target > step) {
      const validation = validateWizardStep(values, step);
      if (Object.keys(validation).length || (step === 0 && !codeAvailable)) {
        setErrors(validation);
        return;
      }
    }
    setStep(target);
  };
  const next = () => {
    const validation = validateWizardStep(values, step);
    setErrors(validation);
    if (Object.keys(validation).length || (step === 0 && !codeAvailable)) return;
    setReached((current) => Math.max(current, step + 1));
    setStep(step + 1);
  };
  const submit = async () => {
    if (submitLock.current) return;
    for (let index = 0; index < 3; index += 1) {
      const validation = validateWizardStep(values, index);
      if (Object.keys(validation).length) {
        setErrors(validation);
        setStep(index);
        return;
      }
    }
    if (!codeAvailable) { setStep(0); return; }
    submitLock.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      const { data } = await exampleProjectService.createProject(values);
      if (!alive.current) return;
      // 先同步取消待执行的自动保存，避免成功清理后又写回旧草稿。
      window.clearTimeout(draftTimer.current);
      draftTimer.current = undefined;
      setClearError(!clearWizardDraft(userId));
      setCreated(data);
      setStep(3);
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ApiRequestError && error.status === 409 && error.code === PROJECT_CODE_EXISTS) {
        setErrors({ code: 'exampleForms.wizard.taken' });
        setCheck({ code: values.code, status: 'taken' });
        focusField.current = 'wizard-code';
        setStep(0);
      } else setSaveError(true);
    } finally {
      submitLock.current = false;
      if (alive.current) setSaving(false);
    }
  };
  const startOver = () => {
    setClearError(!clearWizardDraft(userId));
    setDraft(null);
    setValues(emptyWizardValues());
    setDraftStatus('empty');
    setCreated(null);
    setErrors({});
    setSaveError(false);
    setStep(0);
    setReached(0);
  };
  const stepItems: StepItem[] = stepIds.map((id, index) => {
    const invalid = index === step && (Object.values(errors).some(Boolean) || (step === 0 && check.code === values.code && check.status === 'taken'));
    const status = created ? 'done' : invalid ? 'error' : index === step ? 'current' : index < step ? 'done' : 'upcoming';
    return { id, title: t(`exampleForms.wizard.${id}`), status, statusLabel: t(`exampleForms.steps.${status}`), current: index === step, disabled: saving || !!created || index > reached || index === 3 };
  });
  const fieldError = (field: keyof ProjectInput) => errors[field] ? t(errors[field]!) : undefined;
  const fieldProps = (field: keyof ProjectInput, required = false) => ({
    id: `wizard-${field}`,
    'aria-labelledby': `wizard-${field}-label`,
    'aria-invalid': !!errors[field] || (field === 'code' && check.status === 'taken' && check.code === values.code),
    'aria-required': required,
    'aria-describedby': field === 'code' ? 'wizard-code-help wizard-code-status' : errors[field] ? `wizard-${field}-help` : undefined,
    disabled: saving,
  });
  const stepValid = !Object.keys(validateWizardStep(values, step)).length && (step !== 0 || codeAvailable);
  const checkStatus = check.code === values.code ? check.status : codeValid ? 'pending' : 'idle';

  return <>
    <LeaveGuard dirty={dirty} busy={saving} />
    <Card className="min-h-0 flex-1">
      <div className="shrink-0 border-b border-line-soft px-6 py-4"><Steps label={t('exampleForms.wizard.stepsLabel')} items={stepItems} onChange={goTo} /></div>
      <div role="region" aria-label={t(`exampleForms.wizard.${stepIds[step]}`)} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus">
        {draft ? <div className="mx-auto my-8 w-full max-w-xl">
          <Alert type="info" title={t('exampleForms.wizard.draftTitle')} description={t('exampleForms.wizard.draftHint')} />
          <div className="mt-5 flex gap-3"><Button onClick={() => { setValues(draft); setDraft(null); }}>{t('exampleForms.wizard.restore')}</Button><Button onClick={startOver}>{t('exampleForms.wizard.startOver')}</Button></div>
        </div> : created ? <Result status="success" title={<span id="wizard-result-title" tabIndex={-1} className="outline-none">{t('exampleForms.wizard.success')}</span>} description={t('exampleForms.wizard.successDescription', { name: created.name })}
          extra={<><Link className={buttonVariants()} to={`/examples/crud/${created.id}`}>{t('exampleForms.wizard.view')}</Link><Button onClick={startOver}>{t('exampleForms.wizard.another')}</Button></>} />
          : <form noValidate className="mx-auto w-full max-w-2xl space-y-5" onSubmit={(event) => { event.preventDefault(); if (step < 2) next(); else void submit(); }}>
            <div><h2 ref={headingRef} tabIndex={-1} className="text-[15px] font-semibold text-slate-900 outline-none">{t(`exampleForms.wizard.${stepIds[step]}`)}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t(step === 0 ? 'exampleForms.wizard.basicHint' : step === 1 ? 'exampleForms.wizard.ownerHint' : 'exampleForms.wizard.reviewHint')}</p></div>
            {saveError && <Alert type="error" role="alert" title={t('exampleForms.wizard.saveFailed')} />}
            {step === 0 && <>
              <Field id="wizard-name" label={t('exampleProjects.fields.name')} required error={fieldError('name')}>
                <Input {...fieldProps('name', true)} value={values.name} maxLength={60} onChange={(event) => update('name', event.target.value)} onBlur={() => setErrors((current) => ({ ...current, name: validateWizardStep(values, 0).name }))} />
              </Field>
              <Field id="wizard-code" label={t('exampleProjects.fields.code')} required error={fieldError('code')} hint={t('exampleForms.wizard.checkHint')}>
                <Input {...fieldProps('code', true)} value={values.code} className="font-mono" maxLength={20} onChange={(event) => update('code', event.target.value)} onBlur={() => setErrors((current) => ({ ...current, code: validateWizardStep(values, 0).code }))} />
              </Field>
              <div id="wizard-code-status" role="status" aria-live="polite" aria-atomic="true" className="flex min-h-5 items-center gap-2 text-xs text-slate-600">
                {checkStatus !== 'idle' && <><Icon icon={checkStatus === 'pending' ? 'loader-circle' : checkStatus === 'available' ? 'circle-check' : 'circle-alert'} size={14} className={checkStatus === 'pending' ? 'animate-spin' : ''} />
                  {t(checkStatus === 'pending' ? 'exampleForms.wizard.checking' : checkStatus === 'available' ? 'exampleForms.wizard.available' : checkStatus === 'taken' ? 'exampleForms.wizard.taken' : 'exampleForms.wizard.checkFailed')}</>}
              </div>
              {checkStatus === 'error' && <Button size="sm" onClick={() => setCheckAttempt((current) => current + 1)}>{t('exampleForms.wizard.retryCheck')}</Button>}
            </>}
            {step === 1 && <div className="grid gap-5 sm:grid-cols-2">
              <Field id="wizard-owner" label={t('exampleProjects.fields.owner')} required error={fieldError('owner')}>
                <Input {...fieldProps('owner', true)} value={values.owner} maxLength={40} onChange={(event) => update('owner', event.target.value)} onBlur={() => setErrors((current) => ({ ...current, owner: validateWizardStep(values, 1).owner }))} />
              </Field>
              <Field id="wizard-status" label={t('common.columns.status')} required error={fieldError('status')}>
                <Select {...fieldProps('status', true)} value={values.status} onChange={(value: ProjectInput['status']) => update('status', value)} options={(['active', 'paused', 'archived'] as const).map((value) => ({ value, label: t(`exampleProjects.status.${value}`) }))} />
              </Field>
            </div>}
            {step === 2 && <>
              <Field id="wizard-description" label={t('exampleProjects.fields.description')} error={fieldError('description')}>
                <TextArea {...fieldProps('description')} rows={3} maxLength={1000} showCount value={values.description} onChange={(event) => update('description', event.target.value)} />
              </Field>
              <section aria-labelledby="wizard-review-title" className="rounded-xl border border-line">
                <h3 id="wizard-review-title" className="border-b border-line-soft px-4 py-3 text-13 font-medium text-slate-800">{t('exampleForms.wizard.reviewTitle')}</h3>
                {[0, 1, 2].map((index) => <div key={index} className="flex items-start justify-between gap-4 border-b border-line-soft p-4 last:border-b-0">
                  <dl className="min-w-0 space-y-2 text-13">
                    {(index === 0 ? ['name', 'code'] as const : index === 1 ? ['owner', 'status'] as const : ['description'] as const).map((field) => <div key={field} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3"><dt className="text-slate-500">{t(field === 'status' ? 'common.columns.status' : `exampleProjects.fields.${field}`)}</dt><dd className="whitespace-pre-wrap break-words text-slate-800">{field === 'status' ? t(`exampleProjects.status.${values.status}`) : values[field] || t('common.empty.unset')}</dd></div>)}
                  </dl>
                  <a href={`#wizard-${index === 0 ? 'name' : index === 1 ? 'owner' : 'description'}`} onClick={(event) => {
                    event.preventDefault();
                    if (saving) return;
                    const id = `wizard-${index === 0 ? 'name' : index === 1 ? 'owner' : 'description'}`;
                    if (index === step) document.getElementById(id)?.focus();
                    else { focusField.current = id; goTo(index); }
                  }} className="shrink-0 rounded text-xs text-slate-600 underline underline-offset-4 outline-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-focus" aria-label={t('exampleForms.wizard.editStep', { step: t(`exampleForms.wizard.${stepIds[index]}`) })}>{t('common.actions.edit')}</a>
                </div>)}
              </section>
            </>}
          </form>}
        {clearError && <p role="alert" className="mt-4 text-xs text-red-600">{t('exampleForms.wizard.draftClearFailed')}</p>}
      </div>
      {!draft && !created && <CardFooter className="shrink-0 justify-between gap-4">
        <div className="min-w-0 text-xs text-slate-500"><p>{t('exampleForms.wizard.stepCount', { current: step + 1, total: 4 })}</p><p role="status" className="mt-1">{t(draftStatus === 'saved' ? 'exampleForms.wizard.draftSaved' : draftStatus === 'saving' ? 'exampleForms.wizard.draftSaving' : draftStatus === 'failed' ? 'exampleForms.wizard.draftFailed' : 'exampleForms.wizard.draftEmpty')}</p></div>
        <div className="flex shrink-0 gap-2.5">{step > 0 && <Button disabled={saving} onClick={() => goTo(step - 1)}>{t('exampleForms.wizard.back')}</Button>}
          {step < 2 ? <Button disabled={!stepValid} onClick={next}>{t('exampleForms.wizard.next')}<Icon icon="arrow-right" size={15} /></Button> : <Button disabled={!stepValid} loading={saving} onClick={() => void submit()}>{t('exampleForms.wizard.submit')}</Button>}</div>
      </CardFooter>}
    </Card>
  </>;
}

export function FormWizardPage() {
  const { t } = useT();
  const userId = useAuthStore((state) => state.user?.id);
  const canCreate = usePermission('example:create');
  return <div className="flex h-full min-h-0 min-w-0 flex-col">
    <PageHeader title={t('exampleForms.wizard.title')} description={t('exampleForms.wizard.description')} />
    {canCreate && userId ? <ProjectWizard key={userId} userId={userId} /> : <Card className="min-h-0 flex-1"><div className="min-h-0 flex-1 overflow-auto p-6"><Result status="info" title={t('exampleForms.wizard.readOnly')} description={t('exampleForms.wizard.readOnlyHint')} /></div></Card>}
  </div>;
}
