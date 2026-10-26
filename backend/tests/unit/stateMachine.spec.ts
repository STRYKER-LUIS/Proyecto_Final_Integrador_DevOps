import { describe, expect, it } from 'vitest';
import { DomainError } from '../../src/domain/errors';
import {
  assertTransition,
  canTransition,
  getAllowedTransitions,
  getStatusLabel,
  isActiveStatus,
  statusRequiresAssignee,
} from '../../src/domain/stateMachine';
import type { IncidentStatusValue } from '../../src/domain/types';

const statuses: IncidentStatusValue[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
];

const validTransitions: Array<[IncidentStatusValue, IncidentStatusValue]> = [
  ['NEW', 'ASSIGNED'],
  ['NEW', 'IN_PROGRESS'],
  ['NEW', 'CANCELLED'],
  ['ASSIGNED', 'IN_PROGRESS'],
  ['ASSIGNED', 'ON_HOLD'],
  ['ASSIGNED', 'CANCELLED'],
  ['IN_PROGRESS', 'ON_HOLD'],
  ['IN_PROGRESS', 'RESOLVED'],
  ['IN_PROGRESS', 'CANCELLED'],
  ['ON_HOLD', 'IN_PROGRESS'],
  ['ON_HOLD', 'RESOLVED'],
  ['ON_HOLD', 'CANCELLED'],
  ['RESOLVED', 'CLOSED'],
  ['RESOLVED', 'IN_PROGRESS'],
  ['CLOSED', 'IN_PROGRESS'],
];

describe('máquina de estados de incidentes', () => {
  it.each(validTransitions)('permite %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it('rechaza todas las transiciones no declaradas', () => {
    for (const from of statuses) {
      for (const to of statuses) {
        const isAllowed = validTransitions.some(([a, b]) => a === from && b === to);
        expect(canTransition(from, to)).toBe(isAllowed);
      }
    }
  });

  it('rechaza la transición al mismo estado con un error de dominio', () => {
    expect(() => assertTransition('IN_PROGRESS', 'IN_PROGRESS')).toThrowError(DomainError);

    try {
      assertTransition('IN_PROGRESS', 'IN_PROGRESS');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('INVALID_STATUS_TRANSITION');
    }
  });

  it('expone las transiciones permitidas y protege estados terminales', () => {
    expect(getAllowedTransitions('NEW')).toEqual(['ASSIGNED', 'IN_PROGRESS', 'CANCELLED']);
    expect(getAllowedTransitions('CANCELLED')).toEqual([]);
    expect(getAllowedTransitions('RESOLVED')).toEqual(['CLOSED', 'IN_PROGRESS']);
  });

  it('identifica estados activos y estados que requieren responsable', () => {
    expect(isActiveStatus('NEW')).toBe(true);
    expect(isActiveStatus('ON_HOLD')).toBe(true);
    expect(isActiveStatus('RESOLVED')).toBe(false);
    expect(isActiveStatus('CLOSED')).toBe(false);
    expect(isActiveStatus('CANCELLED')).toBe(false);

    expect(statusRequiresAssignee('NEW')).toBe(false);
    expect(statusRequiresAssignee('IN_PROGRESS')).toBe(true);
    expect(statusRequiresAssignee('CANCELLED')).toBe(false);
  });

  it('traduce los estados al español', () => {
    expect(getStatusLabel('NEW')).toBe('Nuevo');
    expect(getStatusLabel('IN_PROGRESS')).toBe('En progreso');
    expect(getStatusLabel('CANCELLED')).toBe('Cancelado');
  });
});
