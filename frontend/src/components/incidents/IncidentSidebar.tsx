import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  UserPlus,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { CategoryLabel, PriorityBadge } from './IncidentBadges';
import {
  getTransitionLabel,
  IMPACT_LABELS,
  PRIORITY_LABELS,
  ROLE_LABELS,
  SLA_LABELS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  URGENCY_LABELS,
} from '../../lib/labels';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '../../lib/format';
import {
  formatSlaCountdown,
  getSlaElapsedPercent,
  getSlaState,
} from '../../lib/sla';
import { cn } from '../../lib/cn';
import { useNow } from '../../hooks/useNow';
import type {
  IncidentDetail,
  IncidentStatus,
  SlaState,
} from '../../types';

const TRANSITION_ICONS: Record<IncidentStatus, LucideIcon> = {
  NEW: RotateCcw,
  ASSIGNED: UserPlus,
  IN_PROGRESS: PlayCircle,
  ON_HOLD: PauseCircle,
  RESOLVED: CheckCircle2,
  CLOSED: CheckCircle2,
  CANCELLED: XCircle,
};

const SLA_BAR_STYLES: Record<SlaState, string> = {
  ON_TRACK: 'bg-emerald-500',
  AT_RISK: 'bg-amber-500',
  BREACHED: 'bg-rose-500',
  MET: 'bg-emerald-500',
  MISSED: 'bg-rose-500',
  CANCELLED: 'bg-slate-400',
};

function transitionVariant(status: IncidentStatus): 'primary' | 'secondary' | 'success' | 'danger' {
  if (status === 'IN_PROGRESS') return 'primary';
  if (status === 'RESOLVED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  return 'secondary';
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-xs font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export interface IncidentSidebarProps {
  incident: IncidentDetail;
  canManage: boolean;
  canAssign: boolean;
  onStatusChange: (status: IncidentStatus) => void;
  onAssign: () => void;
}

export function IncidentSidebar({
  incident,
  canManage,
  canAssign,
  onStatusChange,
  onAssign,
}: IncidentSidebarProps) {
  const now = useNow();
  const slaState = getSlaState(
    {
      status: incident.status,
      slaDueAt: incident.slaDueAt,
      resolvedAt: incident.resolvedAt,
    },
    now,
  );
  const isActive = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(incident.status);
  const progressNow = incident.resolvedAt ? new Date(incident.resolvedAt) : now;
  const elapsedPercent = getSlaElapsedPercent(incident.createdAt, incident.slaDueAt, progressNow);

  return (
    <aside className="space-y-4">
      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900">Acciones</h2>

        {canManage ? (
          incident.allowedTransitions.length > 0 ? (
            <div className="mt-4 space-y-2">
              {incident.allowedTransitions.map((status) => {
                const Icon = TRANSITION_ICONS[status];
                return (
                  <Button
                    key={status}
                    variant={transitionVariant(status)}
                    className="w-full justify-start"
                    leftIcon={<Icon className="size-4" />}
                    onClick={() => onStatusChange(status)}
                  >
                    {getTransitionLabel(status)}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              No hay transiciones disponibles desde el estado actual.
            </p>
          )
        ) : (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            El equipo de soporte gestiona el estado y la asignación de este incidente. Puedes
            participar agregando comentarios.
          </p>
        )}

        {canAssign ? (
          <Button
            variant="secondary"
            className="mt-3 w-full justify-start"
            leftIcon={<UserPlus className="size-4" />}
            onClick={onAssign}
          >
            {incident.assignee ? 'Reasignar responsable' : 'Asignar responsable'}
          </Button>
        ) : null}

        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500">
          {STATUS_DESCRIPTIONS[incident.status]}
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">SLA</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {SLA_LABELS[slaState]}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <Clock className="size-3.5 text-slate-400" aria-hidden="true" />
          {isActive ? (
            <span className={cn(slaState === 'AT_RISK' && 'font-semibold text-amber-700', slaState === 'BREACHED' && 'font-semibold text-rose-700')}>
              {formatSlaCountdown(incident.slaDueAt, now)}
            </span>
          ) : (
            <span>
              {incident.resolvedAt
                ? `Resuelto ${formatRelativeTime(incident.resolvedAt)}`
                : 'Sin fecha de resolución'}
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all', SLA_BAR_STYLES[slaState])}
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
            <span>{elapsedPercent}% del tiempo</span>
            <span>Vence {formatDateTime(incident.slaDueAt)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900">Detalles</h2>
        <dl className="mt-2 divide-y divide-slate-100">
          <DetailRow label="Categoría" value={<CategoryLabel category={incident.category} />} />
          <DetailRow label="Impacto" value={IMPACT_LABELS[incident.impact]} />
          <DetailRow label="Urgencia" value={URGENCY_LABELS[incident.urgency]} />
          <DetailRow label="Prioridad" value={<PriorityBadge priority={incident.priority} />} />
          <DetailRow label="Creado" value={formatDateTime(incident.createdAt)} />
          <DetailRow label="Actualizado" value={formatDateTime(incident.updatedAt)} />
          <DetailRow
            label="Primera respuesta"
            value={incident.firstResponseAt ? formatDateTime(incident.firstResponseAt) : 'Pendiente'}
          />
          {incident.resolvedAt ? (
            <DetailRow label="Resuelto" value={formatDateTime(incident.resolvedAt)} />
          ) : null}
          {incident.closedAt ? (
            <DetailRow label="Cerrado" value={formatDate(incident.closedAt)} />
          ) : null}
        </dl>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold text-slate-900">Personas</h2>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reportado por</p>
            <div className="mt-2 flex items-center gap-2.5">
              <Avatar name={incident.reporter.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {incident.reporter.name}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {ROLE_LABELS[incident.reporter.role]} · {incident.reporter.email}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Responsable</p>
            {incident.assignee ? (
              <div className="mt-2 flex items-center gap-2.5">
                <Avatar name={incident.assignee.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {incident.assignee.name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {ROLE_LABELS[incident.assignee.role]} · {incident.assignee.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs italic text-slate-400">Sin asignar</span>
                {canAssign ? (
                  <button
                    type="button"
                    onClick={onAssign}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Asignar
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</p>
        <p className="mt-1 text-xs font-semibold text-slate-700">
          {STATUS_LABELS[incident.status]} · Prioridad {PRIORITY_LABELS[incident.priority]}
        </p>
      </div>
    </aside>
  );
}
