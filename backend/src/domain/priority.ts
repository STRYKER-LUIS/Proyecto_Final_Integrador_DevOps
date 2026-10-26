import type { ImpactValue, PriorityValue, UrgencyValue } from './types';

/**
 * Matriz de priorización impacto/urgencia.
 * Es la única fuente de verdad para la prioridad de un incidente.
 */
const PRIORITY_MATRIX: Record<ImpactValue, Record<UrgencyValue, PriorityValue>> = {
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

export function calculatePriority(impact: ImpactValue, urgency: UrgencyValue): PriorityValue {
  return PRIORITY_MATRIX[impact][urgency];
}
