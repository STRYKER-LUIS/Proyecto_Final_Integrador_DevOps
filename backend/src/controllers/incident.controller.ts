import type { Request, Response } from 'express';
import { incidentService } from '../services/incident.service';
import type { IdParam } from '../schemas/common.schema';
import type {
  AssignIncidentInput,
  ChangeStatusInput,
  CreateCommentInput,
  CreateIncidentInput,
  IncidentListQuery,
  UpdateIncidentInput,
} from '../schemas/incident.schema';
import {
  getAuthUser,
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../utils/request';

export const incidentController = {
  list: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const filters = getValidatedQuery<IncidentListQuery>(request);
    const result = await incidentService.list(user, filters);

    response.status(200).json(result);
  },

  getById: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const { id } = getValidatedParams<IdParam>(request);
    const incident = await incidentService.getById(user, id);

    response.status(200).json(incident);
  },

  create: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const input = getValidatedBody<CreateIncidentInput>(request);
    const incident = await incidentService.create(user, input);

    response.status(201).json(incident);
  },

  update: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const { id } = getValidatedParams<IdParam>(request);
    const input = getValidatedBody<UpdateIncidentInput>(request);
    const incident = await incidentService.update(user, id, input);

    response.status(200).json(incident);
  },

  changeStatus: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const { id } = getValidatedParams<IdParam>(request);
    const input = getValidatedBody<ChangeStatusInput>(request);
    const incident = await incidentService.changeStatus(user, id, input);

    response.status(200).json(incident);
  },

  assign: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const { id } = getValidatedParams<IdParam>(request);
    const input = getValidatedBody<AssignIncidentInput>(request);
    const incident = await incidentService.assign(user, id, input);

    response.status(200).json(incident);
  },

  comment: async (request: Request, response: Response): Promise<void> => {
    const user = getAuthUser(request);
    const { id } = getValidatedParams<IdParam>(request);
    const input = getValidatedBody<CreateCommentInput>(request);
    const result = await incidentService.addComment(user, id, input);

    response.status(201).json(result);
  },
};
