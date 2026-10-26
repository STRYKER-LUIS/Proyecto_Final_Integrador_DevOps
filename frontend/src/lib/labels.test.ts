import { describe, expect, it } from 'vitest';
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  IMPACT_LABELS,
  IMPACT_OPTIONS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  SLA_LABELS,
  SORT_LABELS,
  SORT_OPTIONS_LIST,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  TRANSITION_LABELS,
  URGENCY_LABELS,
  URGENCY_OPTIONS,
  getPriorityLabel,
  getStatusLabel,
  getTransitionLabel,
} from './labels';
import {
  CATEGORIES,
  IMPACTS,
  INCIDENT_STATUSES,
  PRIORITIES,
  ROLES,
  SLA_STATES,
  SORT_OPTIONS,
  URGENCIES,
} from '../types';

describe('etiquetas de dominio', () => {
  it('cubre todos los roles, estados, prioridades, impactos y urgencias', () => {
    for (const role of ROLES) expect(ROLE_LABELS[role]).toBeTruthy();
    for (const status of INCIDENT_STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
      expect(STATUS_DESCRIPTIONS[status]).toBeTruthy();
      expect(TRANSITION_LABELS[status]).toBeTruthy();
    }
    for (const priority of PRIORITIES) expect(PRIORITY_LABELS[priority]).toBeTruthy();
    for (const impact of IMPACTS) expect(IMPACT_LABELS[impact]).toBeTruthy();
    for (const urgency of URGENCIES) expect(URGENCY_LABELS[urgency]).toBeTruthy();
    for (const category of CATEGORIES) expect(CATEGORY_LABELS[category]).toBeTruthy();
    for (const state of SLA_STATES) expect(SLA_LABELS[state]).toBeTruthy();
    for (const sort of SORT_OPTIONS) expect(SORT_LABELS[sort]).toBeTruthy();
  });

  it('genera opciones de selector a partir de las etiquetas', () => {
    expect(ROLE_OPTIONS).toHaveLength(ROLES.length);
    expect(STATUS_OPTIONS).toHaveLength(INCIDENT_STATUSES.length);
    expect(PRIORITY_OPTIONS).toHaveLength(PRIORITIES.length);
    expect(IMPACT_OPTIONS).toHaveLength(IMPACTS.length);
    expect(URGENCY_OPTIONS).toHaveLength(URGENCIES.length);
    expect(CATEGORY_OPTIONS).toHaveLength(CATEGORIES.length);
    expect(SORT_OPTIONS_LIST).toHaveLength(SORT_OPTIONS.length);

    expect(PRIORITY_OPTIONS.find((option) => option.value === 'CRITICAL')).toEqual({
      value: 'CRITICAL',
      label: 'Crítica',
    });
  });

  it('expone funciones de consulta de etiquetas', () => {
    expect(getStatusLabel('IN_PROGRESS')).toBe('En progreso');
    expect(getPriorityLabel('HIGH')).toBe('Alta');
    expect(getTransitionLabel('RESOLVED')).toBe('Resolver incidente');
  });
});
