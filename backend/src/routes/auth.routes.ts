import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { loginLimiter, refreshLimiter } from '../middlewares/rateLimit.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { loginSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const authRouter = Router();

authRouter.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

authRouter.post('/refresh', refreshLimiter, asyncHandler(authController.refresh));

authRouter.post('/logout', asyncHandler(authController.logout));

authRouter.get('/me', authenticate, asyncHandler(authController.me));
