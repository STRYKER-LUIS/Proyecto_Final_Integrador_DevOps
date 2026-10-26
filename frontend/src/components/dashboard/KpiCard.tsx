import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type KpiTone = 'indigo' | 'sky' | 'amber' | 'emerald' | 'rose';

const TONES: Record<KpiTone, { icon: string; bar: string }> = {
  indigo: { icon: 'bg-indigo-50 text-indigo-600 ring-indigo-100', bar: 'bg-indigo-500' },
  sky: { icon: 'bg-sky-50 text-sky-600 ring-sky-100', bar: 'bg-sky-500' },
  amber: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', bar: 'bg-amber-500' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100', bar: 'bg-emerald-500' },
  rose: { icon: 'bg-rose-50 text-rose-600 ring-rose-100', bar: 'bg-rose-500' },
};

export interface KpiCardProps {
  label: string;
  value: string;
  helper: ReactNode;
  icon: LucideIcon;
  tone?: KpiTone;
  className?: string;
}

export function KpiCard({ label, value, helper, icon: Icon, tone = 'indigo', className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/[0.05]',
        className,
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-0.5', TONES[tone].bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            TONES[tone].icon,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 text-xs text-slate-500">{helper}</div>
    </div>
  );
}
