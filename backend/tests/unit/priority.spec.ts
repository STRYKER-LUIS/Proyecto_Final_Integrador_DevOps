import { describe, expect, it } from 'vitest';
import { calculatePriority } from '../../src/domain/priority';
import type { ImpactValue, PriorityValue, UrgencyValue } from '../../src/domain/types';

describe('calculatePriority', () => {
  it.each<[ImpactValue, UrgencyValue, PriorityValue]>([
    ['CRITICAL', 'HIGH', 'CRITICAL'],
    ['CRITICAL', 'MEDIUM', 'CRITICAL'],
    ['CRITICAL', 'LOW', 'HIGH'],
    ['HIGH', 'HIGH', 'HIGH'],
    ['HIGH', 'MEDIUM', 'HIGH'],
    ['HIGH', 'LOW', 'MEDIUM'],
    ['MEDIUM', 'HIGH', 'HIGH'],
    ['MEDIUM', 'MEDIUM', 'MEDIUM'],
    ['MEDIUM', 'LOW', 'LOW'],
    ['LOW', 'HIGH', 'MEDIUM'],
    ['LOW', 'MEDIUM', 'LOW'],
    ['LOW', 'LOW', 'LOW'],
  ])('impacto %s + urgencia %s produce prioridad %s', (impact, urgency, expected) => {
    expect(calculatePriority(impact, urgency)).toBe(expected);
  });

  it('siempre devuelve una prioridad válida para toda la matriz', () => {
    const impacts: ImpactValue[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const urgencies: UrgencyValue[] = ['LOW', 'MEDIUM', 'HIGH'];
    const priorities: PriorityValue[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    for (const impact of impacts) {
      for (const urgency of urgencies) {
        expect(priorities).toContain(calculatePriority(impact, urgency));
      }
    }
  });
});
