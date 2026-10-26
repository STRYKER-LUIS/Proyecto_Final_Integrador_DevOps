import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Inbox,
  Plus,
  RefreshCw,
  SearchX,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Feedback';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Pagination } from '../components/ui/Pagination';
import { Avatar } from '../components/ui/Avatar';
import { IncidentFiltersBar } from '../components/incidents/IncidentFiltersBar';
import {
  CategoryLabel,
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from '../components/incidents/IncidentBadges';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useIncidentFilters } from '../hooks/useIncidentFilters';
import { incidentApi } from '../services/incident.service';
import { userApi } from '../services/user.service';
import { queryKeys } from '../lib/query-keys';
import { getApiErrorMessage } from '../lib/api-error';
import { toIncidentListParams } from '../lib/filters';
import {
  formatRelativeTime,
  formatTicketNumber,
  truncate,
} from '../lib/format';
import type { Incident } from '../types';

function IncidentTable({ incidents }: { incidents: Incident[] }) {
  const navigate = useNavigate();

  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="border-y border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-5 py-3 sm:px-6">Incidente</th>
            <th scope="col" className="px-3 py-3">Prioridad</th>
            <th scope="col" className="px-3 py-3">Estado</th>
            <th scope="col" className="px-3 py-3">SLA</th>
            <th scope="col" className="px-3 py-3">Responsable</th>
            <th scope="col" className="px-5 py-3 text-right sm:px-6">Actualizado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              onClick={() => navigate(`/incidents/${incident.id}`)}
              className="group cursor-pointer transition hover:bg-slate-50/80"
            >
              <td className="px-5 py-3.5 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-500">
                    <Inbox className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-400">
                        {incident.ticketNumber || formatTicketNumber(incident.id)}
                      </span>
                      <CategoryLabel category={incident.category} />
                    </div>
                    <Link
                      to={`/incidents/${incident.id}`}
                      className="mt-0.5 block max-w-md truncate text-sm font-semibold text-slate-800 transition group-hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      {truncate(incident.title, 96)}
                    </Link>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <PriorityBadge priority={incident.priority} />
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge status={incident.status} />
              </td>
              <td className="px-3 py-3.5">
                <SlaBadge state={incident.slaStatus} />
              </td>
              <td className="px-3 py-3.5">
                {incident.assignee ? (
                  <span className="flex items-center gap-2">
                    <Avatar name={incident.assignee.name} size="xs" />
                    <span className="max-w-32 truncate text-xs text-slate-600">
                      {incident.assignee.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs italic text-slate-400">Sin asignar</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-right text-xs text-slate-400 sm:px-6">
                {formatRelativeTime(incident.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IncidentCards({ incidents }: { incidents: Incident[] }) {
  return (
    <ul className="divide-y divide-slate-100 lg:hidden">
      {incidents.map((incident) => (
        <li key={incident.id}>
          <Link
            to={`/incidents/${incident.id}`}
            className="block px-4 py-4 transition active:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold text-slate-400">
                {incident.ticketNumber || formatTicketNumber(incident.id)}
              </span>
              <PriorityBadge priority={incident.priority} />
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-800">
              {incident.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={incident.status} />
              <SlaBadge state={incident.slaStatus} />
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <CategoryLabel category={incident.category} />
              <span className="text-[11px] text-slate-400">
                {formatRelativeTime(incident.updatedAt)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {incident.assignee ? (
                <>
                  <Avatar name={incident.assignee.name} size="xs" />
                  <span className="truncate text-xs text-slate-500">{incident.assignee.name}</span>
                </>
              ) : (
                <span className="text-xs italic text-slate-400">Sin asignar</span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function IncidentListSkeleton() {
  return (
    <div>
      <div className="border-y border-slate-100 bg-slate-50/60 px-6 py-3">
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="size-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
            <Skeleton className="hidden h-6 w-24 rounded-full md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IncidentsPage() {
  useDocumentTitle('Incidentes');
  const { user } = useAuth();
  const { filters, updateFilters, clearFilters } = useIncidentFilters();
  const showAssigneeFilter = user?.role !== 'REPORTER';
  const debouncedSearch = useDebouncedValue(filters.search, 400);
  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const agentsQuery = useQuery({
    queryKey: queryKeys.agents,
    queryFn: userApi.listStaff,
    enabled: showAssigneeFilter,
    staleTime: 5 * 60_000,
  });

  const incidentsQuery = useQuery({
    queryKey: queryKeys.incidentList(queryFilters),
    queryFn: () => incidentApi.list(toIncidentListParams(queryFilters)),
    placeholderData: keepPreviousData,
  });

  const incidents = incidentsQuery.data?.items ?? [];
  const pagination = incidentsQuery.data?.pagination;
  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    Boolean(filters.category) ||
    Boolean(filters.assigneeId) ||
    filters.unassigned ||
    filters.mine ||
    filters.sort !== 'newest';

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Gestión de casos"
        title="Incidentes"
        description="Consulta, filtra y da seguimiento a todos los incidentes de TI. Los SLA y las transiciones de estado se aplican automáticamente."
        actions={
          <Link
            to="/incidents/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo incidente
          </Link>
        }
      />

      <IncidentFiltersBar
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        agents={agentsQuery.data ?? []}
        showAssigneeFilter={showAssigneeFilter}
        loading={incidentsQuery.isFetching}
      />

      {incidentsQuery.isError && incidentsQuery.data ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          No se pudo actualizar la lista. Se muestran los últimos resultados disponibles.
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {incidentsQuery.isLoading ? <IncidentListSkeleton /> : null}

        {incidentsQuery.isError && !incidentsQuery.data ? (
          <ErrorState
            message={getApiErrorMessage(incidentsQuery.error)}
            onRetry={() => void incidentsQuery.refetch()}
          />
        ) : null}

        {!incidentsQuery.isLoading && !incidentsQuery.isError && pagination ? (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-800">
                  {pagination.total.toLocaleString('es-CO')}
                </span>{' '}
                {pagination.total === 1 ? 'incidente' : 'incidentes'}
                {hasFilters ? ' con los filtros aplicados' : ' en total'}
              </p>
              {incidentsQuery.isFetching ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                  <RefreshCw className="size-3 animate-spin" aria-hidden="true" />
                  Actualizando
                </span>
              ) : null}
            </div>

            {incidents.length === 0 ? (
              <EmptyState
                icon={hasFilters ? SearchX : Inbox}
                title={hasFilters ? 'No encontramos coincidencias' : 'Aún no hay incidentes'}
                description={
                  hasFilters
                    ? 'Prueba con otros filtros o limpia la búsqueda para ver todos los incidentes.'
                    : 'Registra el primer incidente para comenzar a medir SLA, prioridades y tiempos de respuesta.'
                }
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  ) : (
                    <Link
                      to="/incidents/new"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Nuevo incidente
                    </Link>
                  )
                }
              />
            ) : (
              <>
                <IncidentTable incidents={incidents} />
                <IncidentCards incidents={incidents} />
              </>
            )}

            {incidents.length > 0 ? (
              <Pagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={(page) => updateFilters({ page })}
                disabled={incidentsQuery.isFetching}
              />
            ) : null}
          </>
        ) : null}

        {!incidentsQuery.isLoading && !incidentsQuery.isError && !pagination ? (
          <EmptyState
            icon={Inbox}
            title="Sin datos"
            description="No se recibió información de incidentes. Intenta actualizar la página."
            action={<Button variant="secondary" onClick={() => void incidentsQuery.refetch()}>Reintentar</Button>}
          />
        ) : null}
      </Card>
    </div>
  );
}
