import { describe, expect, it } from 'vitest';
import {
  formatSlaCountdown,
  getSlaCountdown,
  getSlaElapsedPercent,
  getSlaRemainingMs,
  getSlaState,
} from './sla';
import type { IncidentStatus } from '../types';

const NOW = new Date('2026-10-24T12:00:00');
const HOUR = 3_600_000;

function dueIn(ms: number): string {
  return new Date(NOW.getTime() + ms).toISOString();
}

function slaInput(status: IncidentStatus, dueOffsetMs: number, resolvedOffsetMs?: number | null) {
  return {
    status,
    slaDueAt: dueIn(dueOffsetMs),
    resolvedAt:
      resolvedOffsetMs === undefined || resolvedOffsetMs === null
        ? null
        : dueIn(resolvedOffsetMs),
  };
}

describe('getSlaState', () => {
  it('marca el SLA como cancelado cuando el incidente fue cancelado', () => {
    expect(getSlaState(slaInput('CANCELLED', -HOUR), NOW)).toBe('CANCELLED');
  });

  it('marca dentro del SLA cuando queda más de cuatro horas', () => {
    expect(getSlaState(slaInput('IN_PROGRESS', 5 * HOUR), NOW)).toBe('ON_TRACK');
  });

  it('marca en riesgo cuando quedan cuatro horas o menos', () => {
    expect(getSlaState(slaInput('ASSIGNED', 4 * HOUR), NOW)).toBe('AT_RISK');
    expect(getSlaState(slaInput('ON_HOLD', 1 * HOUR), NOW)).toBe('AT_RISK');
  });

  it('marca vencido cuando la fecha límite ya pasó', () => {
    expect(getSlaState(slaInput('NEW', -1), NOW)).toBe('BREACHED');
  });

  it('marca cumplido cuando se resolvió antes del vencimiento', () => {
    expect(getSlaState(slaInput('RESOLVED', HOUR, -HOUR), NOW)).toBe('MET');
    expect(getSlaState(slaInput('CLOSED', HOUR, 0), NOW)).toBe('MET');
  });

  it('marca incumplido cuando se resolvió después del vencimiento', () => {
    expect(getSlaState(slaInput('RESOLVED', 0, HOUR), NOW)).toBe('MISSED');
  });

  it('marca vencido si el incidente está resuelto pero no tiene fecha de resolución', () => {
    expect(getSlaState(slaInput('RESOLVED', HOUR), NOW)).toBe('BREACHED');
  });
});

describe('getSlaRemainingMs y getSlaCountdown', () => {
  it('calcula el tiempo restante en milisegundos', () => {
    expect(getSlaRemainingMs(dueIn(HOUR), NOW)).toBe(HOUR);
    expect(getSlaRemainingMs(dueIn(-HOUR), NOW)).toBe(-HOUR);
  });

  it('descompone el tiempo restante en días, horas y minutos', () => {
    const due = dueIn(2 * 24 * HOUR + 3 * HOUR + 15 * 60_000);

    expect(getSlaCountdown(due, NOW)).toEqual({
      totalMs: 2 * 24 * HOUR + 3 * HOUR + 15 * 60_000,
      days: 2,
      hours: 3,
      minutes: 15,
      overdue: false,
    });
  });

  it('marca el vencimiento y usa valores absolutos cuando ya pasó', () => {
    const countdown = getSlaCountdown(dueIn(-(HOUR + 5 * 60_000)), NOW);

    expect(countdown.overdue).toBe(true);
    expect(countdown.days).toBe(0);
    expect(countdown.hours).toBe(1);
    expect(countdown.minutes).toBe(5);
  });
});

describe('formatSlaCountdown', () => {
  it('describe el tiempo restante en español', () => {
    expect(formatSlaCountdown(dueIn(2 * 24 * HOUR + 3 * HOUR), NOW)).toBe('Vence en 2 d 3 h');
    expect(formatSlaCountdown(dueIn(3 * HOUR + 15 * 60_000), NOW)).toBe('Vence en 3 h 15 min');
    expect(formatSlaCountdown(dueIn(15 * 60_000), NOW)).toBe('Vence en 15 min');
  });

  it('indica el vencimiento cuando la fecha ya pasó', () => {
    expect(formatSlaCountdown(dueIn(-(2 * HOUR + 10 * 60_000)), NOW)).toBe(
      'Vencido hace 2 h 10 min',
    );
  });

  it('indica menos de un minuto cuando corresponde', () => {
    expect(formatSlaCountdown(dueIn(30_000), NOW)).toBe('Vence en menos de 1 min');
  });
});

describe('getSlaElapsedPercent', () => {
  it('calcula el porcentaje transcurrido entre creación y vencimiento', () => {
    const createdAt = new Date(NOW.getTime() - 2 * HOUR);
    const dueAt = new Date(NOW.getTime() + 2 * HOUR);

    expect(getSlaElapsedPercent(createdAt, dueAt, NOW)).toBe(50);
  });

  it('acota el resultado entre 0 y 100', () => {
    const createdAt = new Date(NOW.getTime() - HOUR);

    expect(getSlaElapsedPercent(createdAt, new Date(NOW.getTime() + HOUR), new Date(NOW.getTime() - 10 * HOUR))).toBe(0);
    expect(getSlaElapsedPercent(createdAt, new Date(NOW.getTime() + HOUR), new Date(NOW.getTime() + 10 * HOUR))).toBe(100);
  });

  it('devuelve 100 cuando el rango es inválido', () => {
    expect(getSlaElapsedPercent(NOW, NOW, NOW)).toBe(100);
    expect(getSlaElapsedPercent(new Date(NOW.getTime() + HOUR), NOW, NOW)).toBe(100);
  });
});
