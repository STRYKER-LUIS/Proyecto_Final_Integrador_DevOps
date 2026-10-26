import { describe, expect, it } from 'vitest';
import {
  SLA_AT_RISK_HOURS,
  SLA_RESOLUTION_HOURS,
  calculatePriority,
  getSlaResolutionHours,
} from './priority';
import type { Impact, Priority, Urgency } from '../types';

describe('calculatePriority', () => {
  const expected: Record<Impact, Record<Urgency, Priority>> = {
    CRITICAL: { LOW: 'HIGH', MEDIUM: 'CRITICAL', HIGH: 'CRITICAL' },
    HIGH: { LOW: 'MEDIUM', MEDIUM: 'HIGH', HIGH: 'HIGH' },
    MEDIUM: { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' },
    LOW: { LOW: 'LOW', MEDIUM: 'LOW', HIGH: 'MEDIUM' },
  };

  it.each([
    ['CRITICAL', 'LOW'],
    ['CRITICAL', 'MEDIUM'],
    ['CRITICAL', 'HIGH'],
    ['HIGH', 'LOW'],
    ['HIGH', 'MEDIUM'],
    ['HIGH', 'HIGH'],
    ['MEDIUM', 'LOW'],
    ['MEDIUM', 'MEDIUM'],
    ['MEDIUM', 'HIGH'],
    ['LOW', 'LOW'],
    ['LOW', 'MEDIUM'],
    ['LOW', 'HIGH'],
  ] as const)('calcula la prioridad para impacto %s y urgencia %s', (impact, urgency) => {
    expect(calculatePriority(impact, urgency)).toBe(expected[impact][urgency]);
  });

  it('nunca deja un cruce sin prioridad', () => {
    const impacts: Impact[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const urgencies: Urgency[] = ['LOW', 'MEDIUM', 'HIGH'];

    for (const impact of impacts) {
      for (const urgency of urgencies) {
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(
          calculatePriority(impact, urgency),
        );
      }
    }
  });
});

describe('SLA de resolución', () => {
  it('define los tiempos objetivo por prioridad', () => {
    expect(SLA_RESOLUTION_HOURS).toEqual({
      CRITICAL: 4,
      HIGH: 8,
      MEDIUM: 24,
      LOW: 72,
    });
    expect(getSlaResolutionHours('CRITICAL')).toBe(4);
    expect(getSlaResolutionHours('HIGH')).toBe(8);
    expect(getSlaResolutionHours('MEDIUM')).toBe(24);
    expect(getSlaResolutionHours('LOW')).toBe(72);
  });

  it('considera en riesgo las últimas cuatro horas', () => {
    expect(SLA_AT_RISK_HOURS).toBe(4);
  });
});
