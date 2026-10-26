import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-indigo-600', className)} aria-hidden="true" />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} aria-hidden="true" />;
}

export function FullPageLoader({ message = 'Preparando tu espacio de trabajo…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-6">
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/20">
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/40 to-transparent" />
        <Loader2 className="size-7 animate-spin text-white" aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-800">IT Incident Hub</p>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
