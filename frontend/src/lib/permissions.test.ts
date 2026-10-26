import { describe, expect, it } from 'vitest';
import {
  canAssignIncidents,
  canChangeStatus,
  canCreateInternalNotes,
  canEditImpactAndUrgency,
  canEditIncident,
  canManageIncidents,
  isStaff,
} from './permissions';
import { INCIDENT_STATUSES } from '../types';
import type { Role } from '../types';

const STAFF_ROLES: Role[] = ['ADMIN', 'AGENT'];

describe('isStaff y permisos de gestión', () => {
  it.each(STAFF_ROLES)('considera a %s parte del equipo de soporte', (role) => {
    expect(isStaff(role)).toBe(true);
    expect(canManageIncidents(role)).toBe(true);
    expect(canAssignIncidents(role)).toBe(true);
    expect(canChangeStatus(role)).toBe(true);
    expect(canCreateInternalNotes(role)).toBe(true);
    expect(canEditImpactAndUrgency(role)).toBe(true);
  });

  it('no otorga permisos de gestión al reportante', () => {
    expect(isStaff('REPORTER')).toBe(false);
    expect(canManageIncidents('REPORTER')).toBe(false);
    expect(canAssignIncidents('REPORTER')).toBe(false);
    expect(canChangeStatus('REPORTER')).toBe(false);
    expect(canCreateInternalNotes('REPORTER')).toBe(false);
    expect(canEditImpactAndUrgency('REPORTER')).toBe(false);
  });
});

describe('canEditIncident', () => {
  it('permite al staff editar incidentes en cualquier estado', () => {
    for (const role of STAFF_ROLES) {
      for (const status of INCIDENT_STATUSES) {
        expect(canEditIncident(role, status)).toBe(true);
      }
    }
  });

  it('permite al reportante editar únicamente incidentes nuevos', () => {
    expect(canEditIncident('REPORTER', 'NEW')).toBe(true);

    for (const status of INCIDENT_STATUSES.filter((item) => item !== 'NEW')) {
      expect(canEditIncident('REPORTER', status)).toBe(false);
    }
  });
});
