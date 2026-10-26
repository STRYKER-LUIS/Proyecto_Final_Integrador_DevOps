import { apiClient } from './http';
import type { PublicUser } from '../types';

export const userApi = {
  async listStaff(): Promise<PublicUser[]> {
    const { data } = await apiClient.get<{ users: PublicUser[] }>('/users/agents');
    return data.users;
  },
};
