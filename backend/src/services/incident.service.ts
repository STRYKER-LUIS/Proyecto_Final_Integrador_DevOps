import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { calculatePriority } from '../domain/priority';
import { calculateSlaDueAt } from '../domain/sla';
import {
  assertTransition,
  getAllowedTransitions,
  statusRequiresAssignee,
} from '../domain/stateMachine';
import type { IncidentStatusValue } from '../domain/types';
import type {
  AssignIncidentInput,
  ChangeStatusInput,
  CreateCommentInput,
  CreateIncidentInput,
  IncidentListQuery,
  UpdateIncidentInput,
} from '../schemas/incident.schema';
import type { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';
import { buildPagination, type PaginatedResult } from '../utils/pagination';
import {
  serializeActivity,
  serializeComment,
  serializeIncident,
  incidentPeopleInclude,
  userSummarySelect,
  type CommentResponse,
  type IncidentDetailResponse,
  type IncidentResponse,
} from '../utils/serializers';

function accessScope(user: AuthUser): Prisma.IncidentWhereInput {
  return user.role === 'REPORTER' ? { reporterId: user.id } : {};
}

function isStaff(user: AuthUser): boolean {
  return user.role === 'ADMIN' || user.role === 'AGENT';
}

function parseSearchNumber(search: string): number | null {
  const normalized = search.trim().replace(/^INC-?/i, '');
  if (!/^\d{1,10}$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildIncidentWhere(
  filters: IncidentListQuery,
  user: AuthUser,
): Prisma.IncidentWhereInput {
  const where: Prisma.IncidentWhereInput = {
    ...accessScope(user),
  };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.category) where.category = filters.category;
  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.unassigned) where.assigneeId = null;
  if (filters.mine) where.assigneeId = user.id;

  if (filters.search) {
    const ticketNumber = parseSearchNumber(filters.search);
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      ...(ticketNumber ? [{ id: ticketNumber }] : []),
    ];
  }

  return where;
}

function getOrderBy(
  sort: IncidentListQuery['sort'],
): Prisma.IncidentOrderByWithRelationInput[] {
  if (sort === 'oldest') return [{ createdAt: 'asc' }];
  if (sort === 'priority') return [{ priority: 'desc' }, { createdAt: 'desc' }];
  return [{ createdAt: 'desc' }];
}

async function findIncidentForUser(
  incidentId: number,
  user: AuthUser,
): Promise<Awaited<ReturnType<typeof prisma.incident.findFirstOrThrow>>> {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      ...accessScope(user),
    },
  });

  if (!incident) {
    throw AppError.notFound('Incidente no encontrado', 'INCIDENT_NOT_FOUND');
  }

  return incident;
}

function ensureStaff(user: AuthUser): void {
  if (!isStaff(user)) {
    throw AppError.forbidden('Solo el equipo de soporte puede gestionar incidentes');
  }
}

function appendNote(message: string, note?: string): string {
  return (note ? `${message} · ${note}` : message).slice(0, 500);
}

export interface CreateCommentResult {
  comment: CommentResponse;
}

export const incidentService = {
  list: async (
    user: AuthUser,
    filters: IncidentListQuery,
  ): Promise<PaginatedResult<IncidentResponse>> => {
    const where = buildIncidentWhere(filters, user);
    const skip = (filters.page - 1) * filters.pageSize;

    const [incidents, total] = await prisma.$transaction([
      prisma.incident.findMany({
        where,
        include: incidentPeopleInclude,
        orderBy: getOrderBy(filters.sort),
        skip,
        take: filters.pageSize,
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      items: incidents.map(serializeIncident),
      pagination: buildPagination(filters.page, filters.pageSize, total),
    };
  },

  getById: async (user: AuthUser, incidentId: number): Promise<IncidentDetailResponse> => {
    const incident = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        ...accessScope(user),
      },
      include: {
        ...incidentPeopleInclude,
        comments: {
          where: user.role === 'REPORTER' ? { isInternal: false } : {},
          include: {
            author: { select: userSummarySelect },
          },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          include: {
            actor: { select: userSummarySelect },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!incident) {
      throw AppError.notFound('Incidente no encontrado', 'INCIDENT_NOT_FOUND');
    }

    return {
      ...serializeIncident(incident),
      comments: incident.comments.map(serializeComment),
      activities: incident.activities.map(serializeActivity),
      allowedTransitions: isStaff(user) ? [...getAllowedTransitions(incident.status)] : [],
    };
  },

  create: async (user: AuthUser, input: CreateIncidentInput): Promise<IncidentDetailResponse> => {
    const now = new Date();
    const priority = calculatePriority(input.impact, input.urgency);
    const slaDueAt = calculateSlaDueAt(now, priority);

    const incident = await prisma.$transaction(async (transaction) => {
      const created = await transaction.incident.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          impact: input.impact,
          urgency: input.urgency,
          priority,
          slaDueAt,
          reporterId: user.id,
        },
      });

      await transaction.activity.create({
        data: {
          incidentId: created.id,
          actorId: user.id,
          action: 'CREATED',
          detail: 'Incidente registrado',
        },
      });

      return created;
    });

    return incidentService.getById(user, incident.id);
  },

  update: async (
    user: AuthUser,
    incidentId: number,
    input: UpdateIncidentInput,
  ): Promise<IncidentDetailResponse> => {
    const incident = await findIncidentForUser(incidentId, user);

    if (!isStaff(user)) {
      if (incident.status !== 'NEW') {
        throw AppError.conflict(
          'Solo puedes editar el incidente mientras está en estado Nuevo',
          'INCIDENT_NOT_EDITABLE',
        );
      }

      if (input.impact || input.urgency) {
        throw AppError.forbidden('No puedes modificar el impacto ni la urgencia');
      }
    }

    const data: Prisma.IncidentUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.category !== undefined) data.category = input.category;

    if (input.impact !== undefined || input.urgency !== undefined) {
      const impact = input.impact ?? incident.impact;
      const urgency = input.urgency ?? incident.urgency;
      data.impact = impact;
      data.urgency = urgency;
      data.priority = calculatePriority(impact, urgency);
      data.slaDueAt = calculateSlaDueAt(incident.createdAt, data.priority);
    }

    await prisma.$transaction([
      prisma.incident.update({
        where: { id: incidentId },
        data,
      }),
      prisma.activity.create({
        data: {
          incidentId,
          actorId: user.id,
          action: 'UPDATED',
          detail: `Datos actualizados: ${Object.keys(input).join(', ')}`.slice(0, 500),
        },
      }),
    ]);

    return incidentService.getById(user, incidentId);
  },

  assign: async (
    user: AuthUser,
    incidentId: number,
    input: AssignIncidentInput,
  ): Promise<IncidentDetailResponse> => {
    ensureStaff(user);
    const incident = await findIncidentForUser(incidentId, user);

    if (['RESOLVED', 'CLOSED', 'CANCELLED'].includes(incident.status)) {
      throw AppError.conflict(
        'No se puede asignar un incidente finalizado o cancelado',
        'INCIDENT_NOT_ASSIGNABLE',
      );
    }

    if (user.role === 'AGENT' && input.assigneeId !== user.id) {
      throw AppError.forbidden('Los agentes solo pueden asignarse incidentes a sí mismos');
    }

    const assignee = await prisma.user.findFirst({
      where: {
        id: input.assigneeId,
        isActive: true,
        role: { in: ['AGENT', 'ADMIN'] },
      },
      select: userSummarySelect,
    });

    if (!assignee) {
      throw AppError.badRequest(
        'El agente seleccionado no existe o no está disponible',
        'INVALID_ASSIGNEE',
      );
    }

    const nextStatus: IncidentStatusValue =
      incident.status === 'NEW' ? 'ASSIGNED' : incident.status;

    if (incident.assigneeId === assignee.id && incident.status === nextStatus) {
      throw AppError.conflict(
        'El incidente ya está asignado a este agente',
        'ALREADY_ASSIGNED',
      );
    }

    const now = new Date();
    const detail = appendNote(`Incidente asignado a ${assignee.name}`, input.note);

    await prisma.$transaction([
      prisma.incident.update({
        where: { id: incidentId },
        data: {
          assignee: { connect: { id: assignee.id } },
          status: nextStatus,
          firstResponseAt: incident.firstResponseAt ?? now,
        },
      }),
      prisma.activity.create({
        data: {
          incidentId,
          actorId: user.id,
          action: 'ASSIGNED',
          detail,
          fromStatus: incident.status,
          toStatus: nextStatus,
        },
      }),
    ]);

    return incidentService.getById(user, incidentId);
  },

  changeStatus: async (
    user: AuthUser,
    incidentId: number,
    input: ChangeStatusInput,
  ): Promise<IncidentDetailResponse> => {
    ensureStaff(user);
    const incident = await findIncidentForUser(incidentId, user);

    assertTransition(incident.status, input.status);

    const now = new Date();
    let assigneeId = incident.assigneeId;
    if (statusRequiresAssignee(input.status) && !assigneeId) {
      assigneeId = user.id;
    }

    const data: Prisma.IncidentUpdateInput = {
      status: input.status,
      firstResponseAt: incident.firstResponseAt ?? now,
    };

    if (assigneeId !== incident.assigneeId) {
      data.assignee = { connect: { id: assigneeId as string } };
    }

    if (input.status === 'RESOLVED') {
      data.resolvedAt = now;
      data.closedAt = null;
    } else if (input.status === 'CLOSED') {
      data.closedAt = now;
      data.resolvedAt = incident.resolvedAt ?? now;
    } else if (input.status === 'IN_PROGRESS') {
      data.resolvedAt = null;
      data.closedAt = null;
    } else if (input.status === 'CANCELLED') {
      data.resolvedAt = null;
      data.closedAt = null;
    }

    await prisma.$transaction([
      prisma.incident.update({
        where: { id: incidentId },
        data,
      }),
      prisma.activity.create({
        data: {
          incidentId,
          actorId: user.id,
          action: 'STATUS_CHANGED',
          detail: input.note ?? null,
          fromStatus: incident.status,
          toStatus: input.status,
        },
      }),
    ]);

    return incidentService.getById(user, incidentId);
  },

  addComment: async (
    user: AuthUser,
    incidentId: number,
    input: CreateCommentInput,
  ): Promise<CreateCommentResult> => {
    const incident = await findIncidentForUser(incidentId, user);

    if (input.isInternal && !isStaff(user)) {
      throw AppError.forbidden('Solo el equipo de soporte puede crear notas internas');
    }

    const now = new Date();
    const comment = await prisma.$transaction(async (transaction) => {
      const createdComment = await transaction.comment.create({
        data: {
          incidentId,
          authorId: user.id,
          content: input.content,
          isInternal: input.isInternal,
        },
        include: {
          author: { select: userSummarySelect },
        },
      });

      if (isStaff(user) && !incident.firstResponseAt) {
        await transaction.incident.update({
          where: { id: incidentId },
          data: { firstResponseAt: now },
        });
      }

      await transaction.activity.create({
        data: {
          incidentId,
          actorId: user.id,
          action: 'COMMENTED',
          detail: input.isInternal ? 'Nota interna agregada' : 'Comentario agregado',
        },
      });

      return createdComment;
    });

    return {
      comment: serializeComment(comment),
    };
  },
};
