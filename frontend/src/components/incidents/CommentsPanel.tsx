import { useState, type KeyboardEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  History,
  Lock,
  MessageSquare,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Toggle } from '../ui/Toggle';
import { ActivityTimeline } from './ActivityTimeline';
import { incidentApi } from '../../services/incident.service';
import { queryKeys } from '../../lib/query-keys';
import { getApiErrorMessage } from '../../lib/api-error';
import { ROLE_LABELS } from '../../lib/labels';
import { formatRelativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useToast } from '../../hooks/useToast';
import type { IncidentDetail } from '../../types';

type Tab = 'comments' | 'activity';

export interface CommentsPanelProps {
  incident: IncidentDetail;
  canCreateInternalNotes: boolean;
}

export function CommentsPanel({ incident, canCreateInternalNotes }: CommentsPanelProps) {
  const [tab, setTab] = useState<Tab>('comments');
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (payload: { content: string; isInternal: boolean }) =>
      incidentApi.addComment(incident.id, payload),
    onSuccess: (_result, variables) => {
      setContent('');
      setIsInternal(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.incident(incident.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast({
        title: variables.isInternal ? 'Nota interna agregada' : 'Comentario publicado',
        variant: 'success',
      });
    },
    onError: (mutationError) => {
      setError(getApiErrorMessage(mutationError));
    },
  });

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Escribe un comentario antes de enviarlo.');
      return;
    }
    if (trimmed.length > 2_000) {
      setError('El comentario no puede superar los 2000 caracteres.');
      return;
    }
    setError(null);
    mutation.mutate({ content: trimmed, isInternal });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-center gap-1 border-b border-slate-100 px-3 pt-3 sm:px-4">
        <TabButton
          active={tab === 'comments'}
          onClick={() => setTab('comments')}
          icon={MessageSquare}
          label="Conversación"
          count={incident.comments.length}
        />
        <TabButton
          active={tab === 'activity'}
          onClick={() => setTab('activity')}
          icon={History}
          label="Bitácora"
          count={incident.activities.length}
        />
      </div>

      {tab === 'comments' ? (
        <div>
          {incident.comments.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <MessageSquare className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-700">Todavía no hay mensajes</p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Comparte contexto, avances o preguntas con el equipo de soporte.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {incident.comments.map((comment) => (
                <li
                  key={comment.id}
                  className={cn(
                    'flex gap-3 px-5 py-4 sm:px-6',
                    comment.isInternal && 'bg-amber-50/50',
                  )}
                >
                  <Avatar name={comment.author.name} size="sm" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-bold text-slate-800">{comment.author.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {ROLE_LABELS[comment.author.role]}
                      </span>
                      <span className="text-[11px] text-slate-300">·</span>
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      {comment.isInternal ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Lock className="size-2.5" aria-hidden="true" />
                          Interno
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {comment.content}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
            <Textarea
              aria-label="Nuevo comentario"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                canCreateInternalNotes
                  ? 'Escribe un comentario o una nota interna…'
                  : 'Escribe un comentario para el equipo de soporte…'
              }
              rows={3}
              maxLength={2_000}
              disabled={mutation.isPending}
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {canCreateInternalNotes ? (
                  <Toggle
                    checked={isInternal}
                    onChange={setIsInternal}
                    label="Nota interna"
                    description="Solo visible para el equipo de soporte."
                    disabled={mutation.isPending}
                  />
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-[11px] text-slate-400">
                  {content.length}/2000 · Ctrl + Enter para enviar
                </span>
                <Button
                  size="sm"
                  onClick={submit}
                  loading={mutation.isPending}
                  disabled={!content.trim()}
                  leftIcon={mutation.isPending ? undefined : <Send className="size-3.5" />}
                >
                  Enviar
                </Button>
              </div>
            </div>
            {error ? (
              <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <ActivityTimeline activities={incident.activities} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-2 rounded-t-lg px-3 py-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        active ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-800',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
          active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500',
        )}
      >
        {count}
      </span>
      {active ? (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600" />
      ) : null}
    </button>
  );
}
