import type { ProfileValues } from '@/api/services/exampleFormService';

/** 中性演示值，不代表已保存的组织或账号资料。 */
export const defaultProfile = (): ProfileValues => ({
  organizationName: 'Example organization',
  website: 'https://example.com',
  contactName: 'Alex Morgan',
  email: 'contact@example.com',
  phone: '',
  country: 'other',
  region: '',
  city: '',
  street: '',
  postalCode: '',
  systemNotice: true,
  activityDigest: false,
  productUpdates: false,
  startDate: '2026-11-01',
  endDate: '2026-12-01',
  retentionDays: '30',
});
