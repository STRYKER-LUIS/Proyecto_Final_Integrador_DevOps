import { z } from 'zod';
import {
  CATEGORIES,
  IMPACTS,
  INCIDENT_STATUSES,
  PRIORITIES,
  URGENCIES,
} from '../domain/types';
import { optionalBooleanQuery, paginationSchema } from './common.schema';

export const incidentListQuerySchema = z
  .object({
    page: paginationSchema.shape.page,
    pageSize: paginationSchema.shape.pageSize,
    search: z.string().trim().min(1).max(120).optional(),
    status: z.enum(INCIDENT_STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    category: z.enum(CATEGORIES).optional(),
    assigneeId: z.string().uuid('El agente no es válido').optional(),
    unassigned: optionalBooleanQuery,
    mine: optionalBooleanQuery,
    sort: z.enum(['newest', 'oldest', 'priority']).default('newest'),
  })
  .strict()
  .refine((data) => !(data.unassigned && data.assigneeId), {
    message: 'No puedes filtrar por asignado y sin asignar al mismo tiempo',
    path: ['assigneeId'],
  });

export type IncidentListQuery = z.infer<typeof incidentListQuerySchema>;

export const createIncidentSchema = z
  .object({
    title: z
      .string({ error: 'El título es obligatorio' })
      .trim()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(200, 'El título no puede superar los 200 caracteres'),
    description: z
      .string({ error: 'La descripción es obligatoria' })
      .trim()
      .min(10, 'La descripción debe tener al menos 10 caracteres')
      .max(10_000, 'La descripción no puede superar los 10000 caracteres'),
    category: z.enum(CATEGORIES, {
      error: 'La categoría es obligatoria',
    }),
    impact: z.enum(IMPACTS, {
      error: 'El impacto es obligatorio',
    }),
    urgency: z.enum(URGENCIES, {
      error: 'La urgencia es obligatoria',
    }),
  })
  .strict();

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z
  .object({
    title: z.string().trim().min(5).max(200).optional(),
    description: z.string().trim().min(10).max(10_000).optional(),
    category: z.enum(CATEGORIES).optional(),
    impact: z.enum(IMPACTS).optional(),
    urgency: z.enum(URGENCIES).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar',
  });

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;

export const changeStatusSchema = z
  .object({
    status: z.enum(INCIDENT_STATUSES, {
      error: 'El estado es obligatorio',
    }),
    note: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

export const assignIncidentSchema = z
  .object({
    assigneeId: z.string().uuid('El agente no es válido'),
    note: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export type AssignIncidentInput = z.infer<typeof assignIncidentSchema>;

export const createCommentSchema = z
  .object({
    content: z
      .string({ error: 'El comentario es obligatorio' })
      .trim()
      .min(1, 'El comentario no puede estar vacío')
      .max(2_000, 'El comentario no puede superar los 2000 caracteres'),
    isInternal: z.boolean().default(false),
  })
  .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
