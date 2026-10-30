import { t } from '@/i18n';
import { ApiRequestError } from '@/api/http';
import type { ApiResponse, PageResult } from '@/types';
import type { PageQuery } from '@/api/services/pagination';
import { getMockDb } from './db';

export const delay = () => new Promise<void>((resolve) => window.setTimeout(resolve, 150 + Math.random() * 300));

export const createTraceId = () => `mock-${crypto.randomUUID()}`;

export const response = <T,>(data: T, traceId = createTraceId()): ApiResponse<T> => ({
  code: 0,
  message: 'success',
  data: structuredClone(data),
  traceId,
});

export function pageResult<T>(records: T[], { pageNo = 1, pageSize = 20 }: PageQuery): PageResult<T> {
  const size = Math.min(200, Math.max(1, Math.trunc(pageSize)));
  const page = Math.max(1, Math.trunc(pageNo));

  return {
    records: records.slice((page - 1) * size, page * size),
    pageNo: page,
    pageSize: size,
    total: records.length,
    hasNext: page * size < records.length,
  };
}

export const matchesKeyword = (keyword: string | undefined, ...values: (string | undefined)[]) => {
  const terms = (keyword || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = values.join(' ').toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

export function validatePassword(password: string): void {
  const { passwordMinLength, requireLetter, requireNumber } = getMockDb().settings.security;
  if (password.length < passwordMinLength) {
    throw new ApiRequestError(t('serverErrors.password.minLength', { length: passwordMinLength }), 400);
  }
  if (requireLetter && !/[a-z]/i.test(password)) {
    throw new ApiRequestError(t('serverErrors.password.needLetter'), 400);
  }
  if (requireNumber && !/\d/.test(password)) {
    throw new ApiRequestError(t('serverErrors.password.needNumber'), 400);
  }
}
