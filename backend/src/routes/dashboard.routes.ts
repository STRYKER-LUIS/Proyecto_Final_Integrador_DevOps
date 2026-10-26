import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const dashboardRouter = Router();

dashboardRouter.get('/', authenticate, asyncHandler(dashboardController.summary));
