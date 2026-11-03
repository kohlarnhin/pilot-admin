import { requireMenu } from '@/mock/access';
import { delay, response } from '@/mock/helpers';
import { createId } from '@/utils/id';
import type { ApiResponse } from '@/types';
import { validateProfile, type ProfileErrors, type ProfileValues } from './exampleFormRules';

export type { ProfileValues, ProfileErrors } from './exampleFormRules';
export type ProfileSubmitResult = { success: true; reference: string } | { success: false; errors: ProfileErrors };

export const exampleFormService = {
  /** 无持久化的示例接口，替换为真实 API；服务端重复基础校验并返回字段错误。 */
  async submitProfile(values: ProfileValues): Promise<ApiResponse<ProfileSubmitResult>> {
    await delay();
    requireMenu('/examples/forms/sections');
    const errors = validateProfile(values);
    if (values.organizationName?.trim().toLowerCase() === 'system') {
      errors.organizationName = 'exampleForms.validation.reservedName';
    }
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      errors.endDate = 'exampleForms.validation.dateOrder';
    }
    if (Object.keys(errors).length) return response({ success: false, errors });
    return response({ success: true, reference: `FORM-${createId().slice(0, 8).toUpperCase()}` });
  },
};
