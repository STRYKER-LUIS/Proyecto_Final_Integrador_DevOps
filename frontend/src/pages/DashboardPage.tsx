import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Plus,
  RefreshCw,
  Sparkles,
  Ticket,
  Timer,
  UserRound,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Panel } from '../components/ui/Panel';
import { Skeleton } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/ErrorState';
import { KpiCard } from '../components/dashboard/KpiCard';
import { RecentIncidents } from '../components/dashboard/RecentIncidents';
import {
  CategoryChart,
  PriorityBars,
  StatusDonut,
  TrendChart,
} from '../components/dashboard/DashboardCharts';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { dashboardApi } from '../services/dashboard.service';
import { queryKeys } from '../lib/query-keys';
import { getApiErrorMessage } from '../lib/api-error';
import {
  formatDateTime,
  formatHours,
  formatNumber,
  formatPercent,
} from '../lib/format';
import type { DashboardSummary } from '../types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mx-auto mt-8 size-48 rounded-full" />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-52 w-full" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-6 h-52 w-full" />
        </div>
      </div>
    </div>
  );
}

function DashboardContent({ data }: { data: DashboardSummary }) {
  const { kpis, scope } = data;
  const isOwnScope = scope === 'OWN';

  return (
    <div className="space-y-6">
      {kpis.totalIncidents === 0 ? (
        <Card className="relative overflow-hidden border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-lg shadow-indigo-900/15 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ring-white/20">
                <Sparkles className="size-3" aria-hidden="true" />
                Primer paso
              </span>
              <h2 className="mt-3 text-xl font-bold">
                {isOwnScope ? 'Registra tu primer incidente' : 'Aún no hay incidentes registrados'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-indigo-100">
                Describe el problema, clasifícalo por impacto y urgencia, y el sistema calculará la
                prioridad y el SLA automáticamente.
              </p>
            </div>
            <Link
              to="/incidents/new"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo incidente
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Incidentes abiertos"
          value={formatNumber(kpis.openIncidents)}
          helper={
            <>
              <span className="font-semibold text-slate-700">{formatNumber(kpis.inProgressIncidents)}</span>{' '}
              en progreso · {formatNumber(kpis.resolvedLast7Days)} resueltos en 7 días
            </>
          }
          icon={Ticket}
          tone="indigo"
        />
        <KpiCard
          label="Sin asignar"
          value={formatNumber(kpis.unassignedIncidents)}
          helper={
            kpis.unassignedIncidents > 0
              ? 'Requieren un responsable para avanzar'
              : 'Todos los casos activos tienen responsable'
          }
          icon={UserRound}
          tone={kpis.unassignedIncidents > 0 ? 'amber' : 'emerald'}
        />
        <KpiCard
          label="SLA en riesgo"
          value={formatNumber(kpis.slaAtRisk)}
          helper={
            kpis.slaBreached > 0 ? (
              <span className="font-medium text-rose-600">
                {formatNumber(kpis.slaBreached)} con SLA vencido
              </span>
            ) : (
              'Sin incumplimientos activos'
            )
          }
          icon={Timer}
          tone={kpis.slaAtRisk > 0 || kpis.slaBreached > 0 ? 'rose' : 'emerald'}
        />
        <KpiCard
          label="Cumplimiento SLA"
          value={formatPercent(kpis.slaComplianceRate)}
          helper={`Tiempo medio de resolución: ${formatHours(kpis.averageResolutionHours)}`}
          icon={Gauge}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Creados vs. resueltos"
          description="Últimos 14 días de operación."
          action={<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">14 días</span>}
          className="xl:col-span-2"
        >
          <TrendChart data={data.trend} />
        </Panel>

        <Panel title="Distribución por estado" description="Todos los incidentes del alcance.">
          <StatusDonut data={data.statusDistribution} />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Prioridad de activos" description="Incidentes abiertos por prioridad.">
          <PriorityBars data={data.priorityDistribution} />
        </Panel>

        <Panel
          title="Categorías con más demanda"
          description="Incidentes activos agrupados por categoría."
          className="xl:col-span-2"
        >
          <CategoryChart data={data.categoryDistribution} />
        </Panel>
      </div>

      <RecentIncidents incidents={data.recentIncidents} />

      <p className="text-center text-[11px] text-slate-400">
        Actualizado el {formatDateTime(data.generatedAt)} · Los indicadores respetan el alcance de tu rol.
      </p>
    </div>
  );
}

export function DashboardPage() {
  useDocumentTitle('Panel');
  const { user } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.getSummary,
  });

  const firstName = user?.name.split(' ')[0] ?? '';
  const description =
    query.data?.scope === 'OWN'
      ? `${getGreeting()}, ${firstName}. Este es el estado de los incidentes que has reportado.`
      : `${getGreeting()}, ${firstName}. Estado en tiempo real de la operación de soporte.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Centro de operaciones"
        title="Panel de incidentes"
        description={description}
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => void query.refetch()}
              loading={query.isFetching}
              leftIcon={query.isFetching ? undefined : <RefreshCw className="size-4" />}
            >
              Actualizar
            </Button>
            <Link
              to="/incidents/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo incidente
            </Link>
          </>
        }
      />

      {query.isLoading ? <DashboardSkeleton /> : null}

      {query.isError && !query.data ? (
        <Card>
          <ErrorState
            message={getApiErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
          />
        </Card>
      ) : null}

      {query.data ? <DashboardContent data={query.data} /> : null}

      {query.isError && query.data ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          No se pudieron actualizar los indicadores. Se muestran los últimos datos disponibles.
        </div>
      ) : null}

      {!query.isLoading && !query.isError && !query.data ? (
        <Card>
          <ErrorState
            title="Sin datos disponibles"
            message="No se recibió información del panel. Intenta actualizar nuevamente."
            onRetry={() => void query.refetch()}
          />
        </Card>
      ) : null}

      {query.data && query.data.kpis.slaBreached > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Hay {formatNumber(query.data.kpis.slaBreached)} incidente(s) con SLA vencido.{' '}
            <Link to="/incidents?sort=priority" className="font-semibold underline underline-offset-2">
              Revisar prioridades
            </Link>
            .
          </span>
        </div>
      ) : query.data ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          No hay incidentes activos con SLA vencido.
          <Link to="/incidents" className="ml-auto inline-flex items-center gap-1 font-semibold">
            Ver incidentes <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
