import { DomainError } from './errors';
import type { IncidentStatusValue } from './types';

const TRANSITIONS: Record<IncidentStatusValue, readonly IncidentStatusValue[]> = {
  NEW: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'RESOLVED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['IN_PROGRESS'],
  CANCELLED: [],
};

const STATUS_LABELS: Record<IncidentStatusValue, string> = {
  NEW: 'Nuevo',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En progreso',
  ON_HOLD: 'En espera',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

export function getAllowedTransitions(
  current: IncidentStatusValue,
): readonly IncidentStatusValue[] {
  return TRANSITIONS[current];
}

export function canTransition(
  current: IncidentStatusValue,
  next: IncidentStatusValue,
): boolean {
  return TRANSITIONS[current].includes(next);
}

export function assertTransition(
  current: IncidentStatusValue,
  next: IncidentStatusValue,
): void {
  if (current === next) {
    throw new DomainError(
      'INVALID_STATUS_TRANSITION',
      `El incidente ya se encuentra en estado ${STATUS_LABELS[next]}`,
    );
  }

  if (!canTransition(current, next)) {
    throw new DomainError(
      'INVALID_STATUS_TRANSITION',
      `No se puede pasar de ${STATUS_LABELS[current]} a ${STATUS_LABELS[next]}`,
    );
  }
}

export function getStatusLabel(status: IncidentStatusValue): string {
  return STATUS_LABELS[status];
}

export function isActiveStatus(status: IncidentStatusValue): boolean {
  return status !== 'RESOLVED' && status !== 'CLOSED' && status !== 'CANCELLED';
}

export function statusRequiresAssignee(status: IncidentStatusValue): boolean {
  return status !== 'NEW' && status !== 'CANCELLED';
}
