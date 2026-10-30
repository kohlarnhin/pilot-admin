import { getLocale, t, useT } from '@/i18n';
import * as React from "react";
import { cn } from "@/utils";
import { Tooltip } from "./tooltip";
import { Icon } from "@/components/icon";

/* ------------------------------------------------------------------------ */
/* 类型                                                                      */
/* ------------------------------------------------------------------------ */

type Values = Record<string, any>;

export interface Rule {
  required?: boolean;
  message?: React.ReactNode;
  whitespace?: boolean;
  max?: number;
  min?: number;
  len?: number;
  pattern?: RegExp;
  type?: "string" | "number" | "email" | "url" | "array" | "boolean";
  enum?: unknown[];
  validator?: (rule: Rule, value: any) => Promise<unknown> | unknown;
}

export type RuleLike = Rule | ((form: FormInstance) => Rule);
export type RuleObject = Rule;

export interface ValidateErrorEntity<T = Values> {
  values: T;
  errorFields: Array<{ name: string[]; errors: string[] }>;
}

export interface FieldData {
  name: string | string[];
  value?: any;
  errors?: string[];
}

export interface FormInstance<T = any> {
  getFieldValue: (name: string) => any;
  getFieldsValue: (names?: string[] | true) => T;
  setFieldValue: (name: string, value: any) => void;
  setFieldsValue: (values: Partial<T> | Values) => void;
  setFields: (fields: FieldData[]) => void;
  resetFields: (names?: string[]) => void;
  validateFields: (names?: string[]) => Promise<T>;
  getFieldError: (name: string) => string[];
  submit: () => void;
}

interface FieldState {
  value: any;
  errors: string[] | undefined;
}

interface RegisteredField {
  rules: () => RuleLike[] | undefined;
  dependencies: () => string[] | undefined;
  label: () => string | undefined;
  controlId: () => string | undefined;
}

interface Callbacks {
  onFinish?: (values: any) => void;
  onFinishFailed?: (error: ValidateErrorEntity) => void;
  onValuesChange?: (changed: Values, all: Values) => void;
}

const nameKey = (name: string | string[]) => (Array.isArray(name) ? name.join(".") : name);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

async function runRule(rule: Rule, value: any, label?: string): Promise<string | null> {
  const fallback = (text: string) => (typeof rule.message === "string" ? rule.message : text);

  if (rule.required) {
    if (isEmpty(value) || (rule.whitespace && typeof value === "string" && !value.trim())) {
      return fallback(label ? t('ui.fieldLabelRequired', { label }) : t('ui.fieldRequired'));
    }
  }

  if (isEmpty(value) && !rule.validator) return null;

  if (rule.whitespace && typeof value === "string" && !value.trim()) return fallback(t('ui.whitespace'));

  if (!isEmpty(value)) {
    if (rule.type === "email" && !EMAIL.test(String(value))) return fallback(t('common.validation.emailInvalid'));
    if (rule.type === "url") {
      try {
        new URL(String(value));
      } catch {
        return fallback(t('ui.invalidUrl'));
      }
    }
    if (rule.type === "number" && typeof value !== "number") return fallback(t('ui.numberRequired'));

    const measure = typeof value === "number" ? value : typeof value === "string" || Array.isArray(value) ? value.length : undefined;
    if (measure !== undefined) {
      if (rule.len !== undefined && measure !== rule.len) return fallback(t('ui.length', { length: rule.len }));
      if (rule.min !== undefined && measure < rule.min) return fallback(t('ui.min', { min: rule.min }));
      if (rule.max !== undefined && measure > rule.max) return fallback(t('ui.max', { max: rule.max }));
    }
    if (rule.pattern && !rule.pattern.test(String(value))) return fallback(t('ui.invalidFormat'));
    if (rule.enum && !rule.enum.includes(value)) return fallback(t('ui.invalidChoice'));
  }

  if (rule.validator) {
    try {
      await rule.validator(rule, value);
    } catch (error) {
      if (error instanceof Error && error.message) return error.message;
      if (typeof error === "string") return error;
      return fallback(t('ui.invalid'));
    }
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* Store                                                                     */
/* ------------------------------------------------------------------------ */

class FormStore {
  values: Values = {};
  initialValues: Values = {};
  errors: Record<string, string[] | undefined> = {};
  fields = new Map<string, RegisteredField>();
  callbacks: Callbacks = {};
  private listeners = new Set<() => void>();
  private cache = new Map<string, FieldState>();
  private validatedOnce = new Set<string>();
  instance: FormInstance;

  constructor() {
    this.instance = {
      getFieldValue: (name) => this.values[nameKey(name)],
      getFieldsValue: (names) => this.getFieldsValue(names),
      setFieldValue: (name, value) => this.setValues({ [nameKey(name)]: value }),
      setFieldsValue: (values) => this.setValues(values as Values),
      setFields: (fields) => this.setFields(fields),
      resetFields: (names) => this.resetFields(names),
      validateFields: (names) => this.validateFields(names),
      getFieldError: (name) => this.errors[nameKey(name)] ?? [],
      submit: () => void this.submit(),
    };
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getFieldState = (name: string): FieldState => {
    const value = this.values[name];
    const errors = this.errors[name];
    const cached = this.cache.get(name);
    if (cached && cached.value === value && cached.errors === errors) return cached;
    const next = { value, errors };
    this.cache.set(name, next);
    return next;
  };

  getFieldsValue(names?: string[] | true) {
    if (names === true || (!names && this.fields.size === 0)) return { ...this.values };
    const keys = names ?? Array.from(this.fields.keys());
    return keys.reduce<Values>((result, key) => {
      result[key] = this.values[key];
      return result;
    }, {});
  }

  setInitialValues(values: Values | undefined) {
    if (!values) return;
    this.initialValues = { ...this.initialValues, ...values };
    Object.entries(values).forEach(([key, value]) => {
      if (this.values[key] === undefined) this.values[key] = value;
    });
  }

  ensureInitial(name: string, value: unknown) {
    if (value === undefined) return;
    if (this.initialValues[name] === undefined) this.initialValues[name] = value;
    if (this.values[name] === undefined) this.values[name] = value;
  }

  setValues(values: Values) {
    this.values = { ...this.values, ...values };
    this.notify();
  }

  setFields(fields: FieldData[]) {
    fields.forEach((field) => {
      const key = nameKey(field.name);
      if ("value" in field) this.values = { ...this.values, [key]: field.value };
      if (field.errors) this.errors = { ...this.errors, [key]: field.errors.length ? field.errors : undefined };
    });
    this.notify();
  }

  resetFields(names?: string[]) {
    const keys = names ?? Array.from(new Set([...Object.keys(this.values), ...Object.keys(this.errors)]));
    const nextValues = { ...this.values };
    const nextErrors = { ...this.errors };
    keys.forEach((key) => {
      nextValues[key] = this.initialValues[key];
      nextErrors[key] = undefined;
      this.validatedOnce.delete(key);
    });
    this.values = nextValues;
    this.errors = nextErrors;
    this.notify();
  }

  register(name: string, field: RegisteredField) {
    this.fields.set(name, field);
    return () => {
      if (this.fields.get(name) === field) this.fields.delete(name);
    };
  }

  /** 用户输入：写值 → 校验当前字段 → 校验依赖它且已校验过的字段 */
  changeByUser(name: string, value: unknown) {
    this.values = { ...this.values, [name]: value };
    this.notify();
    this.callbacks.onValuesChange?.({ [name]: value }, { ...this.values });
    void this.validateField(name);
    this.fields.forEach((field, key) => {
      if (key !== name && this.validatedOnce.has(key) && field.dependencies()?.includes(name)) {
        void this.validateField(key);
      }
    });
  }

  async validateField(name: string): Promise<string[]> {
    const locale = getLocale();
    const field = this.fields.get(name);
    if (!field) return [];
    this.validatedOnce.add(name);
    const rules = (field.rules() ?? []).map((rule) => (typeof rule === "function" ? rule(this.instance) : rule));
    const value = this.values[name];
    const label = field.label();
    const results: string[] = [];
    for (const rule of rules) {
      const error = await runRule(rule, value, label);
      if (error) {
        results.push(error);
        break;
      }
    }
    // 校验期间值已变化时丢弃过期结果
    if (this.values[name] !== value || locale !== getLocale()) return results;
    this.errors = { ...this.errors, [name]: results.length ? results : undefined };
    this.notify();
    return results;
  }

  async validateFields(names?: string[]) {
    const keys = names ?? Array.from(this.fields.keys());
    const outcomes = await Promise.all(keys.map(async (key) => ({ key, errors: await this.validateField(key) })));
    const errorFields = outcomes.filter((item) => item.errors.length > 0).map((item) => ({ name: [item.key], errors: item.errors }));
    const values = this.getFieldsValue();
    if (errorFields.length > 0) {
      // 整表校验（提交路径）失败时聚焦首个错误控件；局部校验不移动焦点。
      if (!names) {
        const controlId = this.fields.get(errorFields[0].name[0])?.controlId();
        if (controlId) document.getElementById(controlId)?.focus();
      }
      const error: ValidateErrorEntity = { values, errorFields };
      return Promise.reject(error);
    }
    return values;
  }

  async submit() {
    try {
      const values = await this.validateFields();
      this.callbacks.onFinish?.(values);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        this.callbacks.onFinishFailed?.(error as ValidateErrorEntity);
      } else {
        throw error;
      }
    }
  }
}

const storeMap = new WeakMap<FormInstance, FormStore>();

function createForm<T>(): FormInstance<T> {
  const store = new FormStore();
  storeMap.set(store.instance, store);
  return store.instance as unknown as FormInstance<T>;
}

function useForm<T = any>(form?: FormInstance<T>): [FormInstance<T>] {
  const ref = React.useRef<FormInstance<T> | undefined>(undefined);
  if (!ref.current) ref.current = form ?? createForm<T>();
  return [ref.current];
}

/* ------------------------------------------------------------------------ */
/* 组件                                                                      */
/* ------------------------------------------------------------------------ */

interface FormContextValue {
  store: FormStore;
  layout: "vertical" | "horizontal";
  requiredMark: boolean;
  disabled?: boolean;
}

const FormContext = React.createContext<FormContextValue | null>(null);

export interface FormProps<T = any> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children"> {
  form?: FormInstance<T>;
  layout?: "vertical" | "horizontal" | "inline";
  initialValues?: Partial<T> | Values;
  onFinish?: (values: T) => void;
  onFinishFailed?: (error: ValidateErrorEntity<T>) => void;
  onValuesChange?: (changed: Partial<T>, all: T) => void;
  requiredMark?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

function FormRoot<T = any>({
  form,
  layout = "vertical",
  initialValues,
  onFinish,
  onFinishFailed,
  onValuesChange,
  requiredMark = true,
  disabled,
  className,
  children,
  ...rest
}: FormProps<T>) {
  const [instance] = useForm<T>(form);
  const store = storeMap.get(instance as unknown as FormInstance)!;
  React.useState(() => store.setInitialValues(initialValues as Values | undefined));
  store.callbacks = {
    onFinish: onFinish as Callbacks["onFinish"],
    onFinishFailed: onFinishFailed as Callbacks["onFinishFailed"],
    onValuesChange: onValuesChange as Callbacks["onValuesChange"],
  };

  const context = React.useMemo<FormContextValue>(
    () => ({ store, layout: layout === "horizontal" ? "horizontal" : "vertical", requiredMark, disabled }),
    [disabled, layout, requiredMark, store]
  );

  return (
    <FormContext.Provider value={context}>
      <form
        noValidate
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void store.submit();
        }}
        {...rest}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

export interface FormItemProps {
  name?: string;
  label?: React.ReactNode;
  rules?: RuleLike[];
  required?: boolean;
  extra?: React.ReactNode;
  help?: React.ReactNode;
  tooltip?: React.ReactNode;
  /** 标签行右侧附加内容 */
  labelExtra?: React.ReactNode;
  valuePropName?: string;
  getValueFromEvent?: (...args: any[]) => any;
  dependencies?: string[];
  initialValue?: any;
  noStyle?: boolean;
  hidden?: boolean;
  className?: string;
  labelClassName?: string;
  htmlFor?: string;
  children?: React.ReactNode;
}

const labelText = (label: React.ReactNode): string | undefined => {
  if (typeof label === "string") return label;
  if (React.isValidElement(label)) {
    const child = (label.props as { children?: React.ReactNode }).children;
    if (typeof child === "string") return child;
    if (Array.isArray(child) && typeof child[0] === "string") return child[0].trim();
  }
  return undefined;
};

/** 字段标签：13px 中等字重；必填星标位于标签后方。 */
export function FieldLabel({
  children,
  required,
  tooltip,
  htmlFor,
  id,
  extra,
  className,
}: {
  children: React.ReactNode;
  required?: boolean;
  tooltip?: React.ReactNode;
  htmlFor?: string;
  id?: string;
  /** 标签行右侧附加内容（辅助操作、提示等） */
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <label id={id} htmlFor={htmlFor} className={cn("mb-1.5 flex w-full items-center gap-1 text-13 font-medium text-slate-700", className)}>
      <span className="flex min-w-0 flex-1 items-center gap-1">
        {children}
        {required && <span className="text-red-500" aria-hidden="true">*</span>}
        {tooltip && (
          <Tooltip title={tooltip}>
            <span className="inline-flex cursor-help text-slate-400">
              <Icon icon="circle-help" size={14} />
            </span>
          </Tooltip>
        )}
      </span>
      {extra && <span className="ml-auto flex shrink-0 items-center text-xs font-normal">{extra}</span>}
    </label>
  );
}

/** 字段下方说明 / 错误文字 */
export function FieldHint({ children, error, id }: { children: React.ReactNode; error?: boolean; id?: string }) {
  return (
    <div id={id} className={cn("mt-1.5 text-xs leading-[18px]", error ? "text-red-500" : "text-slate-400")} role={error ? "alert" : undefined}>
      {children}
    </div>
  );
}

const defaultGetValue = (valuePropName: string, ...args: any[]) => {
  const event = args[0];
  if (event && typeof event === "object" && "target" in event && event.target && typeof event.target === "object" && !Array.isArray(event)) {
    const target = event.target as Record<string, unknown>;
    if (valuePropName in target) return target[valuePropName];
    return target.value;
  }
  return event;
};

function FormItem({
  name,
  label,
  rules,
  required,
  extra,
  help,
  tooltip,
  labelExtra,
  valuePropName = "value",
  getValueFromEvent,
  dependencies,
  initialValue,
  noStyle,
  hidden,
  className,
  labelClassName,
  htmlFor,
  children,
}: FormItemProps) {
  const { locale } = useT();
  const context = React.useContext(FormContext);
  const store = context?.store;
  const key = name;
  const labelId = React.useId();
  const child = React.isValidElement(children) ? children as React.ReactElement<Record<string, any>> : undefined;
  const controlId = child?.props.id ?? htmlFor ?? (key ? `form_item_${key}` : undefined);
  const hasLabel = label !== undefined && label !== null && label !== false && !noStyle;
  const previousLocale = React.useRef(locale);

  React.useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    if (store && key && store.instance.getFieldError(key).length) {
      void store.validateField(key);
    }
  }, [key, store, locale]);

  React.useState(() => {
    if (store && key) store.ensureInitial(key, initialValue);
  });

  const latest = React.useRef({ rules, dependencies, label, controlId });
  latest.current = { rules, dependencies, label, controlId };

  React.useEffect(() => {
    if (!store || !key) return;
    return store.register(key, {
      rules: () => latest.current.rules,
      dependencies: () => latest.current.dependencies,
      label: () => labelText(latest.current.label),
      controlId: () => latest.current.controlId,
    });
  }, [key, store]);

  const subscribe = React.useCallback((listener: () => void) => (store ? store.subscribe(listener) : () => undefined), [store]);
  const emptyState = React.useMemo<FieldState>(() => ({ value: undefined, errors: undefined }), []);
  const state = React.useSyncExternalStore(
    subscribe,
    () => (store && key ? store.getFieldState(key) : emptyState),
    () => emptyState
  );

  const isRequired = required ?? Boolean(rules?.some((rule) => typeof rule !== "function" && rule.required));
  const errors = state.errors;
  const hintId = controlId && (errors?.length || help) ? `${controlId}_help` : undefined;

  let control = children;
  if (child) {
    const describedBy = [child.props["aria-describedby"], hintId].filter(Boolean).join(" ") || undefined;
    control = React.cloneElement(child, {
      id: child.props.id ?? controlId,
      "aria-labelledby": child.props["aria-labelledby"] ?? (child.props["aria-label"] === undefined && hasLabel ? labelId : undefined),
      "aria-invalid": errors?.length ? true : child.props["aria-invalid"],
      "aria-describedby": describedBy,
      "aria-required": isRequired || child.props["aria-required"] || undefined,
      ...(store && key ? {
        [valuePropName]: state.value,
        disabled: child.props.disabled ?? context?.disabled,
        onChange: (...args: any[]) => {
          const value = getValueFromEvent ? getValueFromEvent(...args) : defaultGetValue(valuePropName, ...args);
          store.changeByUser(key, value);
          child.props.onChange?.(...args);
        },
      } : {}),
    });
  }

  if (noStyle) return <>{control}</>;

  return (
    <div className={cn("mb-4", hidden && "hidden", className)} data-slot="form-item">
      {hasLabel && (
        <FieldLabel id={labelId} htmlFor={controlId} required={context?.requiredMark !== false && isRequired} tooltip={tooltip} extra={labelExtra} className={labelClassName}>
          {label}
        </FieldLabel>
      )}
      {control}
      {errors && errors.length > 0 ? <FieldHint error id={hintId}>{errors[0]}</FieldHint> : help ? <FieldHint id={hintId}>{help}</FieldHint> : null}
      {extra && <FieldHint>{extra}</FieldHint>}
    </div>
  );
}

type FormComponent = typeof FormRoot & {
  Item: typeof FormItem;
  useForm: typeof useForm;
};

const Form = FormRoot as FormComponent;
Form.Item = FormItem;
Form.useForm = useForm;

export { Form, FormItem, useForm };
