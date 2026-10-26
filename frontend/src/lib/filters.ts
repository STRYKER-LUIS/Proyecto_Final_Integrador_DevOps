import {
  CATEGORIES,
  INCIDENT_STATUSES,
  PRIORITIES,
  SORT_OPTIONS,
} from '../types';
import type {
  Category,
  IncidentFilters,
  IncidentListParams,
  IncidentStatus,
  Priority,
  SortOption,
} from '../types';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const DEFAULT_INCIDENT_FILTERS: IncidentFilters = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  search: '',
  unassigned: false,
  mine: false,
  sort: 'newest',
};

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  if (!value) return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function parsePositiveInteger(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) return fallback;

  return parsed;
}

export function parseIncidentFilters(params: URLSearchParams): IncidentFilters {
  const search = (params.get('search') ?? '').trim().slice(0, 120);
  const assigneeId = params.get('assigneeId')?.trim() || undefined;
  const unassigned = params.get('unassigned') === 'true';
  const mine = !unassigned && params.get('mine') === 'true';

  return {
    page: parsePositiveInteger(params.get('page'), 1, 100_000),
    pageSize: parsePositiveInteger(params.get('pageSize'), DEFAULT_PAGE_SIZE, 100),
    search,
    status: parseEnum<IncidentStatus>(params.get('status'), INCIDENT_STATUSES),
    priority: parseEnum<Priority>(params.get('priority'), PRIORITIES),
    category: parseEnum<Category>(params.get('category'), CATEGORIES),
    assigneeId: unassigned || mine ? undefined : assigneeId,
    unassigned,
    mine,
    sort: parseEnum<SortOption>(params.get('sort'), SORT_OPTIONS) ?? 'newest',
  };
}

export function toIncidentSearchParams(filters: IncidentFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(filters.pageSize));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.category) params.set('category', filters.category);
  if (filters.assigneeId && !filters.unassigned && !filters.mine) {
    params.set('assigneeId', filters.assigneeId);
  }
  if (filters.unassigned) params.set('unassigned', 'true');
  if (filters.mine && !filters.unassigned) params.set('mine', 'true');
  if (filters.sort !== 'newest') params.set('sort', filters.sort);

  return params;
}

export function toIncidentListParams(filters: IncidentFilters): IncidentListParams {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.assigneeId && !filters.unassigned && !filters.mine
      ? { assigneeId: filters.assigneeId }
      : {}),
    ...(filters.unassigned ? { unassigned: true } : {}),
    ...(filters.mine && !filters.unassigned ? { mine: true } : {}),
    sort: filters.sort,
  };
}

export function countActiveIncidentFilters(filters: IncidentFilters): number {
  let count = 0;

  if (filters.search) count += 1;
  if (filters.status) count += 1;
  if (filters.priority) count += 1;
  if (filters.category) count += 1;
  if (filters.assigneeId && !filters.unassigned && !filters.mine) count += 1;
  if (filters.unassigned) count += 1;
  if (filters.mine) count += 1;
  if (filters.sort !== 'newest') count += 1;

  return count;
}

export function hasActiveIncidentFilters(filters: IncidentFilters): boolean {
  return countActiveIncidentFilters(filters) > 0;
}
