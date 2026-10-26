import { describe, expect, it } from 'vitest';
import {
  SLA_AT_RISK_HOURS,
  SLA_RESOLUTION_HOURS,
  addHours,
  calculateSlaDueAt,
  getSlaRemainingMs,
  getSlaState,
} from '../../src/domain/sla';
import type { PriorityValue } from '../../src/domain/types';

const now = new Date('2026-01-15T12:00:00.000Z');

describe('políticas SLA', () => {
  it.each<[PriorityValue, number]>([
    ['CRITICAL', 4],
    ['HIGH', 8],
    ['MEDIUM', 24],
    ['LOW', 72],
  ])('calcula el vencimiento para prioridad %s', (priority, hours) => {
    const dueAt = calculateSlaDueAt(now, priority);

    expect(SLA_RESOLUTION_HOURS[priority]).toBe(hours);
    expect(dueAt.toISOString()).toBe(addHours(now, hours).toISOString());
  });

  it('marca un SLA como en plazo cuando falta más de la ventana de riesgo', () => {
    const slaDueAt = addHours(now, SLA_AT_RISK_HOURS + 0.5);
    expect(getSlaState({ status: 'IN_PROGRESS', slaDueAt, resolvedAt: null }, now)).toBe(
      'ON_TRACK',
    );
  });

  it('marca un SLA en riesgo justo en el límite de la ventana', () => {
    const slaDueAt = addHours(now, SLA_AT_RISK_HOURS);
    expect(getSlaState({ status: 'ASSIGNED', slaDueAt, resolvedAt: null }, now)).toBe(
      'AT_RISK',
    );
  });

  it('marca un SLA incumplido cuando ya venció', () => {
    const slaDueAt = new Date(now.getTime() - 1);
    expect(getSlaState({ status: 'ON_HOLD', slaDueAt, resolvedAt: null }, now)).toBe(
      'BREACHED',
    );
  });

  it('marca cumplido o perdido según el momento de resolución', () => {
    const slaDueAt = addHours(now, 4);

    expect(
      getSlaState({ status: 'RESOLVED', slaDueAt, resolvedAt: addHours(now, 3) }, now),
    ).toBe('MET');
    expect(
      getSlaState({ status: 'CLOSED', slaDueAt, resolvedAt: addHours(now, 5) }, now),
    ).toBe('MISSED');
  });

  it('no evalúa SLA para incidentes cancelados o resueltos sin fecha', () => {
    const slaDueAt = addHours(now, 4);

    expect(getSlaState({ status: 'CANCELLED', slaDueAt, resolvedAt: null }, now)).toBe(
      'CANCELLED',
    );
    expect(getSlaState({ status: 'RESOLVED', slaDueAt, resolvedAt: null }, now)).toBe(
      'BREACHED',
    );
  });

  it('calcula el tiempo restante', () => {
    const dueAt = addHours(now, 2);
    expect(getSlaRemainingMs(dueAt, now)).toBe(2 * 60 * 60 * 1000);
  });
});
