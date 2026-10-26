import type { Request, Response } from 'express';
import { userService } from '../services/user.service';

export const userController = {
  listStaff: async (_request: Request, response: Response): Promise<void> => {
    const users = await userService.listStaff();
    response.status(200).json({ users });
  },
};
