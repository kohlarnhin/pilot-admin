import type source from './locales/zh-CN';

export type Locale = 'zh-CN' | 'en-US';
export type LocalizedDictionary<T> = { [K in keyof T]: T[K] extends string ? string : LocalizedDictionary<T[K]> };
type Source = typeof source;
type Paths<T> = { [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}` }[keyof T & string];
export type MessageKey = Paths<Source>;
type ValueAt<T, K extends string> = K extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T ? ValueAt<T[Head], Tail> : never
  : K extends keyof T ? T[K] : never;
export type Placeholders<S> = S extends `${string}{${infer Name}}${infer Rest}` ? Name | Placeholders<Rest> : never;
export type MessageParams<K extends MessageKey> = Placeholders<ValueAt<Source, K>>;
export type TranslationArgs<K extends MessageKey> = [MessageParams<K>] extends [never]
  ? [] : [params: Record<MessageParams<K>, string | number>];
