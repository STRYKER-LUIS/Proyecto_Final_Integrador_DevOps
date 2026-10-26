import {
  CATEGORIES,
  IMPACTS,
  INCIDENT_STATUSES,
  PRIORITIES,
  ROLES,
  SORT_OPTIONS,
  URGENCIES,
} from '../types';
import type {
  ActivityAction,
  Category,
  Impact,
  IncidentStatus,
  Priority,
  Role,
  SlaState,
  SortOption,
  Urgency,
} from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  AGENT: 'Agente de soporte',
  REPORTER: 'Usuario',
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  NEW: 'Nuevo',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En progreso',
  ON_HOLD: 'En espera',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

export const STATUS_DESCRIPTIONS: Record<IncidentStatus, string> = {
  NEW: 'Registrado y pendiente de clasificación.',
  ASSIGNED: 'Tiene un responsable asignado.',
  IN_PROGRESS: 'El equipo de soporte está trabajando en él.',
  ON_HOLD: 'Pausado a la espera de información o de un tercero.',
  RESOLVED: 'La solución fue aplicada y está pendiente de cierre.',
  CLOSED: 'Caso finalizado y cerrado.',
  CANCELLED: 'El caso fue cancelado y no requiere gestión.',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const IMPACT_LABELS: Record<Impact, string> = {
  LOW: 'Bajo',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  NETWORK: 'Red',
  ACCESS: 'Accesos',
  EMAIL: 'Correo',
  OTHER: 'Otro',
};

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  CREATED: 'Incidente creado',
  UPDATED: 'Datos actualizados',
  ASSIGNED: 'Asignación',
  STATUS_CHANGED: 'Cambio de estado',
  COMMENTED: 'Comentario',
};

export const SLA_LABELS: Record<SlaState, string> = {
  ON_TRACK: 'Dentro del SLA',
  AT_RISK: 'SLA en riesgo',
  BREACHED: 'SLA vencido',
  MET: 'SLA cumplido',
  MISSED: 'SLA incumplido',
  CANCELLED: 'Sin SLA',
};

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Más recientes',
  oldest: 'Más antiguos',
  priority: 'Mayor prioridad',
};

export const TRANSITION_LABELS: Record<IncidentStatus, string> = {
  NEW: 'Devolver a nuevo',
  ASSIGNED: 'Marcar como asignado',
  IN_PROGRESS: 'Iniciar trabajo',
  ON_HOLD: 'Poner en espera',
  RESOLVED: 'Resolver incidente',
  CLOSED: 'Cerrar incidente',
  CANCELLED: 'Cancelar incidente',
};

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

function toOptions<T extends string>(values: readonly T[], labels: Record<T, string>): SelectOption<T>[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

export const ROLE_OPTIONS = toOptions(ROLES, ROLE_LABELS);
export const STATUS_OPTIONS = toOptions(INCIDENT_STATUSES, STATUS_LABELS);
export const PRIORITY_OPTIONS = toOptions(PRIORITIES, PRIORITY_LABELS);
export const IMPACT_OPTIONS = toOptions(IMPACTS, IMPACT_LABELS);
export const URGENCY_OPTIONS = toOptions(URGENCIES, URGENCY_LABELS);
export const CATEGORY_OPTIONS = toOptions(CATEGORIES, CATEGORY_LABELS);
export const SORT_OPTIONS_LIST = toOptions(SORT_OPTIONS, SORT_LABELS);

export function getStatusLabel(status: IncidentStatus): string {
  return STATUS_LABELS[status];
}

export function getPriorityLabel(priority: Priority): string {
  return PRIORITY_LABELS[priority];
}

export function getTransitionLabel(status: IncidentStatus): string {
  return TRANSITION_LABELS[status];
}
