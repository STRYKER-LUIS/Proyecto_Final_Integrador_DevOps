import type { Category, IncidentStatus, Priority } from './domain';
import type { Incident } from './incident';

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface DashboardKpis {
  totalIncidents: number;
  openIncidents: number;
  unassignedIncidents: number;
  inProgressIncidents: number;
  slaAtRisk: number;
  slaBreached: number;
  resolvedLast7Days: number;
  averageResolutionHours: number | null;
  slaComplianceRate: number | null;
}

export interface DashboardSummary {
  generatedAt: string;
  scope: 'GLOBAL' | 'OWN';
  kpis: DashboardKpis;
  statusDistribution: Array<{ status: IncidentStatus; count: number }>;
  priorityDistribution: Array<{ priority: Priority; count: number }>;
  categoryDistribution: Array<{ category: Category; count: number }>;
  trend: TrendPoint[];
  recentIncidents: Incident[];
}
