import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada');

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 ring-1 ring-inset ring-indigo-100">
          <Compass className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-5xl font-black tracking-tight text-slate-200">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Esta página no existe</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          La ruta que buscas no está disponible o fue movida. Vuelve al panel para continuar
          trabajando.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ir al panel
          </Link>
          <Link
            to="/incidents"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Ver incidentes
          </Link>
        </div>
      </div>
    </div>
  );
}
