import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  parseIncidentFilters,
  toIncidentSearchParams,
} from '../lib/filters';
import type { IncidentFilters } from '../types';

export interface IncidentFiltersController {
  filters: IncidentFilters;
  updateFilters: (patch: Partial<IncidentFilters>) => void;
  clearFilters: () => void;
}

export function useIncidentFilters(): IncidentFiltersController {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseIncidentFilters(searchParams), [searchParams]);

  const updateFilters = useCallback(
    (patch: Partial<IncidentFilters>) => {
      const current = parseIncidentFilters(searchParams);
      const next: IncidentFilters = {
        ...current,
        ...patch,
        page: patch.page ?? 1,
      };

      if (next.unassigned) {
        next.mine = false;
        next.assigneeId = undefined;
      } else if (next.mine) {
        next.assigneeId = undefined;
      }

      setSearchParams(toIncidentSearchParams(next), { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, updateFilters, clearFilters };
}
