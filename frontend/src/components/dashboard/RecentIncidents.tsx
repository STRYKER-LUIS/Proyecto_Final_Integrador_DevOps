import { Link } from 'react-router-dom';
import { ArrowRight, Inbox } from 'lucide-react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Avatar } from '../ui/Avatar';
import { PriorityBadge, StatusBadge } from '../incidents/IncidentBadges';
import { formatRelativeTime, formatTicketNumber, truncate } from '../../lib/format';
import type { Incident } from '../../types';

export function RecentIncidents({ incidents }: { incidents: Incident[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Actividad reciente</h2>
          <p className="mt-1 text-xs text-slate-500">Últimos incidentes actualizados.</p>
        </div>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Ver todos
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {incidents.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sin actividad todavía"
          description="Cuando se registren o actualicen incidentes aparecerán aquí."
          className="py-10"
        />
      ) : (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <Link
                to={`/incidents/${incident.id}`}
                className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold text-slate-400">
                      {incident.ticketNumber || formatTicketNumber(incident.id)}
                    </span>
                    <PriorityBadge priority={incident.priority} className="hidden sm:inline-flex" />
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
                    {truncate(incident.title, 90)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={incident.status} />
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(incident.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  {incident.assignee ? (
                    <>
                      <Avatar name={incident.assignee.name} size="xs" />
                      <span className="max-w-28 truncate text-xs text-slate-500">
                        {incident.assignee.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs italic text-slate-400">Sin asignar</span>
                  )}
                </div>
                <ArrowRight
                  className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
