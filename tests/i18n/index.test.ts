import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock('@/i18n/locales/en-US');
});

describe('t', () => {
  it('interpolates string and numeric values, including zero and empty strings', async () => {
    const { t } = await import('@/i18n');
    expect(t('common.toast.copiedValue', { text: '张三 {other}' })).toBe('已复制：张三 {other}');
    expect(t('common.toast.copiedValue', { text: '' })).toBe('已复制：');
    await (await import('@/i18n')).setLocale('en-US');
    expect(t('users.total', { count: 0 })).toBe('Users: 0');
    expect(t('users.total', { count: 12 })).toBe('Users: 12');
  });

  it('retains a missing placeholder rather than displaying undefined', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { t } = await import('@/i18n');
    // 绕过编译期必填参数约束，验证运行时缺失参数的回退。
    expect(Reflect.apply(t, undefined, ['common.toast.copiedValue', {}])).toBe('已复制：{text}');
    expect(Reflect.apply(t, undefined, ['common.toast.copiedValue'])).toBe('已复制：{text}');
    expect(Reflect.apply(t, undefined, ['common.toast.copiedValue', Object.create({ text: 'inherited' })])).toBe('已复制：{text}');
    expect(warn).toHaveBeenCalledWith('[i18n] Missing parameter "text" for "common.toast.copiedValue"');
  });

  it('makes an existing non-hook t reference observe locale switches', async () => {
    const { t, setLocale, getLocale } = await import('@/i18n');
    expect(t('common.actions.save')).toBe('保存');
    await setLocale('en-US');
    expect(getLocale()).toBe('en-US');
    expect(t('common.actions.save')).toBe('Save');
    expect(document.documentElement.lang).toBe('en-US');
    expect(localStorage.getItem('pilot-admin:locale:v1')).toBe('en-US');
    await setLocale('zh-CN');
    expect(t('common.actions.save')).toBe('保存');
  });

  it('reads a stored locale before the singleton is imported and rejects an invalid stored locale', async () => {
    localStorage.setItem('pilot-admin:locale:v1', 'en-US');
    const english = await import('@/i18n');
    expect(english.t('common.actions.save')).toBe('Save');
    localStorage.setItem('pilot-admin:locale:v1', 'invalid');
    vi.resetModules();
    const fallback = await import('@/i18n');
    expect(fallback.getLocale()).toBe('zh-CN');
    expect(fallback.t('common.actions.save')).toBe('保存');
  });

  it('falls back to source text if a translated entry is missing', async () => {
    vi.doMock('@/i18n/locales/en-US', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/i18n/locales/en-US')>();
      const dictionary = structuredClone(actual.default);
      Reflect.deleteProperty(dictionary.common.actions, 'save');
      return { default: dictionary };
    });
    const { t, setLocale } = await import('@/i18n');
    await setLocale('en-US');
    expect(t('common.actions.save')).toBe('保存');
    expect(t('common.actions.cancel')).toBe('Cancel');
  });

  it('returns an unknown runtime key without reading inherited object properties', async () => {
    const { t } = await import('@/i18n');
    expect(Reflect.apply(t, undefined, ['missing.message'])).toBe('missing.message');
    expect(Reflect.apply(t, undefined, ['constructor.name'])).toBe('constructor.name');
  });
});
