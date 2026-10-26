import type { IncidentStatus, Role } from '../types';

export function isStaff(role: Role): boolean {
  return role === 'ADMIN' || role === 'AGENT';
}

export function canManageIncidents(role: Role): boolean {
  return isStaff(role);
}

export function canAssignIncidents(role: Role): boolean {
  return isStaff(role);
}

export function canChangeStatus(role: Role): boolean {
  return isStaff(role);
}

export function canCreateInternalNotes(role: Role): boolean {
  return isStaff(role);
}

export function canEditIncident(role: Role, status: IncidentStatus): boolean {
  if (isStaff(role)) return true;
  return role === 'REPORTER' && status === 'NEW';
}

export function canEditImpactAndUrgency(role: Role): boolean {
  return isStaff(role);
}
