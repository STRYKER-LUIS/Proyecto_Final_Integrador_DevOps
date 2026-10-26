import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  buildDailyTrend,
  computeResolutionMetrics,
  type TrendPoint,
} from '../domain/dashboardMetrics';
import { SLA_AT_RISK_HOURS, addHours } from '../domain/sla';
import {
  ACTIVE_STATUSES,
  CATEGORIES,
  INCIDENT_STATUSES,
  PRIORITIES,
  RESOLVED_STATUSES,
} from '../domain/types';
import type {
  CategoryValue,
  IncidentStatusValue,
  PriorityValue,
} from '../domain/types';
import type { AuthUser } from '../types/auth';
import {
  incidentPeopleInclude,
  serializeIncident,
  type IncidentResponse,
} from '../utils/serializers';

export interface DashboardResponse {
  generatedAt: Date;
  scope: 'GLOBAL' | 'OWN';
  kpis: {
    totalIncidents: number;
    openIncidents: number;
    unassignedIncidents: number;
    inProgressIncidents: number;
    slaAtRisk: number;
    slaBreached: number;
    resolvedLast7Days: number;
    averageResolutionHours: number | null;
    slaComplianceRate: number | null;
  };
  statusDistribution: Array<{ status: IncidentStatusValue; count: number }>;
  priorityDistribution: Array<{ priority: PriorityValue; count: number }>;
  categoryDistribution: Array<{ category: CategoryValue; count: number }>;
  trend: TrendPoint[];
  recentIncidents: IncidentResponse[];
}

function getScope(user: AuthUser): Prisma.IncidentWhereInput {
  return user.role === 'REPORTER' ? { reporterId: user.id } : {};
}

export const dashboardService = {
  getSummary: async (user: AuthUser): Promise<DashboardResponse> => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const atRiskLimit = addHours(now, SLA_AT_RISK_HOURS);

    const trendStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    trendStart.setUTCDate(trendStart.getUTCDate() - 13);

    const scope = getScope(user);
    const activeStatuses = [...ACTIVE_STATUSES];
    const resolvedStatuses = [...RESOLVED_STATUSES];

    const activeWhere: Prisma.IncidentWhereInput = {
      ...scope,
      status: { in: activeStatuses },
    };

    const [
      totalIncidents,
      openIncidents,
      unassignedIncidents,
      inProgressIncidents,
      slaAtRisk,
      slaBreached,
      resolvedLast7Days,
      statusGroups,
      priorityGroups,
      categoryGroups,
      trendSamples,
      resolutionSamples,
      recentIncidents,
    ] = await Promise.all([
      prisma.incident.count({ where: scope }),
      prisma.incident.count({ where: activeWhere }),
      prisma.incident.count({
        where: { ...activeWhere, assigneeId: null },
      }),
      prisma.incident.count({
        where: { ...activeWhere, status: 'IN_PROGRESS' },
      }),
      prisma.incident.count({
        where: {
          ...activeWhere,
          slaDueAt: { gte: now, lte: atRiskLimit },
        },
      }),
      prisma.incident.count({
        where: {
          ...activeWhere,
          slaDueAt: { lt: now },
        },
      }),
      prisma.incident.count({
        where: {
          ...scope,
          status: { in: resolvedStatuses },
          resolvedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.incident.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      }),
      prisma.incident.groupBy({
        by: ['priority'],
        where: activeWhere,
        _count: { _all: true },
      }),
      prisma.incident.groupBy({
        by: ['category'],
        where: activeWhere,
        _count: { _all: true },
      }),
      prisma.incident.findMany({
        where: {
          ...scope,
          OR: [
            { createdAt: { gte: trendStart } },
            { resolvedAt: { gte: trendStart } },
          ],
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      }),
      prisma.incident.findMany({
        where: {
          ...scope,
          status: { in: resolvedStatuses },
          resolvedAt: { gte: thirtyDaysAgo },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
          slaDueAt: true,
        },
      }),
      prisma.incident.findMany({
        where: scope,
        include: incidentPeopleInclude,
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const resolutionMetrics = computeResolutionMetrics(resolutionSamples);

    const statusCounts = new Map(
      statusGroups.map((group) => [group.status, group._count._all]),
    );
    const priorityCounts = new Map(
      priorityGroups.map((group) => [group.priority, group._count._all]),
    );
    const categoryCounts = new Map(
      categoryGroups.map((group) => [group.category, group._count._all]),
    );

    return {
      generatedAt: now,
      scope: user.role === 'REPORTER' ? 'OWN' : 'GLOBAL',
      kpis: {
        totalIncidents,
        openIncidents,
        unassignedIncidents,
        inProgressIncidents,
        slaAtRisk,
        slaBreached,
        resolvedLast7Days,
        averageResolutionHours: resolutionMetrics.averageResolutionHours,
        slaComplianceRate: resolutionMetrics.slaComplianceRate,
      },
      statusDistribution: INCIDENT_STATUSES.map((status) => ({
        status,
        count: statusCounts.get(status) ?? 0,
      })),
      priorityDistribution: PRIORITIES.map((priority) => ({
        priority,
        count: priorityCounts.get(priority) ?? 0,
      })),
      categoryDistribution: CATEGORIES.map((category) => ({
        category,
        count: categoryCounts.get(category) ?? 0,
      })),
      trend: buildDailyTrend(trendSamples, now, 14),
      recentIncidents: recentIncidents.map(serializeIncident),
    };
  },
};
