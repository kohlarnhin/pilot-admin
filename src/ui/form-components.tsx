import { useT } from '@/i18n';
import * as React from "react";
import { cn } from "@/utils";
import { Tooltip } from "./tooltip";
import { Icon } from "@/components/icon";

import { storeMap, useForm, type Values, type RuleLike, type FormStore, type FormInstance, type ValidateErrorEntity, type Callbacks, type FieldState } from "./form-store";

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
    <div id={id} className={cn("mt-1.5 text-xs leading-[18px]", error ? "text-red-600" : "text-slate-500")} role={error ? "alert" : undefined}>
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

export { Form, FormItem };
