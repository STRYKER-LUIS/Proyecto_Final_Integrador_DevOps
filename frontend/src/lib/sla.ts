import type { IncidentStatus, SlaState } from '../types';
import { SLA_AT_RISK_HOURS } from './priority';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export interface SlaInput {
  status: IncidentStatus;
  slaDueAt: string | Date;
  resolvedAt: string | Date | null;
}

export interface SlaCountdown {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  overdue: boolean;
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function getSlaState(input: SlaInput, now: Date = new Date()): SlaState {
  if (input.status === 'CANCELLED') return 'CANCELLED';

  const dueAt = toDate(input.slaDueAt).getTime();

  if (input.status === 'RESOLVED' || input.status === 'CLOSED') {
    if (!input.resolvedAt) return 'BREACHED';
    return toDate(input.resolvedAt).getTime() <= dueAt ? 'MET' : 'MISSED';
  }

  const remaining = dueAt - now.getTime();
  if (remaining < 0) return 'BREACHED';
  if (remaining <= SLA_AT_RISK_HOURS * HOUR_MS) return 'AT_RISK';
  return 'ON_TRACK';
}

export function getSlaRemainingMs(slaDueAt: string | Date, now: Date = new Date()): number {
  return toDate(slaDueAt).getTime() - now.getTime();
}

export function getSlaCountdown(slaDueAt: string | Date, now: Date = new Date()): SlaCountdown {
  const totalMs = getSlaRemainingMs(slaDueAt, now);
  const absolute = Math.abs(totalMs);

  return {
    totalMs,
    days: Math.floor(absolute / DAY_MS),
    hours: Math.floor((absolute % DAY_MS) / HOUR_MS),
    minutes: Math.floor((absolute % HOUR_MS) / MINUTE_MS),
    overdue: totalMs < 0,
  };
}

export function formatSlaCountdown(slaDueAt: string | Date, now: Date = new Date()): string {
  const countdown = getSlaCountdown(slaDueAt, now);

  if (countdown.overdue) {
    return `Vencido hace ${formatCountdownAmount(countdown)}`;
  }

  if (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0) {
    return 'Vence en menos de 1 min';
  }

  return `Vence en ${formatCountdownAmount(countdown)}`;
}

function formatCountdownAmount(countdown: SlaCountdown): string {
  if (countdown.days > 0) {
    return countdown.hours > 0 ? `${countdown.days} d ${countdown.hours} h` : `${countdown.days} d`;
  }

  if (countdown.hours > 0) {
    return countdown.minutes > 0
      ? `${countdown.hours} h ${countdown.minutes} min`
      : `${countdown.hours} h`;
  }

  return `${countdown.minutes} min`;
}

/**
 * Porcentaje de tiempo transcurrido entre la creación y el vencimiento del SLA.
 * Se usa para la barra de progreso del detalle del incidente.
 */
export function getSlaElapsedPercent(
  createdAt: string | Date,
  slaDueAt: string | Date,
  now: Date = new Date(),
): number {
  const start = toDate(createdAt).getTime();
  const end = toDate(slaDueAt).getTime();
  const total = end - start;

  if (total <= 0) return 100;

  const elapsed = now.getTime() - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}
