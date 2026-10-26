import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/common.schema';
import {
  assignIncidentSchema,
  changeStatusSchema,
  createCommentSchema,
  createIncidentSchema,
  incidentListQuerySchema,
  updateIncidentSchema,
} from '../schemas/incident.schema';
import { asyncHandler } from '../utils/asyncHandler';

export const incidentRouter = Router();

incidentRouter.use(authenticate);

incidentRouter.get(
  '/',
  validateQuery(incidentListQuerySchema),
  asyncHandler(incidentController.list),
);

incidentRouter.post(
  '/',
  validateBody(createIncidentSchema),
  asyncHandler(incidentController.create),
);

incidentRouter.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(incidentController.getById),
);

incidentRouter.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateIncidentSchema),
  asyncHandler(incidentController.update),
);

incidentRouter.patch(
  '/:id/status',
  authorize('ADMIN', 'AGENT'),
  validateParams(idParamSchema),
  validateBody(changeStatusSchema),
  asyncHandler(incidentController.changeStatus),
);

incidentRouter.patch(
  '/:id/assign',
  authorize('ADMIN', 'AGENT'),
  validateParams(idParamSchema),
  validateBody(assignIncidentSchema),
  asyncHandler(incidentController.assign),
);

incidentRouter.post(
  '/:id/comments',
  validateParams(idParamSchema),
  validateBody(createCommentSchema),
  asyncHandler(incidentController.comment),
);
