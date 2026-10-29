import { cloneElement, isValidElement, type ReactNode } from 'react';
import source from './locales/zh-CN';
import english from './locales/en-US';
import { getLocale, useLocaleStore } from './store';
import type { MessageKey, MessageParams, TranslationArgs } from './types';

export type { Locale, MessageKey } from './types';
export { getLocale, setLocale } from './store';

const lookup = (tree: unknown, key: string): string | undefined => {
  let value = tree;
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, part)) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : undefined;
};

export const isMessageKey = (key: string): key is MessageKey => lookup(source, key) !== undefined;
const textFor = (key: string) => lookup(getLocale() === 'en-US' ? english : source, key) ?? lookup(source, key) ?? key;
const warnMissing = (key: string, name: string) => {
  if (import.meta.env.DEV) console.warn(`[i18n] Missing parameter "${name}" for "${key}"`);
};

/** 非 hook 调用也读取当前语言；不要在模块常量中保存翻译后的文本。 */
export function t<const K extends MessageKey>(key: K, ...args: TranslationArgs<NoInfer<K>>): string {
  const params = args[0] as Record<string, string | number> | undefined;
  return textFor(key).replace(/\{([^{}]+)\}/g, (placeholder, name: string) => {
    if (params && Object.prototype.hasOwnProperty.call(params, name)) return String(params[name]);
    warnMissing(key, name);
    return placeholder;
  });
}

/** 只用于确实需要保留内联样式的句子，如错误页中的角色编码。 */
export function tNode<K extends MessageKey>(key: K, nodes: Record<MessageParams<K>, ReactNode>): ReactNode[] {
  return textFor(key).split(/(\{[^{}]+\})/g).map((part, index) => {
    if (!part.startsWith('{') || !part.endsWith('}')) return part;
    const name = part.slice(1, -1);
    if (!Object.prototype.hasOwnProperty.call(nodes, name)) { warnMissing(key, name); return part; }
    const node = (nodes as Record<string, ReactNode>)[name];
    return isValidElement(node) ? cloneElement(node, { key: index }) : node;
  });
}

export function useT() {
  const locale = useLocaleStore((state) => state.locale);
  return { t, locale };
}

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => new Intl.NumberFormat(getLocale(), options).format(value);
