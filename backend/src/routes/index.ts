import { Router } from 'express';
import { authRouter } from './auth.routes';
import { dashboardRouter } from './dashboard.routes';
import { incidentRouter } from './incident.routes';
import { userRouter } from './user.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/incidents', incidentRouter);
apiRouter.use('/users', userRouter);
