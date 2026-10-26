import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gauge,
  Info,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../hooks/useToast';
import { incidentApi } from '../services/incident.service';
import { queryKeys } from '../lib/query-keys';
import { getApiErrorMessage, getApiFieldErrors } from '../lib/api-error';
import { cn } from '../lib/cn';
import {
  CATEGORY_OPTIONS,
  IMPACT_OPTIONS,
  IMPACT_LABELS,
  PRIORITY_LABELS,
  URGENCY_LABELS,
  URGENCY_OPTIONS,
} from '../lib/labels';
import {
  calculatePriority,
  getSlaResolutionHours,
} from '../lib/priority';
import {
  EMPTY_INCIDENT_FORM,
  isCompleteIncidentForm,
  mapIncidentFormFieldErrors,
  validateIncidentForm,
  type IncidentFormErrors,
  type IncidentFormValues,
} from '../lib/incident-form';
import type {
  Category,
  CreateIncidentPayload,
  Impact,
  Priority,
  Urgency,
} from '../types';

const PRIORITY_TONES: Record<Priority, { badge: string; dot: string }> = {
  LOW: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  MEDIUM: { badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  HIGH: { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  CRITICAL: { badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
};

const IMPACT_ROWS: Impact[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const URGENCY_COLUMNS: Urgency[] = ['LOW', 'MEDIUM', 'HIGH'];

function PriorityMatrix() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-center text-[11px]">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            <th scope="col" className="px-2 py-2 text-left font-semibold">Impacto</th>
            {URGENCY_COLUMNS.map((urgency) => (
              <th key={urgency} scope="col" className="px-1 py-2 font-semibold">
                {URGENCY_LABELS[urgency]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {IMPACT_ROWS.map((impact) => (
            <tr key={impact}>
              <th scope="row" className="bg-slate-50/60 px-2 py-2 text-left font-medium text-slate-600">
                {IMPACT_LABELS[impact]}
              </th>
              {URGENCY_COLUMNS.map((urgency) => {
                const priority = calculatePriority(impact, urgency);
                return (
                  <td key={urgency} className="px-1 py-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold',
                        PRIORITY_TONES[priority].badge,
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', PRIORITY_TONES[priority].dot)} />
                      {PRIORITY_LABELS[priority]}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NewIncidentPage() {
  useDocumentTitle('Nuevo incidente');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [values, setValues] = useState<IncidentFormValues>(EMPTY_INCIDENT_FORM);
  const [errors, setErrors] = useState<IncidentFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const priority =
    values.impact && values.urgency ? calculatePriority(values.impact, values.urgency) : null;
  const slaHours = priority ? getSlaResolutionHours(priority) : null;

  const createMutation = useMutation({
    mutationFn: (payload: CreateIncidentPayload) => incidentApi.create(payload),
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast({
        title: 'Incidente registrado',
        description: `${incident.ticketNumber} fue creado con prioridad ${PRIORITY_LABELS[incident.priority]}.`,
        variant: 'success',
      });
      navigate(`/incidents/${incident.id}`);
    },
    onError: (error) => {
      const mapped = mapIncidentFormFieldErrors(getApiFieldErrors(error));
      setErrors((current) => ({ ...current, ...mapped }));
      setGeneralError(getApiErrorMessage(error));
    },
  });

  const updateField = <Field extends keyof IncidentFormValues>(
    field: Field,
    value: IncidentFormValues[Field],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setGeneralError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);

    const validationErrors = validateIncidentForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!isCompleteIncidentForm(values)) {
      setGeneralError('Completa todos los campos obligatorios para registrar el incidente.');
      return;
    }

    createMutation.mutate({
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category as Category,
      impact: values.impact as Impact,
      urgency: values.urgency as Urgency,
    });
  };

  return (
    <div className="space-y-6">
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Volver a incidentes
      </Link>

      <PageHeader
        eyebrow="Registro de caso"
        title="Nuevo incidente"
        description="Cuéntanos qué está pasando. La prioridad y el SLA se calculan automáticamente a partir del impacto y la urgencia."
      />

      <form onSubmit={handleSubmit} noValidate className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {generalError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">No se pudo registrar el incidente</p>
                <p className="mt-0.5 text-xs">{generalError}</p>
              </div>
            </div>
          ) : null}

          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Detalles del incidente</h2>
                <p className="text-xs text-slate-500">Sé claro y específico para acelerar la atención.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Título *"
                value={values.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Ej. La VPN corporativa no permite conexiones"
                error={errors.title}
                hint={`${values.title.length}/200 caracteres`}
                maxLength={200}
                autoFocus
                required
              />

              <Textarea
                label="Descripción *"
                value={values.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Describe el problema, a quién afecta, desde cuándo ocurre y qué intentaste hacer…"
                error={errors.description}
                hint={`${values.description.length}/10000 caracteres`}
                rows={8}
                maxLength={10_000}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Categoría *"
                  value={values.category}
                  onChange={(event) => updateField('category', event.target.value as Category | '')}
                  placeholder="Selecciona una categoría"
                  error={errors.category}
                  required
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Gauge className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Impacto y urgencia</h2>
                <p className="text-xs text-slate-500">
                  Definen la prioridad y el tiempo objetivo de resolución.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Impacto *"
                value={values.impact}
                onChange={(event) => updateField('impact', event.target.value as Impact | '')}
                placeholder="¿A cuántos afecta?"
                error={errors.impact}
                required
              >
                {IMPACT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Select
                label="Urgencia *"
                value={values.urgency}
                onChange={(event) => updateField('urgency', event.target.value as Urgency | '')}
                placeholder="¿Qué tan rápido se necesita?"
                error={errors.urgency}
                required
              >
                {URGENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-inset ring-slate-200">
                    <Clock className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Vista previa de prioridad</p>
                    <p className="text-[11px] text-slate-500">
                      {priority
                        ? `SLA objetivo de ${slaHours} horas desde el registro del incidente`
                        : 'Selecciona impacto y urgencia para calcularla.'}
                    </p>
                  </div>
                </div>
                {priority ? (
                  <Badge tone={priority === 'CRITICAL' ? 'rose' : priority === 'HIGH' ? 'amber' : priority === 'MEDIUM' ? 'sky' : 'slate'} dot>
                    Prioridad {PRIORITY_LABELS[priority]}
                  </Badge>
                ) : (
                  <Badge tone="gray">Pendiente</Badge>
                )}
              </div>
            </div>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              to="/incidents"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              loading={createMutation.isPending}
              leftIcon={createMutation.isPending ? undefined : <CheckCircle2 className="size-4" />}
            >
              Registrar incidente
            </Button>
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-indigo-500" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900">Matriz de priorización</h2>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              La prioridad se deriva del cruce entre impacto y urgencia. No es editable manualmente.
            </p>
            <div className="mt-4">
              <PriorityMatrix />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-900">Tiempos objetivo (SLA)</h2>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              El reloj inicia al registrar el incidente y se detiene al resolverlo.
            </p>
            <ul className="mt-4 space-y-2.5">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((item) => (
                <li key={item} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={cn('size-2 rounded-full', PRIORITY_TONES[item].dot)} />
                    {PRIORITY_LABELS[item]}
                  </span>
                  <span className="font-semibold tabular-nums text-slate-800">
                    {getSlaResolutionHours(item)} h
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-indigo-800">
              <ArrowRight className="size-3.5" aria-hidden="true" />
              ¿Qué pasa después?
            </p>
            <p className="mt-2 text-xs leading-5 text-indigo-700/80">
              El incidente quedará en estado <strong>Nuevo</strong>. El equipo de soporte podrá asignarlo,
              iniciar el trabajo y registrar cada avance en la bitácora.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
