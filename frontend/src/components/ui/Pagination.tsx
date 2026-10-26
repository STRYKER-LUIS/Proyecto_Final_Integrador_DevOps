import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { getPageItems } from '../../lib/pagination';
import { formatNumber } from '../../lib/format';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const items = getPageItems(page, totalPages);

  const goTo = (target: number) => {
    if (disabled || target < 1 || target > totalPages || target === page) return;
    onPageChange(target);
  };

  return (
    <nav
      aria-label="Paginación de incidentes"
      className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-xs text-slate-500">
        {total === 0 ? (
          'Sin resultados'
        ) : (
          <>
            Mostrando <span className="font-semibold text-slate-700">{formatNumber(start)}</span>–
            <span className="font-semibold text-slate-700">{formatNumber(end)}</span> de{' '}
            <span className="font-semibold text-slate-700">{formatNumber(total)}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={disabled || page <= 1}
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {items.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex size-8 items-center justify-center text-xs text-slate-400"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goTo(item)}
                disabled={disabled}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Página ${item}`}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  item === page
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-xs font-medium text-slate-500 sm:hidden">
          {page} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={disabled || page >= totalPages}
          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}
