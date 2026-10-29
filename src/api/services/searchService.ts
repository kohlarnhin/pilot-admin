import { userService } from './userService';
import type { User } from '@/types';

export const searchService = {
  searchUsers: async (keyword: string): Promise<User[]> => {
    const result = await userService.getUsers({ keyword, pageNo: 1, pageSize: 8 });
    return result.data.records;
  },
};
