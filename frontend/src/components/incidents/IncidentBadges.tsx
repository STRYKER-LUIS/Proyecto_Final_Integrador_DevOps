import {
  Box,
  CircleHelp,
  Clock,
  KeyRound,
  Laptop,
  Mail,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeTone } from '../ui/Badge';
import { cn } from '../../lib/cn';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SLA_LABELS,
  STATUS_LABELS,
} from '../../lib/labels';
import type {
  Category,
  IncidentStatus,
  Priority,
  SlaState,
} from '../../types';

const STATUS_TONES: Record<IncidentStatus, BadgeTone> = {
  NEW: 'indigo',
  ASSIGNED: 'sky',
  IN_PROGRESS: 'violet',
  ON_HOLD: 'amber',
  RESOLVED: 'emerald',
  CLOSED: 'slate',
  CANCELLED: 'rose',
};

const PRIORITY_TONES: Record<Priority, BadgeTone> = {
  LOW: 'slate',
  MEDIUM: 'sky',
  HIGH: 'amber',
  CRITICAL: 'rose',
};

const SLA_TONES: Record<SlaState, BadgeTone> = {
  ON_TRACK: 'emerald',
  AT_RISK: 'amber',
  BREACHED: 'rose',
  MET: 'emerald',
  MISSED: 'rose',
  CANCELLED: 'slate',
};

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  HARDWARE: Laptop,
  SOFTWARE: Box,
  NETWORK: Wifi,
  ACCESS: KeyRound,
  EMAIL: Mail,
  OTHER: CircleHelp,
};

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <Badge tone={PRIORITY_TONES[priority]} dot className={className}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function SlaBadge({ state, className }: { state: SlaState; className?: string }) {
  return (
    <Badge tone={SLA_TONES[state]} className={className}>
      <Clock className="size-3" aria-hidden="true" />
      {SLA_LABELS[state]}
    </Badge>
  );
}

export function CategoryLabel({ category, className }: { category: Category; className?: string }) {
  const Icon = CATEGORY_ICONS[category];

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-slate-500', className)}>
      <Icon className="size-3.5 text-slate-400" aria-hidden="true" />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className={cn('size-4', className)} aria-hidden="true" />;
}
