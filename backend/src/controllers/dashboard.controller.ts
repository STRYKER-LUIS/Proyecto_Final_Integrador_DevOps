import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { getAuthUser } from '../utils/request';

export const dashboardController = {
  summary: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const summary = await dashboardService.getSummary(user);

    response.status(200).json(summary);
  },
};
