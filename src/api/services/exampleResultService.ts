import { requireMenu } from '@/mock/access';
import { delay, response } from '@/mock/helpers';
import type { ApiResponse } from '@/types';

export const exampleResultService = {
  /** 无持久化、无网络请求的重试演示；接入后替换为真实 API。 */
  async retryConnection(): Promise<ApiResponse<{ connected: boolean }>> {
    await delay();
    requireMenu('/examples/results');
    return response({ connected: true });
  },
};
