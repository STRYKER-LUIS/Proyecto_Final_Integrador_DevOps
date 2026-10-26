import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  MessageSquare,
  Pencil,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusBadge, PriorityBadge, SlaBadge } from '../components/incidents/IncidentBadges';
import { CommentsPanel } from '../components/incidents/CommentsPanel';
import { IncidentSidebar } from '../components/incidents/IncidentSidebar';
import { StatusChangeModal } from '../components/incidents/StatusChangeModal';
import { AssignIncidentModal } from '../components/incidents/AssignIncidentModal';
import { EditIncidentModal } from '../components/incidents/EditIncidentModal';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNow } from '../hooks/useNow';
import { useToast } from '../hooks/useToast';
import { incidentApi } from '../services/incident.service';
import { userApi } from '../services/user.service';
import { queryKeys } from '../lib/query-keys';
import { getApiErrorMessage, getApiFieldErrors } from '../lib/api-error';
import {
  canAssignIncidents,
  canCreateInternalNotes,
  canEditImpactAndUrgency,
  canEditIncident,
  canManageIncidents,
} from '../lib/permissions';
import { getSlaState } from '../lib/sla';
import { formatDateTime } from '../lib/format';
import { STATUS_LABELS } from '../lib/labels';
import type {
  AssignIncidentPayload,
  ChangeStatusPayload,
  IncidentDetail,
  IncidentStatus,
  UpdateIncidentPayload,
} from '../types';

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-8 w-2/3" />
        <Skeleton className="mt-3 h-3 w-1/3" />
        <Skeleton className="mt-6 h-24 w-full" />
      </Card>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const incidentId = Number(id);
  const isValidId = Number.isInteger(incidentId) && incidentId > 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusTarget, setStatusTarget] = useState<IncidentStatus | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: queryKeys.incident(incidentId),
    queryFn: () => incidentApi.getById(incidentId),
    enabled: isValidId,
  });

  const incident = query.data;
  const now = useNow();
  useDocumentTitle(incident?.ticketNumber ?? 'Incidente');

  const canManage = user ? canManageIncidents(user.role) : false;
  const canAssign =
    user && incident
      ? canAssignIncidents(user.role) &&
        !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(incident.status)
      : false;
  const canEdit =
    user && incident ? canEditIncident(user.role, incident.status) : false;

  const agentsQuery = useQuery({
    queryKey: queryKeys.agents,
    queryFn: userApi.listStaff,
    enabled: Boolean(user) && canManage,
    staleTime: 5 * 60_000,
  });

  const applyUpdate = (updated: IncidentDetail) => {
    queryClient.setQueryData(queryKeys.incident(updated.id), updated);
    void queryClient.invalidateQueries({ queryKey: queryKeys.incidents });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const statusMutation = useMutation({
    mutationFn: (payload: ChangeStatusPayload) => incidentApi.changeStatus(incidentId, payload),
    onSuccess: (updated) => {
      applyUpdate(updated);
      setStatusTarget(null);
      toast({
        title: 'Estado actualizado',
        description: `El incidente ahora está en estado ${STATUS_LABELS[updated.status]}.`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'No se pudo cambiar el estado',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (payload: AssignIncidentPayload) => incidentApi.assign(incidentId, payload),
    onSuccess: (updated) => {
      applyUpdate(updated);
      setAssignOpen(false);
      toast({
        title: 'Incidente asignado',
        description: updated.assignee
          ? `${updated.assignee.name} es el nuevo responsable.`
          : 'La asignación se actualizó correctamente.',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'No se pudo asignar el incidente',
        description: getApiErrorMessage(error),
        variant: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateIncidentPayload) => incidentApi.update(incidentId, payload),
    onSuccess: (updated) => {
      applyUpdate(updated);
      setEditOpen(false);
      setEditError(null);
      setEditFieldErrors({});
      toast({ title: 'Incidente actualizado', variant: 'success' });
    },
    onError: (error) => {
      setEditError(getApiErrorMessage(error));
      setEditFieldErrors(getApiFieldErrors(error));
    },
  });

  const openEdit = () => {
    setEditError(null);
    setEditFieldErrors({});
    setEditOpen(true);
  };

  if (!isValidId) {
    return (
      <Card>
        <ErrorState
          title="Incidente no encontrado"
          message="El identificador del incidente no es válido."
        />
        <div className="pb-8 text-center">
          <Link to="/incidents" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Volver a incidentes
          </Link>
        </div>
      </Card>
    );
  }

  if (query.isLoading) {
    return <DetailSkeleton />;
  }

  if (query.isError || !incident) {
    return (
      <Card>
        <ErrorState
          title="No pudimos abrir el incidente"
          message={
            query.isError
              ? getApiErrorMessage(query.error)
              : 'El incidente solicitado no existe o no está disponible para tu usuario.'
          }
          onRetry={() => void query.refetch()}
        />
        <div className="pb-8 text-center">
          <Link to="/incidents" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Volver a incidentes
          </Link>
        </div>
      </Card>
    );
  }

  const slaState = getSlaState(
    {
      status: incident.status,
      slaDueAt: incident.slaDueAt,
      resolvedAt: incident.resolvedAt,
    },
    now,
  );

  return (
    <div className="space-y-5">
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Volver a incidentes
      </Link>

      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-slate-400">
                  {incident.ticketNumber}
                </span>
                <StatusBadge status={incident.status} />
                <PriorityBadge priority={incident.priority} />
                <SlaBadge state={slaState} />
              </div>
              <h1 className="mt-3 max-w-4xl text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                {incident.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
                  {formatDateTime(incident.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-slate-400" aria-hidden="true" />
                  {incident.comments.length} {incident.comments.length === 1 ? 'comentario' : 'comentarios'}
                </span>
                <span>
                  Reportado por <span className="font-medium text-slate-700">{incident.reporter.name}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void query.refetch()}
                loading={query.isFetching}
                leftIcon={query.isFetching ? undefined : <RefreshCw className="size-3.5" />}
              >
                Actualizar
              </Button>
              {canEdit ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openEdit}
                  leftIcon={<Pencil className="size-3.5" />}
                >
                  Editar
                </Button>
              ) : null}
              {canAssign ? (
                <Button
                  size="sm"
                  onClick={() => setAssignOpen(true)}
                  leftIcon={<UserPlus className="size-3.5" />}
                >
                  Asignar
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Descripción
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
            {incident.description}
          </p>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-1 min-w-0">
          <CommentsPanel
            incident={incident}
            canCreateInternalNotes={user ? canCreateInternalNotes(user.role) : false}
          />
        </div>
        <div className="order-2">
          <IncidentSidebar
            incident={incident}
            canManage={canManage}
            canAssign={canAssign}
            onStatusChange={setStatusTarget}
            onAssign={() => setAssignOpen(true)}
          />
        </div>
      </div>

      {statusTarget ? (
        <StatusChangeModal
          key={statusTarget}
          open
          incident={incident}
          target={statusTarget}
          onClose={() => setStatusTarget(null)}
          onConfirm={(payload) => statusMutation.mutate(payload)}
          loading={statusMutation.isPending}
        />
      ) : null}

      {user && assignOpen ? (
        <AssignIncidentModal
          open
          incident={incident}
          agents={agentsQuery.data ?? []}
          currentUser={user}
          onClose={() => setAssignOpen(false)}
          onConfirm={(payload) => assignMutation.mutate(payload)}
          loading={assignMutation.isPending}
        />
      ) : null}

      {editOpen ? (
        <EditIncidentModal
          open
          incident={incident}
          canEditPriority={user ? canEditImpactAndUrgency(user.role) : false}
          onClose={() => setEditOpen(false)}
          onConfirm={(payload) => updateMutation.mutate(payload)}
          loading={updateMutation.isPending}
          serverError={editError}
          serverFieldErrors={editFieldErrors}
          onClearServerErrors={() => {
            setEditError(null);
            setEditFieldErrors({});
          }}
        />
      ) : null}
    </div>
  );
}
