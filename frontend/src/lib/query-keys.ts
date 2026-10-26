import type { IncidentFilters } from '../types';
import { toIncidentListParams } from '../lib/filters';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  incidents: ['incidents'] as const,
  incidentList: (filters: IncidentFilters) =>
    ['incidents', 'list', toIncidentListParams(filters)] as const,
  incident: (id: number) => ['incidents', 'detail', id] as const,
  agents: ['users', 'staff'] as const,
};
