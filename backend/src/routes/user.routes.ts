import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const userRouter = Router();

userRouter.get('/agents', authenticate, asyncHandler(userController.listStaff));
