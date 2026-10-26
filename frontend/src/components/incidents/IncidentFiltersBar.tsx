import { useState, type ReactNode } from 'react';
import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { cn } from '../../lib/cn';
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SORT_OPTIONS_LIST,
  STATUS_OPTIONS,
} from '../../lib/labels';
import {
  countActiveIncidentFilters,
  hasActiveIncidentFilters,
  PAGE_SIZE_OPTIONS,
} from '../../lib/filters';
import type {
  Category,
  IncidentFilters,
  IncidentStatus,
  Priority,
  PublicUser,
  SortOption,
} from '../../types';

export interface IncidentFiltersBarProps {
  filters: IncidentFilters;
  onChange: (patch: Partial<IncidentFilters>) => void;
  onClear: () => void;
  agents: PublicUser[];
  showAssigneeFilter: boolean;
  loading?: boolean;
}

export function IncidentFiltersBar({
  filters,
  onChange,
  onClear,
  agents,
  showAssigneeFilter,
  loading = false,
}: IncidentFiltersBarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeCount = countActiveIncidentFilters(filters);
  const hasFilters = hasActiveIncidentFilters(filters);
  const search = filters.search;

  const clearSearch = () => onChange({ search: '' });

  const assignmentScope = filters.unassigned ? 'unassigned' : filters.mine ? 'mine' : 'all';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <Input
            type="search"
            value={search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Buscar por título, descripción o número de ticket…"
            aria-label="Buscar incidentes"
            leadingIcon={<Search className="size-4" />}
            trailing={
              search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-3.5" />
                </button>
              ) : null
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select
              value={filters.sort}
              onChange={(event) => onChange({ sort: event.target.value as SortOption })}
              aria-label="Ordenar incidentes"
            >
              {SORT_OPTIONS_LIST.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={() => setAdvancedOpen((current) => !current)}
            leftIcon={<SlidersHorizontal className="size-4" />}
            aria-expanded={advancedOpen}
          >
            Filtros
            {activeCount > 0 ? (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterChip
          active={assignmentScope === 'all'}
          onClick={() => onChange({ unassigned: false, mine: false, assigneeId: undefined })}
        >
          Todos
        </FilterChip>
        <FilterChip
          active={assignmentScope === 'unassigned'}
          onClick={() => onChange({ unassigned: true, mine: false, assigneeId: undefined })}
        >
          Sin asignar
        </FilterChip>
        {showAssigneeFilter ? (
          <FilterChip
            active={assignmentScope === 'mine'}
            onClick={() => onChange({ mine: true, unassigned: false, assigneeId: undefined })}
          >
            <UserRound className="size-3.5" aria-hidden="true" />
            Mis asignados
          </FilterChip>
        ) : null}

        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Limpiar filtros
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          'mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5',
          !advancedOpen && 'hidden lg:grid',
        )}
      >
        <Select
          value={filters.status ?? ''}
          onChange={(event) =>
            onChange({ status: (event.target.value || undefined) as IncidentStatus | undefined })
          }
          placeholder="Todos los estados"
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.priority ?? ''}
          onChange={(event) =>
            onChange({ priority: (event.target.value || undefined) as Priority | undefined })
          }
          placeholder="Todas las prioridades"
          aria-label="Filtrar por prioridad"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.category ?? ''}
          onChange={(event) =>
            onChange({ category: (event.target.value || undefined) as Category | undefined })
          }
          placeholder="Todas las categorías"
          aria-label="Filtrar por categoría"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {showAssigneeFilter ? (
          <Select
            value={filters.assigneeId ?? ''}
            onChange={(event) =>
              onChange({
                assigneeId: event.target.value || undefined,
                unassigned: false,
                mine: false,
              })
            }
            placeholder="Todos los responsables"
            aria-label="Filtrar por responsable"
            disabled={filters.unassigned || filters.mine}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </Select>
        ) : null}

        <Select
          value={String(filters.pageSize)}
          onChange={(event) => onChange({ pageSize: Number(event.target.value), page: 1 })}
          aria-label="Incidentes por página"
          disabled={loading}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        active
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  );
}
