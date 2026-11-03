import type { MessageKey } from '@/i18n';

export interface ProfileValues {
  organizationName: string;
  website: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  city: string;
  street: string;
  postalCode: string;
  systemNotice: boolean;
  activityDigest: boolean;
  productUpdates: boolean;
  startDate: string;
  endDate: string;
  retentionDays: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileValues, Extract<MessageKey, `exampleForms.validation.${string}`>>>;

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

/** 浏览器和无状态服务共用基础校验，跨字段与保留名称由服务再次判断。 */
export function validateProfile(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  if (typeof values.organizationName !== 'string' || !values.organizationName.trim() || values.organizationName.trim().length > 60) errors.organizationName = 'exampleForms.validation.name';
  if (typeof values.website !== 'string' || (values.website && (!/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(values.website) || values.website.length > 200))) errors.website = 'exampleForms.validation.website';
  if (typeof values.contactName !== 'string' || !values.contactName.trim() || values.contactName.trim().length > 40) errors.contactName = 'exampleForms.validation.contact';
  if (typeof values.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 100) errors.email = 'exampleForms.validation.email';
  if (values.phone && (typeof values.phone !== 'string' || !/^[+\d() -]{5,30}$/.test(values.phone))) errors.phone = 'exampleForms.validation.phone';
  if (!['CN', 'US', 'GB', 'SG', 'other'].includes(values.country)) errors.country = 'exampleForms.validation.country';
  for (const field of ['region', 'city', 'street', 'postalCode'] as const) {
    if (typeof values[field] !== 'string' || values[field].length > (field === 'street' ? 120 : 60)) errors[field] = 'exampleForms.validation.address';
  }
  for (const field of ['systemNotice', 'activityDigest', 'productUpdates'] as const) {
    if (typeof values[field] !== 'boolean') errors[field] = 'exampleForms.validation.preference';
  }
  if (!validDate(values.startDate)) errors.startDate = 'exampleForms.validation.startDate';
  if (!validDate(values.endDate)) errors.endDate = 'exampleForms.validation.endDate';
  if (!/^\d+$/.test(values.retentionDays) || Number(values.retentionDays) < 1 || Number(values.retentionDays) > 365) errors.retentionDays = 'exampleForms.validation.retention';
  return errors;
}
