import { useMemo, useState, type FormEvent } from 'react';
import { Info, UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Avatar } from '../ui/Avatar';
import { ROLE_LABELS } from '../../lib/labels';
import type {
  AssignIncidentPayload,
  IncidentDetail,
  PublicUser,
} from '../../types';

export interface AssignIncidentModalProps {
  open: boolean;
  incident: IncidentDetail;
  agents: PublicUser[];
  currentUser: PublicUser;
  onClose: () => void;
  onConfirm: (payload: AssignIncidentPayload) => void;
  loading: boolean;
}

export function AssignIncidentModal({
  open,
  incident,
  agents,
  currentUser,
  onClose,
  onConfirm,
  loading,
}: AssignIncidentModalProps) {
  const availableAgents = useMemo(
    () =>
      currentUser.role === 'AGENT'
        ? agents.filter((agent) => agent.id === currentUser.id)
        : agents,
    [agents, currentUser.id, currentUser.role],
  );

  const defaultAssigneeId = useMemo(() => {
    const candidates = availableAgents.filter((agent) => agent.id !== incident.assignee?.id);
    const fallback =
      availableAgents.find((agent) => agent.id === currentUser.id) ?? availableAgents[0];

    return candidates[0]?.id ?? fallback?.id ?? '';
  }, [availableAgents, currentUser.id, incident.assignee?.id]);

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const assigneeId = selectedAssigneeId ?? defaultAssigneeId;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assigneeId) return;
    onConfirm({ assigneeId, ...(note.trim() ? { note: note.trim() } : {}) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Asignar incidente"
      description="Selecciona el responsable que continuará con la atención."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="assign-incident-form"
            loading={loading}
            disabled={!assigneeId}
            leftIcon={loading ? undefined : <UserPlus className="size-4" />}
          >
            Asignar incidente
          </Button>
        </>
      }
    >
      <form id="assign-incident-form" onSubmit={handleSubmit} className="space-y-5">
        {incident.assignee ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Avatar name={incident.assignee.name} size="sm" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Responsable actual
              </p>
              <p className="truncate text-sm font-semibold text-slate-800">
                {incident.assignee.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Este incidente aún no tiene responsable asignado.
          </div>
        )}

        <Select
          label="Responsable *"
          value={assigneeId}
          onChange={(event) => setSelectedAssigneeId(event.target.value)}
          placeholder="Selecciona un agente"
          disabled={loading || availableAgents.length === 0}
        >
          {availableAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} · {ROLE_LABELS[agent.role]}
            </option>
          ))}
        </Select>

        {currentUser.role === 'AGENT' ? (
          <p className="text-[11px] text-slate-500">
            Como agente, solo puedes asignarte incidentes a ti mismo.
          </p>
        ) : null}

        <Textarea
          label="Nota de asignación (opcional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Contexto para el responsable…"
          rows={3}
          maxLength={500}
          hint={`${note.length}/500 caracteres`}
          disabled={loading}
        />
      </form>
    </Modal>
  );
}
