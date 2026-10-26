import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { ROLE_LABELS } from '../../lib/labels';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Avatar } from '../ui/Avatar';
import { Logo } from '../ui/Logo';

const NAV_ITEMS = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/incidents', label: 'Incidentes', icon: Ticket, end: false },
] as const;

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast({ title: 'Sesión cerrada', description: 'Tu sesión se cerró de forma segura.', variant: 'info' });
    navigate('/login', { replace: true });
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gradient-to-b from-slate-900 via-[#0b1220] to-slate-950 text-slate-300">
      <div className="relative overflow-hidden px-5 pb-5 pt-6">
        <div className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full bg-indigo-600/20 blur-3xl" />
        <Link to="/" onClick={onNavigate} className="relative inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
          <Logo inverted />
        </Link>
      </div>

      <div className="px-4">
        <Link
          to="/incidents/new"
          onClick={onNavigate}
          className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <Plus className="size-4 transition-transform group-hover:rotate-90" aria-hidden="true" />
          Nuevo incidente
        </Link>
      </div>

      <nav className="mt-7 px-3" aria-label="Navegación principal">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Operación
        </p>
        <div className="mt-2 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                  isActive
                    ? 'bg-white/10 text-white shadow-inner shadow-white/5'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'size-[18px] transition',
                      isActive ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{label}</span>
                  {isActive ? <span className="size-1.5 rounded-full bg-indigo-400" /> : null}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="mt-7 px-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldCheck className="size-4 text-emerald-400" aria-hidden="true" />
            Operación bajo control
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            Los SLA se calculan automáticamente según la prioridad y cada acción queda auditada.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Servicio activo
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name ?? 'Usuario'} size="sm" className="ring-slate-800" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[10px] text-slate-400">
                {user ? ROLE_LABELS[user.role] : 'Sin sesión'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-600">IT Incident Hub · v1.0</p>
      </div>
    </div>
  );
}
