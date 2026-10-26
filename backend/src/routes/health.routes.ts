import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asyncHandler';

export const healthRouter = Router();

healthRouter.get('/', healthController.live);
healthRouter.get('/live', healthController.live);
healthRouter.get('/ready', asyncHandler(healthController.ready));
