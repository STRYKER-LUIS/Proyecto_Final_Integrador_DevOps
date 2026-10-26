import type { IncidentStatusValue, PriorityValue } from './types';

export const SLA_RESOLUTION_HOURS: Record<PriorityValue, number> = {
  CRITICAL: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72,
};

export const SLA_AT_RISK_HOURS = 4;

export type SlaState = 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'MET' | 'MISSED' | 'CANCELLED';

interface SlaInput {
  status: IncidentStatusValue;
  slaDueAt: Date;
  resolvedAt: Date | null;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function calculateSlaDueAt(createdAt: Date, priority: PriorityValue): Date {
  return addHours(createdAt, SLA_RESOLUTION_HOURS[priority]);
}

export function getSlaState(input: SlaInput, now: Date = new Date()): SlaState {
  if (input.status === 'CANCELLED') return 'CANCELLED';

  if (input.status === 'RESOLVED' || input.status === 'CLOSED') {
    if (!input.resolvedAt) return 'BREACHED';
    return input.resolvedAt.getTime() <= input.slaDueAt.getTime() ? 'MET' : 'MISSED';
  }

  const remainingMs = input.slaDueAt.getTime() - now.getTime();
  if (remainingMs < 0) return 'BREACHED';
  if (remainingMs <= SLA_AT_RISK_HOURS * 60 * 60 * 1000) return 'AT_RISK';
  return 'ON_TRACK';
}

export function getSlaRemainingMs(slaDueAt: Date, now: Date = new Date()): number {
  return slaDueAt.getTime() - now.getTime();
}
