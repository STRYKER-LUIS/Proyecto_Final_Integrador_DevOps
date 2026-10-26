import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface LogoProps {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}

export function Logo({ compact = false, inverted = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-950/30">
        <span className="absolute -right-2 -top-2 size-6 rounded-full bg-white/20 blur-md" />
        <ShieldCheck className="relative size-5 text-white" aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={cn('text-sm font-bold tracking-tight', inverted ? 'text-white' : 'text-slate-900')}>
            IT Incident Hub
          </span>
          <span
            className={cn(
              'mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
              inverted ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            Service Operations
          </span>
        </span>
      ) : null}
    </span>
  );
}
