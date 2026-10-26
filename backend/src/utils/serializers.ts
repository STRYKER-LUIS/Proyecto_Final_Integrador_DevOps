import type { Prisma } from '@prisma/client';
import type { ActivityActionValue, IncidentStatusValue, SlaState } from '../domain';
import type { PublicUser } from '../types/auth';
import { getSlaState } from '../domain/sla';
import { formatTicketNumber } from '../utils/ticket';

export const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

export const incidentPeopleInclude = {
  reporter: { select: userSummarySelect },
  assignee: { select: userSummarySelect },
} satisfies Prisma.IncidentInclude;

type UserSummary = Prisma.UserGetPayload<{ select: typeof userSummarySelect }>;
export type IncidentWithPeople = Prisma.IncidentGetPayload<{
  include: typeof incidentPeopleInclude;
}>;
type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: { select: typeof userSummarySelect } };
}>;
type ActivityWithActor = Prisma.ActivityGetPayload<{
  include: { actor: { select: typeof userSummarySelect } };
}>;

export interface IncidentResponse {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  urgency: string;
  priority: string;
  status: IncidentStatusValue;
  reporter: PublicUser;
  assignee: PublicUser | null;
  slaDueAt: Date;
  slaStatus: SlaState;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentResponse {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  author: PublicUser;
}

export interface ActivityResponse {
  id: string;
  action: ActivityActionValue;
  detail: string | null;
  fromStatus: IncidentStatusValue | null;
  toStatus: IncidentStatusValue | null;
  createdAt: Date;
  actor: PublicUser | null;
}

export interface IncidentDetailResponse extends IncidentResponse {
  comments: CommentResponse[];
  activities: ActivityResponse[];
  allowedTransitions: IncidentStatusValue[];
}

export function serializeUser(user: UserSummary): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export function serializeIncident(incident: IncidentWithPeople): IncidentResponse {
  return {
    id: incident.id,
    ticketNumber: formatTicketNumber(incident.id),
    title: incident.title,
    description: incident.description,
    category: incident.category,
    impact: incident.impact,
    urgency: incident.urgency,
    priority: incident.priority,
    status: incident.status,
    reporter: serializeUser(incident.reporter),
    assignee: incident.assignee ? serializeUser(incident.assignee) : null,
    slaDueAt: incident.slaDueAt,
    slaStatus: getSlaState({
      status: incident.status,
      slaDueAt: incident.slaDueAt,
      resolvedAt: incident.resolvedAt,
    }),
    firstResponseAt: incident.firstResponseAt,
    resolvedAt: incident.resolvedAt,
    closedAt: incident.closedAt,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
}

export function serializeComment(comment: CommentWithAuthor): CommentResponse {
  return {
    id: comment.id,
    content: comment.content,
    isInternal: comment.isInternal,
    createdAt: comment.createdAt,
    author: serializeUser(comment.author),
  };
}

export function serializeActivity(activity: ActivityWithActor): ActivityResponse {
  return {
    id: activity.id,
    action: activity.action,
    detail: activity.detail,
    fromStatus: activity.fromStatus,
    toStatus: activity.toStatus,
    createdAt: activity.createdAt,
    actor: activity.actor ? serializeUser(activity.actor) : null,
  };
}
