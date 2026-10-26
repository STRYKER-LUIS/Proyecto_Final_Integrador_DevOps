import { useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { StatusBadge } from './IncidentBadges';
import { STATUS_DESCRIPTIONS, STATUS_LABELS, getTransitionLabel } from '../../lib/labels';
import type {
  ChangeStatusPayload,
  IncidentDetail,
  IncidentStatus,
} from '../../types';

export interface StatusChangeModalProps {
  open: boolean;
  incident: IncidentDetail;
  target: IncidentStatus | null;
  onClose: () => void;
  onConfirm: (payload: ChangeStatusPayload) => void;
  loading: boolean;
}

function getConfirmVariant(status: IncidentStatus): 'primary' | 'success' | 'danger' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'CANCELLED') return 'danger';
  return 'primary';
}

export function StatusChangeModal({
  open,
  incident,
  target,
  onClose,
  onConfirm,
  loading,
}: StatusChangeModalProps) {
  const [note, setNote] = useState('');

  if (!target) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm({ status: target, ...(note.trim() ? { note: note.trim() } : {}) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getTransitionLabel(target)}
      description="El cambio quedará registrado en la bitácora con tu usuario y la fecha."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="status-change-form"
            variant={getConfirmVariant(target)}
            loading={loading}
          >
            Confirmar cambio
          </Button>
        </>
      }
    >
      <form id="status-change-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <StatusBadge status={incident.status} />
          <ArrowRight className="size-3.5 text-slate-400" aria-hidden="true" />
          <StatusBadge status={target} />
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
          {STATUS_DESCRIPTIONS[target]}
        </div>

        {target === 'CANCELLED' ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Cancelar el incidente detiene el seguimiento. Esta acción no se puede deshacer, aunque el
            caso podría reabrirse desde el estado cerrado.
          </div>
        ) : null}

        <Textarea
          label="Nota de la transición (opcional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Explica brevemente el motivo o el trabajo realizado…"
          rows={3}
          maxLength={500}
          hint={`${note.length}/500 caracteres`}
          disabled={loading}
        />

        <p className="text-[11px] text-slate-400">
          Estado actual: <span className="font-semibold text-slate-600">{STATUS_LABELS[incident.status]}</span>.
          La transición se valida automáticamente contra la máquina de estados.
        </p>
      </form>
    </Modal>
  );
}
