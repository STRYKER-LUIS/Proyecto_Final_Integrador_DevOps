import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import {
  CATEGORY_OPTIONS,
  IMPACT_OPTIONS,
  URGENCY_OPTIONS,
} from '../../lib/labels';
import {
  mapIncidentFormFieldErrors,
  validateIncidentForm,
  type IncidentFormErrors,
  type IncidentFormValues,
} from '../../lib/incident-form';
import type {
  Category,
  Impact,
  IncidentDetail,
  UpdateIncidentPayload,
  Urgency,
} from '../../types';

export interface EditIncidentModalProps {
  open: boolean;
  incident: IncidentDetail;
  canEditPriority: boolean;
  onClose: () => void;
  onConfirm: (payload: UpdateIncidentPayload) => void;
  loading: boolean;
  serverError?: string | null;
  serverFieldErrors?: Record<string, string>;
  onClearServerErrors?: () => void;
}

export function EditIncidentModal({
  open,
  incident,
  canEditPriority,
  onClose,
  onConfirm,
  loading,
  serverError,
  serverFieldErrors,
  onClearServerErrors,
}: EditIncidentModalProps) {
  const [values, setValues] = useState<IncidentFormValues>({
    title: incident.title,
    description: incident.description,
    category: incident.category,
    impact: incident.impact,
    urgency: incident.urgency,
  });
  const [errors, setErrors] = useState<IncidentFormErrors>({});

  const fieldErrors = useMemo(
    () => ({
      ...mapIncidentFormFieldErrors(serverFieldErrors ?? {}),
      ...errors,
    }),
    [errors, serverFieldErrors],
  );

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
    if (serverFieldErrors && Object.keys(serverFieldErrors).length > 0) {
      onClearServerErrors?.();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateIncidentForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: UpdateIncidentPayload = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category as Category,
    };

    if (canEditPriority) {
      payload.impact = values.impact as Impact;
      payload.urgency = values.urgency as Urgency;
    }

    onConfirm(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar incidente"
      description="Actualiza la información del caso. Cada cambio quedará auditado."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-incident-form"
            loading={loading}
            leftIcon={loading ? undefined : <Save className="size-4" />}
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="edit-incident-form" onSubmit={handleSubmit} className="space-y-4">
        {serverError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {serverError}
          </div>
        ) : null}

        <Input
          label="Título *"
          value={values.title}
          onChange={(event) => updateField('title', event.target.value)}
          error={fieldErrors.title}
          maxLength={200}
          required
        />

        <Textarea
          label="Descripción *"
          value={values.description}
          onChange={(event) => updateField('description', event.target.value)}
          error={fieldErrors.description}
          rows={6}
          maxLength={10_000}
          required
        />

        <Select
          label="Categoría *"
          value={values.category}
          onChange={(event) => updateField('category', event.target.value as Category | '')}
          error={fieldErrors.category}
          required
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {canEditPriority ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Impacto *"
              value={values.impact}
              onChange={(event) => updateField('impact', event.target.value as Impact | '')}
              error={fieldErrors.impact}
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
              error={fieldErrors.urgency}
              required
            >
              {URGENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            El impacto, la urgencia y la prioridad solo pueden ser modificados por el equipo de soporte.
          </p>
        )}
      </form>
    </Modal>
  );
}
