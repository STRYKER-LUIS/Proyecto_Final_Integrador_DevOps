import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';
import {
  ToastContext,
  type ToastInput,
  type ToastItem,
  type ToastVariant,
} from './toast-context';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-white text-emerald-950',
  error: 'border-rose-200 bg-white text-rose-950',
  info: 'border-sky-200 bg-white text-sky-950',
};

const VARIANT_ICON_STYLES: Record<ToastVariant, string> = {
  success: 'bg-emerald-100 text-emerald-600',
  error: 'bg-rose-100 text-rose-600',
  info: 'bg-sky-100 text-sky-600',
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') return <CheckCircle2 className="size-5" aria-hidden="true" />;
  if (variant === 'error') return <AlertCircle className="size-5" aria-hidden="true" />;
  return <Info className="size-5" aria-hidden="true" />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? 'info',
      };

      setToasts((current) => [...current.slice(-3), item]);

      const timer = setTimeout(() => dismiss(id), input.duration ?? 5_000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((item) => (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl shadow-slate-900/10 animate-toast-in',
                VARIANT_STYLES[item.variant],
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                  VARIANT_ICON_STYLES[item.variant],
                )}
              >
                <ToastIcon variant={item.variant} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                aria-label="Cerrar notificación"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
