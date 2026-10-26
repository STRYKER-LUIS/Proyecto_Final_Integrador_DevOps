import {
  ArrowRightLeft,
  MessageSquare,
  Pencil,
  PlusCircle,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { StatusBadge } from './IncidentBadges';
import { ACTIVITY_LABELS, ROLE_LABELS } from '../../lib/labels';
import { formatRelativeTime } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { Activity, ActivityAction } from '../../types';

const ACTION_ICONS: Record<ActivityAction, LucideIcon> = {
  CREATED: PlusCircle,
  UPDATED: Pencil,
  ASSIGNED: UserPlus,
  STATUS_CHANGED: ArrowRightLeft,
  COMMENTED: MessageSquare,
};

const ACTION_STYLES: Record<ActivityAction, string> = {
  CREATED: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  UPDATED: 'bg-sky-50 text-sky-600 ring-sky-100',
  ASSIGNED: 'bg-violet-50 text-violet-600 ring-violet-100',
  STATUS_CHANGED: 'bg-amber-50 text-amber-600 ring-amber-100',
  COMMENTED: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-slate-400">
        La bitácora está vacía por ahora.
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 px-5 py-5 sm:px-6">
      <span
        className="absolute bottom-8 left-[2.35rem] top-8 w-px bg-slate-200 sm:left-[2.85rem]"
        aria-hidden="true"
      />
      {activities.map((activity, index) => {
        const Icon = ACTION_ICONS[activity.action];
        const isLast = index === activities.length - 1;

        return (
          <li key={activity.id} className={cn('relative flex gap-3.5', !isLast && 'pb-6')}>
            <span
              className={cn(
                'relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                ACTION_STYLES[activity.action],
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-xs font-bold text-slate-800">{ACTIVITY_LABELS[activity.action]}</p>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-[11px] text-slate-400">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>

              {activity.action === 'STATUS_CHANGED' && activity.fromStatus && activity.toStatus ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={activity.fromStatus} />
                  <span className="text-[10px] font-bold text-slate-400">→</span>
                  <StatusBadge status={activity.toStatus} />
                </div>
              ) : null}

              {activity.detail ? (
                <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
                  {activity.detail}
                </p>
              ) : null}

              <div className="mt-2 flex items-center gap-2">
                {activity.actor ? (
                  <>
                    <Avatar name={activity.actor.name} size="xs" className="size-5 text-[8px]" />
                    <span className="text-[11px] text-slate-500">
                      {activity.actor.name} · {ROLE_LABELS[activity.actor.role]}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] italic text-slate-400">Sistema</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
