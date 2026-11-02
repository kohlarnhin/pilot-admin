import { getLocale, t } from "@/i18n";
import * as React from "react";

/* ------------------------------------------------------------------------ */
/* 类型                                                                      */
/* ------------------------------------------------------------------------ */

export type Values = Record<string, any>;

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

export interface FieldState {
  value: any;
  errors: string[] | undefined;
}

interface RegisteredField {
  rules: () => RuleLike[] | undefined;
  dependencies: () => string[] | undefined;
  label: () => string | undefined;
  controlId: () => string | undefined;
}

export interface Callbacks {
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

export class FormStore {
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

export const storeMap = new WeakMap<FormInstance, FormStore>();

function createForm<T>(): FormInstance<T> {
  const store = new FormStore();
  storeMap.set(store.instance, store);
  return store.instance as unknown as FormInstance<T>;
}

export function useForm<T = any>(form?: FormInstance<T>): [FormInstance<T>] {
  const ref = React.useRef<FormInstance<T> | undefined>(undefined);
  if (!ref.current) ref.current = form ?? createForm<T>();
  return [ref.current];
}

