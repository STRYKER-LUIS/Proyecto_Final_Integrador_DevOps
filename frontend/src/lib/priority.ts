import type { Impact, Priority, Urgency } from '../types';

/**
 * Matriz de priorización impacto/urgencia.
 * Debe mantenerse alineada con la matriz del backend.
 */
const PRIORITY_MATRIX: Record<Impact, Record<Urgency, Priority>> = {
  CRITICAL: {
    LOW: 'HIGH',
    MEDIUM: 'CRITICAL',
    HIGH: 'CRITICAL',
  },
  HIGH: {
    LOW: 'MEDIUM',
    MEDIUM: 'HIGH',
    HIGH: 'HIGH',
  },
  MEDIUM: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },
  LOW: {
    LOW: 'LOW',
    MEDIUM: 'LOW',
    HIGH: 'MEDIUM',
  },
};

export const SLA_RESOLUTION_HOURS: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

export const SLA_AT_RISK_HOURS = 4;

export function calculatePriority(impact: Impact, urgency: Urgency): Priority {
  return PRIORITY_MATRIX[impact][urgency];
}

export function getSlaResolutionHours(priority: Priority): number {
  return SLA_RESOLUTION_HOURS[priority];
}
