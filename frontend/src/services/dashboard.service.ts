import { apiClient } from './http';
import type { DashboardSummary } from '../types';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard');
    return data;
  },
};
