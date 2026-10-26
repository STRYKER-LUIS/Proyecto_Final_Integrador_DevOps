export const ROLES = ['ADMIN', 'AGENT', 'REPORTER'] as const;
export type Role = (typeof ROLES)[number];

export const INCIDENT_STATUSES = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const IMPACTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Impact = (typeof IMPACTS)[number];

export const URGENCIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type Urgency = (typeof URGENCIES)[number];

export const CATEGORIES = [
  'HARDWARE',
  'SOFTWARE',
  'NETWORK',
  'ACCESS',
  'EMAIL',
  'OTHER',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const ACTIVITY_ACTIONS = [
  'CREATED',
  'UPDATED',
  'ASSIGNED',
  'STATUS_CHANGED',
  'COMMENTED',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const SLA_STATES = [
  'ON_TRACK',
  'AT_RISK',
  'BREACHED',
  'MET',
  'MISSED',
  'CANCELLED',
] as const;
export type SlaState = (typeof SLA_STATES)[number];

export const SORT_OPTIONS = ['newest', 'oldest', 'priority'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
