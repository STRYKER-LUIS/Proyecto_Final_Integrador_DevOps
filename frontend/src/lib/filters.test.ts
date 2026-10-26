import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INCIDENT_FILTERS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  countActiveIncidentFilters,
  hasActiveIncidentFilters,
  parseIncidentFilters,
  toIncidentListParams,
  toIncidentSearchParams,
} from './filters';
import type { IncidentFilters } from '../types';

function filters(overrides: Partial<IncidentFilters> = {}): IncidentFilters {
  return { ...DEFAULT_INCIDENT_FILTERS, ...overrides };
}

describe('parseIncidentFilters', () => {
  it('usa los valores por defecto cuando no hay parámetros', () => {
    expect(parseIncidentFilters(new URLSearchParams())).toEqual(DEFAULT_INCIDENT_FILTERS);
  });

  it('parsea todos los filtros válidos', () => {
    const params = new URLSearchParams({
      page: '3',
      pageSize: '20',
      search: '  vpn  ',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'NETWORK',
      assigneeId: 'user-1',
      sort: 'priority',
    });

    expect(parseIncidentFilters(params)).toEqual({
      page: 3,
      pageSize: 20,
      search: 'vpn',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'NETWORK',
      assigneeId: 'user-1',
      unassigned: false,
      mine: false,
      sort: 'priority',
    });
  });

  it('descarta valores inválidos y acota page y pageSize', () => {
    const params = new URLSearchParams({
      page: '0',
      pageSize: '1000',
      status: 'UNKNOWN',
      priority: 'URGENT',
      category: 'FOO',
      sort: 'random',
    });

    expect(parseIncidentFilters(params)).toEqual(DEFAULT_INCIDENT_FILTERS);

    expect(
      parseIncidentFilters(new URLSearchParams({ page: '999999', pageSize: '0' })),
    ).toMatchObject({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('prioriza unassigned y limpia mine y assigneeId', () => {
    const params = new URLSearchParams({
      unassigned: 'true',
      mine: 'true',
      assigneeId: 'user-1',
    });

    expect(parseIncidentFilters(params)).toMatchObject({
      unassigned: true,
      mine: false,
      assigneeId: undefined,
    });
  });

  it('limita la búsqueda a 120 caracteres', () => {
    const search = 'a'.repeat(200);
    expect(parseIncidentFilters(new URLSearchParams({ search })).search).toHaveLength(120);
  });
});

describe('toIncidentSearchParams', () => {
  it('omite los valores por defecto para mantener la URL limpia', () => {
    expect(toIncidentSearchParams(filters()).toString()).toBe('');
  });

  it('serializa los filtros activos', () => {
    const params = toIncidentSearchParams(
      filters({
        page: 2,
        pageSize: 50,
        search: 'correo',
        status: 'NEW',
        priority: 'CRITICAL',
        category: 'EMAIL',
        assigneeId: 'agent-1',
        sort: 'oldest',
      }),
    );

    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('50');
    expect(params.get('search')).toBe('correo');
    expect(params.get('status')).toBe('NEW');
    expect(params.get('priority')).toBe('CRITICAL');
    expect(params.get('category')).toBe('EMAIL');
    expect(params.get('assigneeId')).toBe('agent-1');
    expect(params.get('sort')).toBe('oldest');
    expect(params.get('unassigned')).toBeNull();
    expect(params.get('mine')).toBeNull();
  });

  it('no serializa assigneeId cuando el filtro es unassigned o mine', () => {
    expect(
      toIncidentSearchParams(filters({ unassigned: true, assigneeId: 'agent-1' })).get(
        'assigneeId',
      ),
    ).toBeNull();
    expect(
      toIncidentSearchParams(filters({ mine: true, assigneeId: 'agent-1' })).get('assigneeId'),
    ).toBeNull();
  });
});

describe('toIncidentListParams', () => {
  it('incluye solo los filtros opcionales activos', () => {
    expect(toIncidentListParams(filters())).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: 'newest',
    });

    expect(
      toIncidentListParams(
        filters({
          search: 'vpn',
          status: 'ASSIGNED',
          priority: 'HIGH',
          category: 'NETWORK',
          unassigned: true,
          assigneeId: 'ignored',
        }),
      ),
    ).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      search: 'vpn',
      status: 'ASSIGNED',
      priority: 'HIGH',
      category: 'NETWORK',
      unassigned: true,
      sort: 'newest',
    });
  });
});

describe('countActiveIncidentFilters y hasActiveIncidentFilters', () => {
  it('no cuenta los valores por defecto', () => {
    expect(countActiveIncidentFilters(filters())).toBe(0);
    expect(hasActiveIncidentFilters(filters())).toBe(false);
  });

  it('cuenta cada filtro activo', () => {
    const active = filters({
      search: 'vpn',
      status: 'NEW',
      priority: 'HIGH',
      category: 'NETWORK',
      mine: true,
      sort: 'priority',
    });

    expect(countActiveIncidentFilters(active)).toBe(6);
    expect(hasActiveIncidentFilters(active)).toBe(true);
  });

  it('cuenta unassigned pero no assigneeId simultáneamente', () => {
    expect(
      countActiveIncidentFilters(filters({ unassigned: true, assigneeId: 'agent-1' })),
    ).toBe(1);
  });
});

describe('PAGE_SIZE_OPTIONS', () => {
  it('ofrece tamaños de página razonables', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([10, 20, 50]);
    expect(PAGE_SIZE_OPTIONS).toContain(DEFAULT_PAGE_SIZE);
  });
});
