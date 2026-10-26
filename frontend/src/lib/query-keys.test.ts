import { describe, expect, it } from 'vitest';
import { queryKeys } from './query-keys';
import { DEFAULT_INCIDENT_FILTERS } from './filters';

describe('queryKeys', () => {
  it('expone claves estables para las consultas principales', () => {
    expect(queryKeys.dashboard).toEqual(['dashboard']);
    expect(queryKeys.incidents).toEqual(['incidents']);
    expect(queryKeys.incident(42)).toEqual(['incidents', 'detail', 42]);
    expect(queryKeys.agents).toEqual(['users', 'staff']);
  });

  it('genera una clave de lista a partir de los filtros normalizados', () => {
    expect(queryKeys.incidentList(DEFAULT_INCIDENT_FILTERS)).toEqual([
      'incidents',
      'list',
      { page: 1, pageSize: 10, sort: 'newest' },
    ]);
  });

  it('distingue listas con filtros diferentes', () => {
    const first = queryKeys.incidentList(DEFAULT_INCIDENT_FILTERS);
    const second = queryKeys.incidentList({
      ...DEFAULT_INCIDENT_FILTERS,
      status: 'NEW',
    });

    expect(first).not.toEqual(second);
  });
});
