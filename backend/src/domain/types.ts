export const ROLES = ['ADMIN', 'AGENT', 'REPORTER'] as const;
export type AppRole = (typeof ROLES)[number];

export const INCIDENT_STATUSES = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
] as const;
export type IncidentStatusValue = (typeof INCIDENT_STATUSES)[number];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type PriorityValue = (typeof PRIORITIES)[number];

export const IMPACTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type ImpactValue = (typeof IMPACTS)[number];

export const URGENCIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type UrgencyValue = (typeof URGENCIES)[number];

export const CATEGORIES = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'EMAIL', 'OTHER'] as const;
export type CategoryValue = (typeof CATEGORIES)[number];

export const ACTIVITY_ACTIONS = [
  'CREATED',
  'UPDATED',
  'ASSIGNED',
  'STATUS_CHANGED',
  'COMMENTED',
] as const;
export type ActivityActionValue = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVE_STATUSES: readonly IncidentStatusValue[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
];

export const RESOLVED_STATUSES: readonly IncidentStatusValue[] = ['RESOLVED', 'CLOSED'];

export const priorityWeight: Record<PriorityValue, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};
